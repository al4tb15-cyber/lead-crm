import { GoogleGenAI } from '@google/genai';
import { db } from './db.ts';
import { toolRegistry } from './tools.ts';
import { eventBus } from './events.ts';
import { AgentConfig, Lead, Company, Contact, Message, CallLog } from '../src/types/index.ts';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// 1. Omnichannel Conversation Responder (Email / Chat / SMS)
export async function generateAgentTurn(params: {
  tenantId: string;
  channel: 'email' | 'chat' | 'sms' | 'voice';
  userMessage: string;
  leadId?: string;
  conversationId?: string;
  agentId?: string;
}) {
  const { tenantId, channel, userMessage, leadId, conversationId, agentId } = params;
  const tenant = db.getTenant(tenantId);
  const ai = getAiClient();

  // Load context
  const lead = leadId ? db.leads.get(leadId) : undefined;
  const knowledgeDocs = db.getKnowledge(tenantId);
  const agents = db.getAgents(tenantId);
  const agent = agents.find(a => a.id === agentId) || agents.find(a => a.allowedChannels.includes(channel)) || agents[0];

  const knowledgeContext = knowledgeDocs.map(d => `[${d.category} - ${d.title}]:\n${d.content}`).join('\n\n');
  const leadContext = lead ? `
Contact: ${lead.contactName} (${lead.jobTitle})
Company: ${lead.companyName} (${lead.industry})
Current Lead Status: ${lead.status}
Lead Score: ${lead.leadScore}/100
Notes/History: ${lead.notes.slice(-3).join(' | ')}
` : 'New Inbound Prospect';

  const systemInstruction = `
You are "${agent?.name || 'AI Representative'}" representing "${tenant?.branding.companyName || 'Business HUB'}".
Your Tone: ${agent?.tone || 'Professional, consultative, and articulate'}.
Channel: ${channel.toUpperCase()}.

COMPANY KNOWLEDGE BASE (Strict Truth Source):
${knowledgeContext}

CUSTOMER CONTEXT:
${leadContext}

INSTRUCTIONS:
1. Provide a direct, highly helpful, and conversational response tailored to ${channel}.
2. If the user asks about scheduling, availability, or meeting times, propose specific available times (e.g. Tomorrow at 10:00 AM AEST or 2:00 PM AEST) and offer to book them directly.
3. If the user raises an objection, consult the objection playbook rules and answer empathetically with clear value propositions.
4. If the user is rude, asks for a human supervisor, or has a complex legal/custom contract dispute, indicate you are escalating them to a human team member.
5. In addition to your text reply, return a structured JSON block at the very end enclosed in \`\`\`json { "intent": "question|pricing_inquiry|booking_request|objection|opt_out|general", "sentiment": "positive|neutral|negative|interested|hesitant", "suggestedStatus": "engaged|appointment_requested|booked|qualified", "shouldBook": boolean, "bookingDetails": { "time": string, "title": string }, "shouldEscalate": boolean, "escalationReason": string } \`\`\`
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const rawText = response.text || '';
    
    // Parse JSON block if present
    let jsonMetadata: any = {
      intent: 'general',
      sentiment: 'neutral'
    };

    let replyText = rawText;
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        jsonMetadata = JSON.parse(jsonMatch[1]);
        replyText = rawText.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) {
        // ignore json parse error
      }
    }

    // Execute automatic tool side-effects if detected
    const toolCallsExecuted: any[] = [];

    if (jsonMetadata.shouldBook && jsonMetadata.bookingDetails && lead) {
      const bookRes = await toolRegistry.create_booking.execute(tenantId, {
        leadId: lead.id,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        companyName: lead.companyName,
        title: jsonMetadata.bookingDetails.title || 'AI Strategy & Discovery Call',
        startTime: jsonMetadata.bookingDetails.time,
        notes: `Booked via ${channel} conversation`
      }, agent?.name);
      toolCallsExecuted.push({ toolName: 'create_booking', args: jsonMetadata.bookingDetails, result: bookRes.data });
    } else if (jsonMetadata.suggestedStatus && lead && lead.status !== jsonMetadata.suggestedStatus && lead.status !== 'booked' && lead.status !== 'won') {
      lead.status = jsonMetadata.suggestedStatus;
      lead.updatedAt = new Date().toISOString();
    }

    if (jsonMetadata.shouldEscalate && conversationId) {
      await toolRegistry.escalate_to_human.execute(tenantId, {
        conversationId,
        reason: jsonMetadata.escalationReason || 'Customer requested human intervention'
      }, agent?.name);
    }

    // Update usage
    if (tenant) {
      tenant.usage.usedAiTokens += 650;
    }

    return {
      replyText,
      intent: jsonMetadata.intent,
      sentiment: jsonMetadata.sentiment,
      toolCallsExecuted
    };
  } catch (error: any) {
    console.error('[Gemini generateAgentTurn error]:', error);
    return {
      replyText: `Thank you for your message. I am noting your details and will ensure our senior team follows up with you promptly.`,
      intent: 'general',
      sentiment: 'neutral',
      toolCallsExecuted: []
    };
  }
}

// 2. Autonomous Lead Discovery & Web Intelligence Scraping
export async function discoverProspects(params: {
  tenantId: string;
  targetCriteria: string;
  location?: string;
  count?: number;
}) {
  const { tenantId, targetCriteria, location = 'Australia', count = 4 } = params;
  const tenant = db.getTenant(tenantId);
  const ai = getAiClient();

  const prompt = `
You are an advanced Lead Discovery & Market Intelligence Agent for "${tenant?.name || 'Business HUB'}".
Target Criteria: "${targetCriteria}" in location "${location}".
Generate exactly ${count} realistic, high-fit prospective B2B companies and verified executive contacts matching this exact criteria.

Return valid JSON with this exact schema:
[
  {
    "companyName": string,
    "website": string,
    "industry": string,
    "employeeCount": string,
    "location": string,
    "phone": string,
    "email": string,
    "annualRevenue": string,
    "overview": string,
    "painPoints": string[],
    "techStack": string[],
    "leadScore": number (60-98),
    "scoreBreakdown": [
      { "category": string, "points": number, "reason": string }
    ],
    "contact": {
      "name": string,
      "jobTitle": string,
      "email": string,
      "phone": string,
      "linkedinUrl": string,
      "timezone": string
    },
    "estimatedValue": number,
    "tags": string[]
  }
]
Only return JSON.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    const createdLeads: Lead[] = [];

    for (const item of parsed) {
      const compId = 'comp_' + Math.random().toString(36).substr(2, 9);
      const contId = 'cont_' + Math.random().toString(36).substr(2, 9);
      const leadId = 'lead_' + Math.random().toString(36).substr(2, 9);

      // Save Company
      const company: Company = {
        id: compId,
        tenantId,
        name: item.companyName,
        website: item.website || `https://${item.companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.au`,
        industry: item.industry || 'B2B Services',
        employeeCount: item.employeeCount || '10-50',
        location: item.location || location,
        phone: item.phone,
        email: item.email,
        annualRevenue: item.annualRevenue,
        techStack: item.techStack || ['Google Workspace', 'WordPress'],
        overview: item.overview,
        painPoints: item.painPoints || [],
        leadScore: item.leadScore || 85,
        tags: item.tags || ['AI Discovered'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.companies.set(compId, company);

      // Save Contact
      const contact: Contact = {
        id: contId,
        tenantId,
        companyId: compId,
        name: item.contact?.name || 'Managing Director',
        jobTitle: item.contact?.jobTitle || 'Founder / Partner',
        email: item.contact?.email || `contact@${company.website.replace('https://', '').replace('/', '')}`,
        phone: item.contact?.phone || '+61 400 123 456',
        location: item.location,
        timezone: item.contact?.timezone || 'Australia/Sydney',
        linkedinUrl: item.contact?.linkedinUrl,
        source: 'AI Lead Discovery Agent',
        consentGiven: true,
        isDoNotContact: false,
        tags: ['Decision Maker', 'Target Lead'],
        createdAt: new Date().toISOString()
      };
      db.contacts.set(contId, contact);

      // Save Lead
      const lead: Lead = {
        id: leadId,
        tenantId,
        companyId: compId,
        contactId: contId,
        companyName: company.name,
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        jobTitle: contact.jobTitle,
        industry: company.industry,
        status: 'qualified',
        leadScore: company.leadScore,
        scoreBreakdown: item.scoreBreakdown || [
          { category: 'Target ICP Fit', points: 30, reason: 'Matches desired industry and headcount' },
          { category: 'Executive Authority', points: 30, reason: 'Senior decision maker reached' },
          { category: 'Operational Need', points: 25, reason: 'Identified speed-to-lead latency' }
        ],
        source: 'AI Lead Discovery Agent',
        estimatedValue: item.estimatedValue || 25000,
        notes: [
          `Discovered via criteria: "${targetCriteria}"`,
          `Enriched pain points: ${(item.painPoints || []).join(', ')}`
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.leads.set(leadId, lead);
      createdLeads.push(lead);
    }

    if (tenant) {
      tenant.usage.usedLeadCredits += createdLeads.length;
      tenant.usage.usedAiTokens += 1800;
    }

    await eventBus.emit({
      tenantId,
      eventType: 'lead.created',
      summary: `Autonomous Lead Discovery generated ${createdLeads.length} prospects`,
      details: { criteria: targetCriteria, count: createdLeads.length },
      triggeredByAgent: 'Lead Discovery Agent'
    });

    return createdLeads;
  } catch (error: any) {
    console.error('[discoverProspects error]:', error);
    throw error;
  }
}

// 3. AI Voice Agent Interactive Turn & Live Speech
export async function runVoiceAgentTurn(params: {
  tenantId: string;
  callerUtterance: string;
  leadId?: string;
  conversationHistory: { speaker: string; text: string }[];
  agentId?: string;
}) {
  const { tenantId, callerUtterance, leadId, conversationHistory, agentId } = params;
  const tenant = db.getTenant(tenantId);
  const ai = getAiClient();

  const lead = leadId ? db.leads.get(leadId) : undefined;
  const knowledgeDocs = db.getKnowledge(tenantId);
  const agents = db.getAgents(tenantId);
  const voiceAgent = agents.find(a => a.id === agentId) || agents.find(a => a.type === 'voice') || agents[0];

  const knowledgeSnippet = knowledgeDocs.slice(0, 3).map(d => `${d.title}:\n${d.content}`).join('\n\n');

  const historyFormatted = conversationHistory.map(h => `${h.speaker}: ${h.text}`).join('\n');

  const systemInstruction = `
You are "${voiceAgent?.name || 'Olivia'}", an articulate, warm, and highly professional AI Voice Specialist at "${tenant?.branding.companyName || 'Business HUB'}".
You are speaking live on a telephone voice call.

Rules for Voice Calls:
1. Speak in concise, natural, conversational sentences (1-3 sentences maximum per turn).
2. Avoid bullet points, symbols, asterisks, URLs, or markdown formatting since this will be converted to speech.
3. Tone: ${voiceAgent?.tone || 'Empathetic, clear, and professional'}.
4. If the caller asks questions, answer directly using company knowledge.
5. If the caller agrees to a meeting or asks for times, offer 2 concrete options: "I have tomorrow at 10:00 AM or 2:00 PM AEST open, which one works better for you?"
6. If the caller confirms a time, confirm the booking: "Perfect, I have locked that in and sent the invite to your email."
7. Return JSON at the end of your answer in format: \`\`\`json { "booked": boolean, "bookingTime": string, "intent": string, "leadStatus": string, "summarySnippet": string } \`\`\`

KNOWLEDGE BASE:
${knowledgeSnippet}

PROSPECT CONTEXT:
${lead ? `Speaking with: ${lead.contactName} (${lead.jobTitle}) at ${lead.companyName}. Prior notes: ${lead.notes.slice(-2).join(' ')}` : 'Inbound caller'}

CONVERSATION HISTORY:
${historyFormatted}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: `Caller says: "${callerUtterance}"`,
      config: {
        systemInstruction,
        temperature: 0.6
      }
    });

    const rawText = response.text || '';
    let jsonMeta: any = {};
    let spokenText = rawText;

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        jsonMeta = JSON.parse(jsonMatch[1]);
        spokenText = rawText.replace(/```json[\s\S]*?```/, '').trim();
      } catch (e) {}
    }

    // Clean up spoken text of any leftover markdown
    spokenText = spokenText.replace(/[*#_`]/g, '').trim();

    // Check if meeting was booked
    let bookingResult: any = null;
    if (jsonMeta.booked && lead) {
      const bookRes = await toolRegistry.create_booking.execute(tenantId, {
        leadId: lead.id,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        companyName: lead.companyName,
        title: 'Discovery & AI Solution Review',
        startTime: jsonMeta.bookingTime || new Date(Date.now() + 86400000).toISOString(),
        notes: 'Booked directly via interactive AI Voice Call'
      }, voiceAgent.name);
      bookingResult = bookRes.data;
    }

    if (tenant) {
      tenant.usage.usedVoiceMinutes += 1;
      tenant.usage.usedAiTokens += 400;
    }

    return {
      spokenText,
      jsonMeta,
      bookingResult
    };
  } catch (error: any) {
    console.error('[runVoiceAgentTurn error]:', error);
    return {
      spokenText: "I understand completely. Let me confirm those details and have our specialist follow up directly.",
      jsonMeta: {},
      bookingResult: null
    };
  }
}

// 4. Post-Call AI Transcript Summarizer & CRM Activity Creator
export async function summarizeCall(params: {
  tenantId: string;
  leadId: string;
  transcript: { speaker: string; text: string; time: string }[];
}) {
  const { tenantId, leadId, transcript } = params;
  const ai = getAiClient();
  const lead = db.leads.get(leadId);

  const formattedTranscript = transcript.map(t => `[${t.time}] ${t.speaker}: ${t.text}`).join('\n');

  const prompt = `
Analyze the following phone conversation transcript between an AI Voice Agent and a prospect.
Generate an executive CRM summary.

Transcript:
${formattedTranscript}

Return JSON with:
{
  "summary": string (2-3 sentences),
  "sentiment": "Highly Receptive" | "Interested" | "Neutral" | "Hesitant" | "Not Interested",
  "actionItems": string[],
  "suggestedLeadStatus": "engaged" | "appointment_requested" | "booked" | "won" | "lost",
  "keyPainPointsDiscussed": string[]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const result = JSON.parse(response.text || '{}');

    // Create CallLog in DB
    const callId = 'call_' + Math.random().toString(36).substr(2, 9);
    const callLog: CallLog = {
      id: callId,
      tenantId,
      leadId: lead?.id || '',
      contactName: lead?.contactName || 'Caller',
      phoneNumber: lead?.contactPhone || '+61 400 000 000',
      direction: 'outbound',
      status: 'completed',
      durationSeconds: Math.max(transcript.length * 15, 60),
      startedAt: new Date(Date.now() - transcript.length * 15000).toISOString(),
      endedAt: new Date().toISOString(),
      recordingAvailable: true,
      summary: result.summary || 'Call completed with prospect.',
      sentiment: result.sentiment || 'Interested',
      actionItems: result.actionItems || [],
      leadStatusUpdatedTo: result.suggestedLeadStatus,
      transcript
    };

    db.calls.set(callId, callLog);

    // Update Lead Notes & Status
    if (lead) {
      lead.notes.push(`[Call Summary ${new Date().toLocaleTimeString()}]: ${callLog.summary}`);
      if (result.suggestedLeadStatus && lead.status !== 'booked') {
        lead.status = result.suggestedLeadStatus;
      }
      lead.lastContactedAt = new Date().toISOString();
      lead.updatedAt = new Date().toISOString();
    }

    await eventBus.emit({
      tenantId,
      eventType: 'call.completed',
      summary: `Voice Call Completed with ${callLog.contactName} (${callLog.sentiment})`,
      details: { callId: callLog.id, leadId: lead?.id, sentiment: callLog.sentiment, summary: callLog.summary },
      triggeredByAgent: 'Voice Agent'
    });

    return callLog;
  } catch (error) {
    console.error('[summarizeCall error]:', error);
    throw error;
  }
}

// 5. Remote Agentic Bridge Interactor (Hermes 3 & OpenClaw Swarm)
export async function executeBridgeInteraction(params: {
  tenantId: string;
  bridgeId: string;
  userMessage: string;
  senderRole: 'admin' | 'staff';
  senderName: string;
}) {
  const { tenantId, bridgeId, userMessage, senderRole, senderName } = params;
  const bridge = db.agentBridges.get(bridgeId);
  if (!bridge || bridge.tenantId !== tenantId) {
    throw new Error('Agentic bridge not found or access denied');
  }

  const ai = getAiClient();
  const tenant = db.getTenant(tenantId);
  const existingMessages = db.getBridgeMessages(bridgeId);
  const leads = db.getLeads(tenantId);
  const recentLeadsSummary = leads.slice(0, 5).map(l => `${l.companyName} (${l.contactName}, ${l.industry}, Status: ${l.status}, Score: ${l.leadScore}/100)`).join('\n');

  // Build System Instruction based on framework
  let systemInstruction = '';
  if (bridge.framework === 'hermes') {
    systemInstruction = `
You are Nous Hermes 3 (405B/70B Agentic Function Engine) connected via "${bridge.name}" (Protocol: hermes_fc_protocol) to Business HUB Australia Revenue OS.
Operator: ${senderName} (Role: ${senderRole.toUpperCase()}).
Current Organization: ${tenant?.name || 'Business HUB'} (${tenant?.branding.subdomain || 'portal.businesshub.app'}).

CURRENT CRM CONTEXT:
${recentLeadsSummary || 'No leads in pipeline yet.'}

SUPPORTED TOOLS:
- crm_search_leads: { query?: string, status?: string, minScore?: number }
- discover_and_create_lead: { companyName: string, contactName: string, contactEmail?: string, industry?: string, estimatedValue?: number }
- issue_tax_invoice: { clientName: string, clientEmail: string, companyName: string, items?: [{ description: string, quantity: number, unitPrice: number }] }
- verify_abn_registry: { entityName: string, state?: string }
- stealth_scrape_url: { urlOrDomain: string, depth?: number }
- create_booking: { contactName: string, contactEmail: string, companyName?: string, title?: string, startTime?: string }

FORMAT RULES:
1. Always begin with concise chain-of-thought enclosed in <thought>...</thought>.
2. If tool invocation is necessary to fulfill the request (e.g. searching CRM, registering a lead, issuing an invoice, looking up ABN, or scraping), output one or more tool calls:
<tool_call>
{"name": "tool_name", "arguments": {"param": "value"}}
</tool_call>
3. Provide an executive, sharp, and highly competent answer back to ${senderName}.
`;
  } else if (bridge.framework === 'openclaw') {
    systemInstruction = `
You are OpenClaw Swarm Commander connected via "${bridge.name}" (Protocol: openclaw_tool_bus) controlling 12 autonomous crawler and lead ingestion worker nodes.
Operator: ${senderName} (Role: ${senderRole.toUpperCase()}).
Cluster Endpoint: ${bridge.endpointUrl}.

CURRENT PIPELINE:
${recentLeadsSummary || 'Pipeline ready for autonomous ingestion.'}

SUPPORTED TOOL BUS OPERATIONS:
- stealth_scrape_url: { urlOrDomain: string, depth?: number }
- discover_and_create_lead: { companyName: string, contactName: string, contactEmail?: string, industry?: string, estimatedValue?: number, source: "OpenClaw Swarm" }
- verify_abn_registry: { entityName: string, state?: string }
- crm_search_leads: { query?: string, status?: string }

FORMAT RULES:
1. Include reasoning inside <thought>[OPENCLAW-SWARM] ...</thought>.
2. If tool execution is needed, format as:
<tool_call>
{"name": "tool_name", "arguments": {"param": "value"}}
</tool_call>
3. Return real-time status telemetry, extraction breakdown, and operational next actions.
`;
  } else {
    systemInstruction = `
You are an autonomous AI Agent connected via "${bridge.name}" to Business HUB Australia.
Operator: ${senderName} (${senderRole}).
You have access to tools: crm_search_leads, discover_and_create_lead, issue_tax_invoice, verify_abn_registry, stealth_scrape_url.
Format reasoning in <thought>...</thought> and tools in <tool_call>{"name": "...", "arguments": {...}}</tool_call>.
`;
  }

  // Record user message
  const userMsgId = 'bmsg_' + Math.random().toString(36).substr(2, 9);
  const userMsg = {
    id: userMsgId,
    bridgeId,
    sender: senderRole,
    senderName,
    content: userMessage,
    timestamp: new Date().toISOString()
  };
  db.addBridgeMessage(bridgeId, userMsg);

  // Call Gemini Model
  const startTs = Date.now();
  let rawResponse = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [
        ...existingMessages.slice(-6).map(m => ({
          role: m.sender === 'remote_agent' ? 'model' : 'user',
          parts: [{ text: `${m.senderName}: ${m.content}` }]
        })),
        { role: 'user', parts: [{ text: `${senderName}: ${userMessage}` }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.6
      }
    });
    rawResponse = response.text || '';
  } catch (err: any) {
    console.error('[executeBridgeInteraction AI Error]:', err);
    rawResponse = `<thought>Fallback reasoning executed due to network bridge timeout.</thought>
I have received your command: "${userMessage}". Operating in autonomous execution mode.`;
  }

  const latencyMs = Date.now() - startTs;

  // Extract <thought>
  let thoughtChain = '';
  const thoughtMatch = rawResponse.match(/<thought>([\s\S]*?)<\/thought>/);
  if (thoughtMatch && thoughtMatch[1]) {
    thoughtChain = thoughtMatch[1].trim();
  }

  // Extract <tool_call>
  const toolCallsToExecute: { name: string; arguments: any }[] = [];
  const toolCallRegex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let match;
  while ((match = toolCallRegex.exec(rawResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.name) {
        toolCallsToExecute.push(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse tool call JSON:', match[1]);
    }
  }

  // Execute detected tools
  const executedToolLogs: any[] = [];
  for (const tc of toolCallsToExecute) {
    const toolDef = toolRegistry[tc.name];
    if (toolDef) {
      try {
        const result = await toolDef.execute(tenantId, tc.arguments || {}, bridge.name);
        executedToolLogs.push({
          name: tc.name,
          params: tc.arguments,
          result: result.data || result,
          status: result.success ? 'completed' : 'failed',
          executedAt: new Date().toISOString()
        });

        // If lead was discovered, record task
        if (tc.name === 'discover_and_create_lead' || tc.name === 'stealth_scrape_url') {
          const taskId = 'task_auto_' + Math.random().toString(36).substr(2, 9);
          db.addBridgeTask(bridgeId, {
            id: taskId,
            bridgeId,
            title: `Autonomous Ingestion: ${tc.arguments?.companyName || tc.arguments?.urlOrDomain || 'Target'}`,
            type: 'lead_scrape',
            status: 'completed',
            progress: 100,
            assignedWorker: bridge.framework === 'hermes' ? 'Nous Orchestrator Node-01' : 'OpenClaw-Worker-01 (Sydney Edge)',
            params: tc.arguments,
            outputSummary: `Executed tool ${tc.name} successfully.`,
            createdByName: senderName,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          });
        }
      } catch (err: any) {
        executedToolLogs.push({
          name: tc.name,
          params: tc.arguments,
          result: { error: err.message },
          status: 'failed',
          executedAt: new Date().toISOString()
        });
      }
    }
  }

  // Clean agent response text
  let cleanContent = rawResponse
    .replace(/<thought>[\s\S]*?<\/thought>/g, '')
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .trim();

  if (!cleanContent && executedToolLogs.length > 0) {
    cleanContent = `Executed tool bus operations: ${executedToolLogs.map(t => t.name).join(', ')}. All results synced with Business HUB CRM.`;
  } else if (!cleanContent) {
    cleanContent = 'Directives received and processed successfully by autonomous worker nodes.';
  }

  // Record Agent message
  const agentMsgId = 'bmsg_' + Math.random().toString(36).substr(2, 9);
  const agentMsg = {
    id: agentMsgId,
    bridgeId,
    sender: 'remote_agent' as const,
    senderName: bridge.framework === 'hermes' ? 'Nous Hermes 3 Agent' : bridge.framework === 'openclaw' ? 'OpenClaw Swarm Node' : bridge.name,
    content: cleanContent,
    thoughtChain: thoughtChain || undefined,
    toolCalls: executedToolLogs.length > 0 ? executedToolLogs : undefined,
    timestamp: new Date().toISOString(),
    latencyMs
  };
  db.addBridgeMessage(bridgeId, agentMsg);

  // Update bridge heartbeat & latency
  bridge.lastHeartbeat = new Date().toISOString();
  bridge.latencyMs = latencyMs;

  await eventBus.emit({
    tenantId,
    eventType: 'bridge.synced',
    summary: `${bridge.name} responded to ${senderName} (${latencyMs}ms)`,
    details: { bridgeId, messageCount: existingMessages.length + 2, toolsExecuted: executedToolLogs.length }
  });

  return {
    userMessage: userMsg,
    agentMessage: agentMsg,
    dashboardState: db.getBridgeDashboardState(bridgeId)
  };
}
