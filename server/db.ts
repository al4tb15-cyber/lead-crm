import {
  Tenant,
  User,
  Company,
  Contact,
  Lead,
  AgentConfig,
  Conversation,
  Message,
  CallLog,
  Appointment,
  KnowledgeDocument,
  Campaign,
  PlatformEvent,
  CloudApiConfig,
  AgenticBridgeConfig,
  BridgeMessage,
  BridgeWorkerNode,
  BridgeTask,
  BridgeDashboardState,
  Invoice,
  PaymentTransaction,
  EmailDispatchLog
} from '../src/types/index.ts';

class DatabaseStore {
  tenants: Map<string, Tenant> = new Map();
  users: Map<string, User> = new Map();
  companies: Map<string, Company> = new Map();
  contacts: Map<string, Contact> = new Map();
  leads: Map<string, Lead> = new Map();
  agents: Map<string, AgentConfig> = new Map();
  conversations: Map<string, Conversation> = new Map();
  calls: Map<string, CallLog> = new Map();
  appointments: Map<string, Appointment> = new Map();
  knowledge: Map<string, KnowledgeDocument> = new Map();
  campaigns: Map<string, Campaign> = new Map();
  events: PlatformEvent[] = [];

  // New Stores for Cloud API, Bridges, Invoices & Emails
  cloudApis: Map<string, CloudApiConfig> = new Map();
  agentBridges: Map<string, AgenticBridgeConfig> = new Map();
  bridgeMessages: Map<string, BridgeMessage[]> = new Map();
  bridgeWorkers: Map<string, BridgeWorkerNode[]> = new Map();
  bridgeTasks: Map<string, BridgeTask[]> = new Map();
  invoices: Map<string, Invoice> = new Map();
  payments: Map<string, PaymentTransaction> = new Map();
  emails: Map<string, EmailDispatchLog> = new Map();

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    // 1. Business HUB (Tenant #1 - Platform Owner)
    const bhId = 'tenant_business_hub';
    this.tenants.set(bhId, {
      id: bhId,
      name: 'Business HUB Australia',
      slug: 'business-hub',
      plan: 'enterprise',
      status: 'active',
      isPlatformOwner: true,
      createdAt: '2026-01-10T00:00:00.000Z',
      branding: {
        companyName: 'Business HUB',
        primaryColor: '#0f172a',
        accentColor: '#6366f1',
        subdomain: 'portal.businesshub.app',
        customDomain: 'portal.businesshub.app',
        voiceGender: 'male',
        voiceStyle: 'consultative'
      },
      limits: {
        monthlyLeadCredits: 50000,
        monthlyAiTokens: 100000000,
        monthlyVoiceMinutes: 5000,
        monthlyEmailVolume: 250000,
        maxUsers: 100,
        maxAgents: 50
      },
      usage: {
        usedLeadCredits: 12450,
        usedAiTokens: 14200000,
        usedVoiceMinutes: 840,
        usedEmailVolume: 42100,
        currentEstimatedCost: 412.50
      },
      complianceSettings: {
        australianCompliance: true,
        gdprCompliant: true,
        canSpamCompliant: true,
        callRecordingDisclosure: true,
        dataRetentionDays: 365,
        doNotContactEnforced: true
      }
    });

    // 2. Client Company A: Apex Legal & Compliance Partners
    const apexId = 'tenant_apex_legal';
    this.tenants.set(apexId, {
      id: apexId,
      name: 'Apex Legal & Compliance',
      slug: 'apex-legal',
      plan: 'professional',
      status: 'active',
      isPlatformOwner: false,
      createdAt: '2026-02-01T00:00:00.000Z',
      branding: {
        companyName: 'Apex Legal',
        primaryColor: '#1e293b',
        accentColor: '#059669',
        subdomain: 'apex.portal.businesshub.app',
        customDomain: 'clients.apexlegal.com.au',
        voiceGender: 'female',
        voiceStyle: 'professional'
      },
      limits: {
        monthlyLeadCredits: 10000,
        monthlyAiTokens: 25000000,
        monthlyVoiceMinutes: 1200,
        monthlyEmailVolume: 50000,
        maxUsers: 15,
        maxAgents: 10
      },
      usage: {
        usedLeadCredits: 3820,
        usedAiTokens: 5120000,
        usedVoiceMinutes: 310,
        usedEmailVolume: 11400,
        currentEstimatedCost: 128.40
      },
      complianceSettings: {
        australianCompliance: true,
        gdprCompliant: true,
        canSpamCompliant: true,
        callRecordingDisclosure: true,
        dataRetentionDays: 180,
        doNotContactEnforced: true
      }
    });

    // 3. Client Company B: Nexus Commercial Advisory
    const nexusId = 'tenant_nexus_realty';
    this.tenants.set(nexusId, {
      id: nexusId,
      name: 'Nexus Commercial Advisory',
      slug: 'nexus-advisory',
      plan: 'growth',
      status: 'active',
      isPlatformOwner: false,
      createdAt: '2026-03-12T00:00:00.000Z',
      branding: {
        companyName: 'Nexus Commercial',
        primaryColor: '#18181b',
        accentColor: '#d97706',
        subdomain: 'nexus.portal.businesshub.app',
        voiceGender: 'male',
        voiceStyle: 'energetic'
      },
      limits: {
        monthlyLeadCredits: 5000,
        monthlyAiTokens: 10000000,
        monthlyVoiceMinutes: 500,
        monthlyEmailVolume: 20000,
        maxUsers: 5,
        maxAgents: 5
      },
      usage: {
        usedLeadCredits: 1940,
        usedAiTokens: 2400000,
        usedVoiceMinutes: 145,
        usedEmailVolume: 6200,
        currentEstimatedCost: 64.20
      },
      complianceSettings: {
        australianCompliance: true,
        gdprCompliant: false,
        canSpamCompliant: true,
        callRecordingDisclosure: true,
        dataRetentionDays: 90,
        doNotContactEnforced: true
      }
    });

    // Seed Multi-Persona Users (Super Admin, Staff, Client)
    const u1: User = {
      id: 'usr_super_admin',
      tenantId: bhId,
      name: 'Alexander Ross',
      email: 'al4tb15@gmail.com',
      role: 'super_admin',
      active: true,
      lastLogin: new Date().toISOString(),
      companyName: 'Business HUB Platform Owner'
    };
    const u2: User = {
      id: 'usr_staff_sarah',
      tenantId: bhId,
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@businesshub.app',
      role: 'staff',
      active: true,
      lastLogin: new Date().toISOString(),
      companyName: 'Business HUB Revenue Team'
    };
    const u3: User = {
      id: 'usr_staff_marcus',
      tenantId: bhId,
      name: 'Marcus Vance',
      email: 'marcus@businesshub.app',
      role: 'sales_user',
      active: true,
      lastLogin: new Date().toISOString(),
      companyName: 'Business HUB Outbound Squad'
    };
    const u4: User = {
      id: 'usr_client_james',
      tenantId: apexId,
      name: 'James Thornton (Client)',
      email: 'james.thornton@apexlegal.com.au',
      role: 'client',
      active: true,
      lastLogin: new Date().toISOString(),
      companyName: 'Apex Legal Client Portal'
    };
    const u5: User = {
      id: 'usr_client_claire',
      tenantId: nexusId,
      name: 'Claire Sterling (Client)',
      email: 'claire@nexusadvisory.com.au',
      role: 'client',
      active: true,
      lastLogin: new Date().toISOString(),
      companyName: 'Nexus Commercial Portal'
    };

    this.users.set(u1.id, u1);
    this.users.set(u2.id, u2);
    this.users.set(u3.id, u3);
    this.users.set(u4.id, u4);
    this.users.set(u5.id, u5);

    // Seed Cloud API Provider configurations
    this.seedCloudApis(bhId);
    this.seedCloudApis(apexId);

    // Seed Agentic Bridges (Hermes, OpenClaw, LangGraph)
    this.seedAgenticBridges(bhId);
    this.seedAgenticBridges(apexId);

    // Seed Agents for Business HUB
    this.seedAgentsForTenant(bhId, 'Business HUB AI');
    this.seedAgentsForTenant(apexId, 'Apex Legal AI');
    this.seedAgentsForTenant(nexusId, 'Nexus AI');

    // Seed Companies, Contacts, and Leads
    this.seedCrmData(bhId);
    this.seedCrmData(apexId);

    // Seed Knowledge Documents
    this.seedKnowledgeData(bhId);

    // Seed Campaigns
    this.seedCampaignsData(bhId);
    this.seedCampaignsData(apexId);

    // Seed Invoices, Payment Transactions, and Email Logs
    this.seedBillingAndEmailData(bhId);
    this.seedBillingAndEmailData(apexId);
  }

  seedCloudApis(tenantId: string) {
    const defaultConfigs: CloudApiConfig[] = [
      {
        id: `api_gemini_${tenantId}`,
        tenantId,
        provider: 'google_gemini',
        model: 'gemini-2.5-flash',
        apiKeyMasked: 'AIzaSy...7B9x2',
        isDefault: true,
        temperature: 0.7,
        maxTokens: 8192,
        rateLimitRpm: 120,
        status: 'active',
        lastPingMs: 142,
        enabledCapabilities: ['function_calling', 'search_grounding', 'live_audio_synthesis', 'json_mode', 'thinking_budget'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `api_claude_${tenantId}`,
        tenantId,
        provider: 'anthropic_claude',
        model: 'claude-3-7-sonnet',
        apiKeyMasked: 'sk-ant-api03-...K9m1',
        isDefault: false,
        temperature: 0.6,
        maxTokens: 4096,
        rateLimitRpm: 80,
        status: 'active',
        lastPingMs: 210,
        enabledCapabilities: ['computer_use', 'extended_thinking', 'structured_outputs', 'rag_extraction'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `api_openai_${tenantId}`,
        tenantId,
        provider: 'openai_gpt',
        model: 'gpt-4o',
        apiKeyMasked: 'sk-proj-...8vT3',
        isDefault: false,
        temperature: 0.7,
        maxTokens: 4096,
        rateLimitRpm: 100,
        status: 'active',
        lastPingMs: 185,
        enabledCapabilities: ['tool_use', 'voice_realtime', 'vision_multimodal'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `api_deepseek_${tenantId}`,
        tenantId,
        provider: 'deepseek',
        model: 'deepseek-r1',
        apiKeyMasked: 'sk-ds-...3a8F',
        isDefault: false,
        temperature: 0.5,
        maxTokens: 8192,
        rateLimitRpm: 60,
        status: 'active',
        lastPingMs: 290,
        enabledCapabilities: ['reasoning_chain', 'deep_research', 'code_synthesis'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `api_custom_${tenantId}`,
        tenantId,
        provider: 'custom_endpoint',
        model: 'vllm-qwen2.5-72b-instruct',
        baseUrl: 'https://vllm.portal.businesshub.app/v1',
        apiKeyMasked: 'bearer_sec_...9xL4',
        isDefault: false,
        temperature: 0.7,
        maxTokens: 4096,
        rateLimitRpm: 300,
        status: 'active',
        lastPingMs: 45,
        enabledCapabilities: ['high_throughput', 'on_prem_compliance', 'data_sovereignty'],
        updatedAt: new Date().toISOString()
      }
    ];

    defaultConfigs.forEach(c => this.cloudApis.set(c.id, c));
  }

  seedAgenticBridges(tenantId: string) {
    const bridges: AgenticBridgeConfig[] = [
      {
        id: `bridge_hermes_${tenantId}`,
        tenantId,
        framework: 'hermes',
        name: 'Nous Hermes Agentic Function Bridge',
        endpointUrl: 'https://hermes-agent.portal.businesshub.app/api/v2/agents/revenue-orchestrator',
        authTokenMasked: 'hermes_live_sec_...74E2',
        protocol: 'hermes_fc_protocol',
        status: 'connected',
        latencyMs: 118,
        activeWorkers: 6,
        supportedTools: ['web_scraper', 'australian_abn_lookup', 'apollo_lead_enricher', 'calendar_dispatcher', 'call_dialer'],
        routingPriority: 1,
        lastHeartbeat: new Date(Date.now() - 12000).toISOString(),
        description: 'Direct function-calling protocol bridge syncing Autonomous Hermes agents with CRM state and multi-channel voice.'
      },
      {
        id: `bridge_openclaw_${tenantId}`,
        tenantId,
        framework: 'openclaw',
        name: 'OpenClaw Autonomous Swarm Tool-Bus',
        endpointUrl: 'https://openclaw.portal.businesshub.app/cluster/nodes/sydney-01',
        authTokenMasked: 'claw_worker_tok_...92A1',
        protocol: 'openclaw_tool_bus',
        status: 'connected',
        latencyMs: 94,
        activeWorkers: 12,
        supportedTools: ['stealth_browser', 'linkedin_deep_crawler', 'phone_audio_stream', 'crm_event_emitter'],
        routingPriority: 2,
        lastHeartbeat: new Date(Date.now() - 5000).toISOString(),
        description: 'High-throughput OpenClaw crawler and worker swarm executing autonomous lead research, qualification, and automated pipeline updates.'
      },
      {
        id: `bridge_langgraph_${tenantId}`,
        tenantId,
        framework: 'langgraph',
        name: 'LangGraph State-Machine Closer',
        endpointUrl: 'https://langgraph.portal.businesshub.app/deployments/revenue-graph',
        authTokenMasked: 'lg_deploy_...55C0',
        protocol: 'rest_webhook',
        status: 'syncing',
        latencyMs: 165,
        activeWorkers: 3,
        supportedTools: ['contract_generator', 'stripe_invoice_issuer', 'qualification_scorer'],
        routingPriority: 3,
        lastHeartbeat: new Date(Date.now() - 34000).toISOString(),
        description: 'Cyclical state-machine graph handling complex B2B objection handling, quote calculations, and contract generation.'
      }
    ];

    bridges.forEach(b => {
      this.agentBridges.set(b.id, b);

      if (b.framework === 'hermes') {
        this.bridgeWorkers.set(b.id, [
          {
            id: `w_hermes_1_${tenantId}`,
            name: 'Nous Orchestrator Node-01',
            role: 'Function-Calling Planner & CoT Reasoning',
            framework: 'hermes',
            status: 'active',
            currentTask: 'Supervising CRM Lead Qualification Bus',
            tasksCompleted: 84,
            memoryUsageMb: 420,
            cpuUsagePercent: 18,
            lastLog: '[HERMES-FC] Ingested 3 inbound lead enrichment requests. XML tool-calling active.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_hermes_2_${tenantId}`,
            name: 'Nous ABN & Registry Enricher',
            role: 'Australian ASIC/ABN Verifier & Scoring',
            framework: 'hermes',
            status: 'active',
            currentTask: 'ABN Verification for New CRM Leads',
            tasksCompleted: 142,
            memoryUsageMb: 580,
            cpuUsagePercent: 28,
            lastLog: '[HERMES-TOOL] Verified GST registration for Apex Legal & Aurora Power.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_hermes_3_${tenantId}`,
            name: 'Nous Voice & Objection Node',
            role: 'Sub-second Voice Dialogue Synthesizer',
            framework: 'hermes',
            status: 'active',
            currentTask: 'Live Session Streaming (AEST Call Queue)',
            tasksCompleted: 49,
            memoryUsageMb: 360,
            cpuUsagePercent: 14,
            lastLog: '[HERMES-VOICE] Generated objection counter-arguments for enterprise proposals.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_hermes_4_${tenantId}`,
            name: 'Nous Tax Invoice & Stripe Bus',
            role: 'Stripe Billing & GST Pipeline Dispatcher',
            framework: 'hermes',
            status: 'idle',
            tasksCompleted: 26,
            memoryUsageMb: 240,
            cpuUsagePercent: 4,
            lastLog: '[HERMES-STRIPE] Issued INV-2026-0041 ($6,600.00 AUD) with automated receipt.',
            lastHeartbeat: new Date().toISOString()
          }
        ]);

        this.bridgeTasks.set(b.id, [
          {
            id: `task_h_1_${tenantId}`,
            bridgeId: b.id,
            title: 'ASIC Registry & ABN Enrichment for Clean Tech Sector',
            type: 'crm_enrich',
            status: 'completed',
            progress: 100,
            assignedWorker: 'Nous ABN & Registry Enricher',
            params: { sector: 'Renewable Energy', minScore: 70 },
            outputSummary: 'Enriched 18 prospect records with verified ABN, director names, and registered GST status.',
            createdByName: 'Alexander Ross',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            completedAt: new Date(Date.now() - 86400000 + 45000).toISOString()
          },
          {
            id: `task_h_2_${tenantId}`,
            bridgeId: b.id,
            title: 'Autonomous Outreach Synthesis (Sydney Legal & Wealth)',
            type: 'voice_campaign',
            status: 'running',
            progress: 68,
            assignedWorker: 'Nous Voice & Objection Node',
            params: { targetAudience: 'NSW Managing Partners', scheduleTime: '10:00 AM AEST' },
            outputSummary: 'Dialed 8/12 verified decision makers with zero DNCR flags.',
            createdByName: 'Sarah Jenkins',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ]);

        this.bridgeMessages.set(b.id, [
          {
            id: `msg_h_1_${tenantId}`,
            bridgeId: b.id,
            sender: 'system',
            senderName: 'Hermes Bridge Protocol',
            content: 'Nous Hermes Agentic Function Bridge initialized on port 8092. Protocol: hermes_fc_protocol. 4 worker nodes online with subscribed tool buses: [crm_search, abn_lookup, draft_invoice, dispatch_voice].',
            timestamp: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: `msg_h_2_${tenantId}`,
            bridgeId: b.id,
            sender: 'remote_agent',
            senderName: 'Nous Hermes 3 (405B Bridge)',
            content: 'Greetings, Revenue Team. I am the remote Nous Hermes autonomous orchestrator. I have direct function-calling execution hooks into your CRM, Stripe billing, and Australian compliance validation. Send me commands or task missions anytime.',
            thoughtChain: '<thought>\nInitialized function registry: crm_search, enrich_lead, issue_tax_invoice, verify_abn, dial_lead.\nTenant context: Business HUB Australia.\nState: Ready for operator directives.\n</thought>',
            timestamp: new Date(Date.now() - 86400000 + 5000).toISOString()
          }
        ]);
      } else if (b.framework === 'openclaw') {
        this.bridgeWorkers.set(b.id, [
          {
            id: `w_claw_1_${tenantId}`,
            name: 'OpenClaw-Worker-01 (Sydney Edge)',
            role: 'Headless Chromium Cluster & Stealth Scraper',
            framework: 'openclaw',
            status: 'active',
            currentTask: 'Scraping Commercial Advisory Directories (NSW/VIC)',
            tasksCompleted: 218,
            memoryUsageMb: 860,
            cpuUsagePercent: 42,
            lastLog: '[STEALTH-CRAWLER] Extracted 34 validated business profiles with direct phone lines.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_claw_2_${tenantId}`,
            name: 'OpenClaw-Worker-02 (Melbourne Edge)',
            role: 'B2B Executive & LinkedIn Entity Resolver',
            framework: 'openclaw',
            status: 'active',
            currentTask: 'Resolving C-Suite Emails & Direct Mobile Numbers',
            tasksCompleted: 174,
            memoryUsageMb: 720,
            cpuUsagePercent: 35,
            lastLog: '[ENTITY-RESOLVER] Matched 22 Managing Directors across Australian Companies Register.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_claw_3_${tenantId}`,
            name: 'OpenClaw-Worker-03 (Brisbane Edge)',
            role: 'Residential Proxy & Captcha Solver Pool',
            framework: 'openclaw',
            status: 'active',
            currentTask: 'Proxy Rotation (40 Australian Residential IPs)',
            tasksCompleted: 430,
            memoryUsageMb: 490,
            cpuUsagePercent: 19,
            lastLog: '[PROXY-ROTATOR] 99.8% stealth success rate across 1,850 HTTP requests.',
            lastHeartbeat: new Date().toISOString()
          },
          {
            id: `w_claw_4_${tenantId}`,
            name: 'OpenClaw-Worker-04 (Cloud Tool-Bus)',
            role: 'Real-time Event Streamer & CRM Push Gateway',
            framework: 'openclaw',
            status: 'idle',
            tasksCompleted: 112,
            memoryUsageMb: 310,
            cpuUsagePercent: 6,
            lastLog: '[BUS-GATEWAY] Streamed 24 new qualified leads directly into CRM pipeline.',
            lastHeartbeat: new Date().toISOString()
          }
        ]);

        this.bridgeTasks.set(b.id, [
          {
            id: `task_c_1_${tenantId}`,
            bridgeId: b.id,
            title: 'High-Concurrency Crawl: Australian Renewable Infrastructure',
            type: 'lead_scrape',
            status: 'completed',
            progress: 100,
            assignedWorker: 'OpenClaw-Worker-01 (Sydney Edge)',
            params: { keywords: 'Solar Infrastructure EPC Australia', count: 25 },
            outputSummary: 'Scraped 25 verified corporate profiles, found 19 direct executive contacts with ABNs.',
            createdByName: 'Alexander Ross',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            completedAt: new Date(Date.now() - 7200000 + 52000).toISOString()
          },
          {
            id: `task_c_2_${tenantId}`,
            bridgeId: b.id,
            title: 'Deep Stealth Scraping: Commercial Law & Accounting NSW',
            type: 'lead_scrape',
            status: 'running',
            progress: 82,
            assignedWorker: 'OpenClaw-Worker-02 (Melbourne Edge)',
            params: { location: 'Sydney CBD & Parramatta', industry: 'Legal & Accounting' },
            outputSummary: 'Processed 38/45 company directories. 31 phone numbers verified.',
            createdByName: 'Sarah Jenkins',
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ]);

        this.bridgeMessages.set(b.id, [
          {
            id: `msg_c_1_${tenantId}`,
            bridgeId: b.id,
            sender: 'system',
            senderName: 'OpenClaw Swarm Bus',
            content: 'OpenClaw Autonomous Swarm connected on cluster endpoint sydney-01. 12 worker nodes online. Stealth crawler cluster ready.',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: `msg_c_2_${tenantId}`,
            bridgeId: b.id,
            sender: 'remote_agent',
            senderName: 'OpenClaw Swarm Commander',
            content: 'OpenClaw Swarm Node Sydney-01 operational. Provide me targets to crawl, directories to extract, or instruct me to automatically discover and push qualified leads into your pipeline.',
            timestamp: new Date(Date.now() - 7200000 + 4000).toISOString()
          }
        ]);
      } else {
        this.bridgeWorkers.set(b.id, [
          {
            id: `w_lg_1_${tenantId}`,
            name: 'LangGraph State Node-01',
            role: 'State Graph Evaluator & Closer',
            framework: 'langgraph',
            status: 'active',
            tasksCompleted: 45,
            memoryUsageMb: 390,
            cpuUsagePercent: 12,
            lastLog: '[GRAPH-RUNNER] Transitioned 3 leads to contract_ready state.',
            lastHeartbeat: new Date().toISOString()
          }
        ]);

        this.bridgeTasks.set(b.id, []);
        this.bridgeMessages.set(b.id, [
          {
            id: `msg_lg_1_${tenantId}`,
            bridgeId: b.id,
            sender: 'system',
            senderName: 'LangGraph Engine',
            content: 'LangGraph cyclical state-machine connected. Waiting for pipeline events.',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    });
  }

  seedBillingAndEmailData(tenantId: string) {
    const inv1: Invoice = {
      id: `inv_101_${tenantId}`,
      tenantId,
      invoiceNumber: 'INV-2026-0041',
      leadId: `lead_1_${tenantId}`,
      clientName: 'David Sterling',
      clientEmail: 'david.sterling@aurorapower.com.au',
      companyName: 'Aurora Renewable Energy Pty Ltd',
      items: [
        { id: 'item_1', description: 'Autonomous AI Lead Generation & Outreach (Q3 Monthly Retainer)', quantity: 1, unitPrice: 4500, total: 4500 },
        { id: 'item_2', description: 'Voice Engine Setup & Australian DNCR Compliance Pack', quantity: 1, unitPrice: 1500, total: 1500 }
      ],
      subtotal: 6000,
      tax: 600, // 10% GST
      total: 6600,
      currency: 'AUD',
      status: 'paid',
      issuedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 9).toISOString(),
      paidAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      paymentMethod: 'Credit Card (Stripe)',
      paymentLinkUrl: `https://portal.businesshub.app/pay/inv_101_${tenantId}`,
      stripePaymentIntentId: 'pi_3MtwxX4vE2wNo01F1a82hU9z',
      notes: 'Payment confirmed via automated Stripe integration. Instant invoice receipt dispatched.'
    };

    const inv2: Invoice = {
      id: `inv_102_${tenantId}`,
      tenantId,
      invoiceNumber: 'INV-2026-0042',
      leadId: `lead_2_${tenantId}`,
      clientName: 'Elena Rostova',
      clientEmail: 'elena@solarpulse.com.au',
      companyName: 'SolarPulse Infrastructure Ltd',
      items: [
        { id: 'item_3', description: 'AI Revenue OS Enterprise Pilot & 24/7 Voice Dialing (Deposit)', quantity: 1, unitPrice: 3800, total: 3800 }
      ],
      subtotal: 3800,
      tax: 380,
      total: 4180,
      currency: 'AUD',
      status: 'sent',
      issuedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 12).toISOString(),
      paymentLinkUrl: `https://portal.businesshub.app/pay/inv_102_${tenantId}`,
      notes: 'Automated invoice email sent. Awaiting direct debit or card payment.'
    };

    this.invoices.set(inv1.id, inv1);
    this.invoices.set(inv2.id, inv2);

    // Payments
    const pay1: PaymentTransaction = {
      id: `pay_tx_901_${tenantId}`,
      tenantId,
      invoiceId: inv1.id,
      leadId: inv1.leadId,
      amount: 6600,
      currency: 'AUD',
      status: 'succeeded',
      payerName: 'David Sterling',
      payerEmail: 'david.sterling@aurorapower.com.au',
      paymentMethodType: 'card',
      receiptUrl: `https://portal.businesshub.app/receipts/rec_901_${tenantId}.pdf`,
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      emailReceiptSent: true
    };
    this.payments.set(pay1.id, pay1);

    // Email logs
    const emailLogs: EmailDispatchLog[] = [
      {
        id: `email_log_1_${tenantId}`,
        tenantId,
        toEmail: 'david.sterling@aurorapower.com.au',
        toName: 'David Sterling',
        fromName: 'Business HUB Revenue Engine',
        subject: 'Tax Invoice & Receipt #INV-2026-0041 - Aurora Renewable Energy',
        bodyPreview: 'Thank you for your payment of $6,600.00 AUD. Your receipt and active subscription onboarding pack are enclosed.',
        category: 'payment_receipt',
        status: 'opened',
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: `email_log_2_${tenantId}`,
        toEmail: 'elena@solarpulse.com.au',
        tenantId,
        toName: 'Elena Rostova',
        fromName: 'Business HUB Revenue Engine',
        subject: 'Invoice #INV-2026-0042 from Business HUB Australia',
        bodyPreview: 'Please find attached Invoice #INV-2026-0042 for $4,180.00 AUD due on 30 Aug 2026. Click the secure payment link to complete checkout.',
        category: 'invoice_dispatch',
        status: 'delivered',
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];

    emailLogs.forEach(em => this.emails.set(em.id, em));
  }

  seedAgentsForTenant(tenantId: string, companyPrefix: string) {
    const agentsList: AgentConfig[] = [
      {
        id: `agent_orch_${tenantId}`,
        tenantId,
        type: 'orchestrator',
        name: `${companyPrefix} Lead Orchestrator`,
        description: 'Supervises lead lifecycle, event state machine, and triggers specialist sub-agents.',
        active: true,
        personality: 'Executive, tactical, disciplined',
        tone: 'Professional & decisive',
        promptInstruction: 'Analyze real-time events, evaluate lead scoring thresholds, and orchestrate outreach tasks across voice, email, and chat.',
        model: 'gemini-2.5-flash',
        cloudProvider: 'google_gemini',
        allowedChannels: ['email', 'sms', 'chat', 'voice'],
        qualificationRules: ['Require Australian corporate domain', 'Annual revenue > $2M', 'Clear business decision maker identified'],
        objectionHandlingRules: [
          { objection: 'Not interested right now', counterStrategy: 'Acknowledge timeline, offer 1-page compliance audit with zero commitment.' }
        ],
        bookingRules: { preferredAppointmentType: 'Discovery Call', calendarId: 'primary', minNoticeHours: 12 },
        escalationRules: [{ triggerCondition: 'Lead explicitly asks for custom contract or enterprise terms', escalateTo: 'Alexander Ross' }],
        enabledTools: ['scrapeWebsite', 'enrichCompany', 'qualifyLead', 'bookAppointment', 'sendEmail'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `agent_voice_${tenantId}`,
        tenantId,
        type: 'voice',
        name: `${companyPrefix} Phone Voice Specialist`,
        description: 'Conducts natural, latency-free outbound qualification calls and books meetings directly.',
        active: true,
        personality: 'Friendly, articulate Australian executive caller',
        tone: 'Warm, consultative, clear',
        promptInstruction: 'Introduce yourself from Business HUB, ask diagnostic questions regarding current revenue workflows, handle objections respectfully, and secure a calendar appointment.',
        model: 'gemini-2.5-flash',
        cloudProvider: 'google_gemini',
        allowedChannels: ['voice'],
        qualificationRules: ['Must verify key decision maker name and email', 'Must verify active sales team size'],
        objectionHandlingRules: [
          { objection: 'Send me an email first', counterStrategy: 'Agree cheerfully, confirm email, and propose a 10-minute preview on Thursday.' }
        ],
        bookingRules: { preferredAppointmentType: 'Discovery Call', calendarId: 'primary', minNoticeHours: 4 },
        escalationRules: [{ triggerCondition: 'Lead requests human manager immediately', escalateTo: 'Support Desk' }],
        enabledTools: ['checkAvailability', 'bookAppointment', 'lookupKnowledge', 'recordCallOutcome'],
        updatedAt: new Date().toISOString()
      },
      {
        id: `agent_hermes_${tenantId}`,
        tenantId,
        type: 'hermes_bridge',
        name: 'Nous Hermes 3 Deep Researcher',
        description: 'Autonomous multi-step research agent executing deep web crawling and company pain-point extraction.',
        active: true,
        personality: 'Analytical, deep investigative researcher',
        tone: 'Concise & factual',
        promptInstruction: 'Utilize Hermes function calling to extract tech stack, executive changes, and regulatory filings from public websites.',
        model: 'Hermes-3-Llama-3.1-405B',
        cloudProvider: 'hermes_agent',
        bridgeId: `bridge_hermes_${tenantId}`,
        allowedChannels: ['email', 'chat'],
        qualificationRules: ['Verified website security headers', 'Active hiring for revenue/ops roles'],
        objectionHandlingRules: [],
        bookingRules: { preferredAppointmentType: 'Technical Review', calendarId: 'primary', minNoticeHours: 24 },
        escalationRules: [],
        enabledTools: ['scrapeWebsite', 'enrichCompany', 'searchKnowledge'],
        updatedAt: new Date().toISOString()
      }
    ];

    agentsList.forEach(a => this.agents.set(a.id, a));
  }

  seedCrmData(tenantId: string) {
    const leadsData = [
      {
        id: `lead_1_${tenantId}`,
        tenantId,
        companyName: 'Aurora Renewable Energy Pty Ltd',
        contactName: 'David Sterling',
        contactEmail: 'david.sterling@aurorapower.com.au',
        contactPhone: '+61 412 884 921',
        jobTitle: 'Chief Operating Officer',
        industry: 'Renewable Energy & Infrastructure',
        status: 'won' as const,
        leadScore: 94,
        scoreBreakdown: [
          { category: 'Budget Fit', points: 30, reason: 'Annual turnover exceeds $18M AUD' },
          { category: 'Executive Authority', points: 35, reason: 'COO with full sign-off authority' },
          { category: 'Urgency & Pain', points: 29, reason: 'Scaling outbound sales by 300% in Q3' }
        ],
        source: 'AI Autonomous Scraper',
        estimatedValue: 48000,
        notes: [
          'Scraped from Australian Clean Energy Council register.',
          'AI Voice Agent qualified David on 15 Aug 2026.',
          'Autonomous calendar booking completed for 45-minute demo.',
          'Invoice #INV-2026-0041 paid in full ($6,600 deposit). Deal marked Closed Won.'
        ],
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `lead_2_${tenantId}`,
        tenantId,
        companyName: 'SolarPulse Infrastructure Ltd',
        contactName: 'Elena Rostova',
        contactEmail: 'elena@solarpulse.com.au',
        contactPhone: '+61 488 231 990',
        jobTitle: 'Head of Business Development',
        industry: 'Solar & Clean Tech',
        status: 'booked' as const,
        leadScore: 88,
        scoreBreakdown: [
          { category: 'ICP Match', points: 30, reason: 'Mid-market solar installer team with 45 reps' },
          { category: 'Engagement Speed', points: 28, reason: 'Replied to AI email within 12 minutes' },
          { category: 'Decision Maker', points: 30, reason: 'Controls quarterly marketing & sales budget' }
        ],
        source: 'LinkedIn Autonomous Enrichment',
        estimatedValue: 32000,
        notes: [
          'Initial contact via AI personalized cold outreach.',
          'Meeting scheduled for tomorrow at 2:00 PM AEST with Alexander Ross.',
          'Invoice #INV-2026-0042 issued for pilot deposit.'
        ],
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `lead_3_${tenantId}`,
        tenantId,
        companyName: 'Pacific Wealth Management Group',
        contactName: 'Julian Vance',
        contactEmail: 'julian@pacificwealth.com.au',
        contactPhone: '+61 2 9230 4400',
        jobTitle: 'Managing Director',
        industry: 'Financial Advisory & Wealth',
        status: 'engaged' as const,
        leadScore: 81,
        scoreBreakdown: [
          { category: 'High Net Worth Client Base', points: 35, reason: 'Manages $450M in client FUM' },
          { category: 'Compliance Fit', points: 25, reason: 'Requires Australian DNCR & Spam Act guarantees' },
          { category: 'Active Dialogue', points: 21, reason: 'Exchanged 3 messages in omnichannel inbox' }
        ],
        source: 'Google Maps Local Advisory Search',
        estimatedValue: 65000,
        notes: [
          'Inbound inquiry from white-label chat widget.',
          'Reviewed RAG Knowledge Base regarding ASIC/AFSL compliance safety.'
        ],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `lead_4_${tenantId}`,
        tenantId,
        companyName: 'Vanguard Medical Logistics',
        contactName: 'Dr. Robert Hayes',
        contactEmail: 'rhayes@vanguardmed.com.au',
        contactPhone: '+61 401 556 123',
        jobTitle: 'Managing Partner',
        industry: 'Healthcare & Biotech Supply',
        status: 'qualified' as const,
        leadScore: 76,
        scoreBreakdown: [
          { category: 'Enterprise Tier', points: 30, reason: 'Nationwide cold-chain distribution network' },
          { category: 'Outreach Readiness', points: 26, reason: 'Validated mobile phone number (DNCR Clear)' },
          { category: 'AI Scored Need', points: 20, reason: 'Seeking 24/7 after-hours triage dispatch' }
        ],
        source: 'Hermes 3 Deep Researcher',
        estimatedValue: 24000,
        notes: ['Autonomous web crawler verified ABN 89 213 445 901.'],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `lead_5_${tenantId}`,
        tenantId,
        companyName: 'Meridian Civil Engineering',
        contactName: 'Sarah Lin',
        contactEmail: 'slin@meridiancivil.com.au',
        contactPhone: '+61 3 9820 1190',
        jobTitle: 'Commercial Contracts Director',
        industry: 'Civil Construction & Infrastructure',
        status: 'contacted' as const,
        leadScore: 68,
        scoreBreakdown: [
          { category: 'Project Pipeline', points: 25, reason: 'Tier-2 civil tenders across VIC & NSW' },
          { category: 'Targeted Title', points: 25, reason: 'Key procurement authority' },
          { category: 'Pending Call', points: 18, reason: 'Outbound voice sequence step 1 triggered' }
        ],
        source: 'OpenClaw Autonomous Swarm',
        estimatedValue: 18500,
        notes: ['Voice agent scheduled for initial dial in morning batch.'],
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `lead_6_${tenantId}`,
        tenantId,
        companyName: 'CloudScale Cybersecurity Solutions',
        contactName: 'Liam O\'Connor',
        contactEmail: 'liam@cloudscale.io',
        contactPhone: '+61 419 778 001',
        jobTitle: 'VP of Global Alliances',
        industry: 'Information Technology & Security',
        status: 'new' as const,
        leadScore: 62,
        scoreBreakdown: [
          { category: 'Tech Alignment', points: 25, reason: 'B2B SaaS with SOC2 Type II certification' },
          { category: 'Discovery Freshness', points: 20, reason: 'Discovered 4 hours ago via Google search' },
          { category: 'Score Pending', points: 17, reason: 'Queued for OpenClaw deep company profiling' }
        ],
        source: 'Lead Discovery Engine',
        estimatedValue: 15000,
        notes: ['Newly discovered prospect. Enrichment in progress.'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    leadsData.forEach(l => this.leads.set(l.id, l));

    // Seed Appointments
    const appt1: Appointment = {
      id: `appt_1_${tenantId}`,
      tenantId,
      leadId: `lead_2_${tenantId}`,
      contactName: 'Elena Rostova',
      contactEmail: 'elena@solarpulse.com.au',
      contactPhone: '+61 488 231 990',
      companyName: 'SolarPulse Infrastructure Ltd',
      title: 'SolarPulse Autonomous Revenue & Voice Pilot Demonstration',
      appointmentType: 'Product Demo',
      durationMinutes: 45,
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 86400000 + 45 * 60000).toISOString(),
      timezone: 'Australia/Sydney',
      staffName: 'Alexander Ross',
      staffEmail: 'alexander@portal.businesshub.app',
      status: 'scheduled',
      meetingUrl: 'https://meet.portal.businesshub.app/room/solarpulse-demo-2026',
      notes: 'Autonomous booking confirmed by Gemini Voice Agent. Agenda: CRM sync & Australian DNCR compliance demo.',
      bookedByAgentId: `agent_voice_${tenantId}`,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    };
    this.appointments.set(appt1.id, appt1);
  }

  seedKnowledgeData(tenantId: string) {
    const docs: KnowledgeDocument[] = [
      {
        id: `kb_1_${tenantId}`,
        tenantId,
        title: 'Business HUB Revenue Operating System - Core Capabilities & FAQ',
        category: 'Company FAQ',
        content: `Business HUB is Australia's premier Multi-tenant AI Revenue Operating System.
Features:
1. Autonomous Prospect Discovery & Enrichment across Australian & global business registries.
2. Ultra-low latency Conversational Voice Agents operating 24/7 with authentic Australian accents.
3. 100% Compliance with Australian Spam Act 2003 and Do Not Call Register (DNCR) requirements.
4. Native Real-Time Calendar Booking integration with automated confirmation SMS and calendar invites.
5. High-fidelity RAG Knowledge Base with hybrid vector retrieval for answering complex B2B queries.`,
        chunkCount: 8,
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: `kb_2_${tenantId}`,
        tenantId,
        title: 'Commercial Pricing & Enterprise Tier Guidelines (AUD)',
        category: 'Product & Pricing',
        content: `Standard Pricing Tiers:
- Starter: $990 AUD/month (5,000 AI tokens, 500 voice minutes, 5,000 emails)
- Growth: $2,490 AUD/month (25,000 AI tokens, 1,200 voice minutes, 20,000 emails)
- Enterprise / White-Label: $5,900 AUD/month (Unlimited agents, 5,000 voice minutes, custom subdomain on portal.businesshub.app, dedicated SLA).
Setup Fees: Standard onboarding fee is $1,500 AUD which includes custom prompt calibration, RAG ingestion, and CRM webhook routing.`,
        chunkCount: 6,
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    docs.forEach(d => this.knowledge.set(d.id, d));
  }

  seedCampaignsData(tenantId: string) {
    const c1: Campaign = {
      id: `camp_1_${tenantId}`,
      tenantId,
      name: 'Q3 Clean Tech & Renewable Energy Executive Outreach',
      description: 'Multi-touch campaign targeting COOs and Business Development leaders in the renewable sector.',
      status: 'active',
      targetAudience: 'Renewable Energy Executives in Australia',
      channels: ['email', 'voice'],
      leadCount: 42,
      engagedCount: 26,
      appointmentCount: 9,
      wonCount: 4,
      conversionRate: 21.4,
      assignedAgentId: `agent_orch_${tenantId}`,
      sequenceSteps: [
        { day: 1, channel: 'email', actionDescription: 'Personalized cold value proposition', templatePrompt: 'Draft high-impact diagnostic email.' },
        { day: 3, channel: 'voice', actionDescription: 'AI Voice Specialist qualification call', templatePrompt: 'Call prospect to follow up on email and schedule demo.' }
      ],
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString()
    };

    this.campaigns.set(c1.id, c1);
  }

  logEvent(event: PlatformEvent) {
    this.events.unshift(event);
    if (this.events.length > 500) {
      this.events = this.events.slice(0, 500);
    }
  }

  // Isolation helpers
  getTenant(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  getLeads(tenantId: string): Lead[] {
    return Array.from(this.leads.values()).filter(l => l.tenantId === tenantId);
  }

  getCompanies(tenantId: string): Company[] {
    return Array.from(this.companies.values()).filter(c => c.tenantId === tenantId);
  }

  getContacts(tenantId: string): Contact[] {
    return Array.from(this.contacts.values()).filter(c => c.tenantId === tenantId);
  }

  getAgents(tenantId: string): AgentConfig[] {
    return Array.from(this.agents.values()).filter(a => a.tenantId === tenantId);
  }

  getConversations(tenantId: string): Conversation[] {
    return Array.from(this.conversations.values()).filter(c => c.tenantId === tenantId);
  }

  getCalls(tenantId: string): CallLog[] {
    return Array.from(this.calls.values()).filter(c => c.tenantId === tenantId);
  }

  getAppointments(tenantId: string): Appointment[] {
    return Array.from(this.appointments.values()).filter(a => a.tenantId === tenantId);
  }

  getKnowledge(tenantId: string): KnowledgeDocument[] {
    return Array.from(this.knowledge.values()).filter(k => k.tenantId === tenantId);
  }

  getCampaigns(tenantId: string): Campaign[] {
    return Array.from(this.campaigns.values()).filter(c => c.tenantId === tenantId);
  }

  getEvents(tenantId: string): PlatformEvent[] {
    return this.events.filter(e => e.tenantId === tenantId);
  }

  getCloudApis(tenantId: string): CloudApiConfig[] {
    return Array.from(this.cloudApis.values()).filter(c => c.tenantId === tenantId);
  }

  getAgentBridges(tenantId: string): AgenticBridgeConfig[] {
    return Array.from(this.agentBridges.values()).filter(b => b.tenantId === tenantId);
  }

  getBridgeMessages(bridgeId: string): BridgeMessage[] {
    return this.bridgeMessages.get(bridgeId) || [];
  }

  addBridgeMessage(bridgeId: string, message: BridgeMessage) {
    if (!this.bridgeMessages.has(bridgeId)) {
      this.bridgeMessages.set(bridgeId, []);
    }
    const msgs = this.bridgeMessages.get(bridgeId)!;
    msgs.push(message);
    if (msgs.length > 200) {
      msgs.shift();
    }
  }

  getBridgeWorkers(bridgeId: string): BridgeWorkerNode[] {
    return this.bridgeWorkers.get(bridgeId) || [];
  }

  toggleBridgeWorker(bridgeId: string, workerId: string): BridgeWorkerNode | undefined {
    const workers = this.bridgeWorkers.get(bridgeId) || [];
    const worker = workers.find(w => w.id === workerId);
    if (worker) {
      worker.status = worker.status === 'paused' ? 'active' : 'paused';
      worker.lastHeartbeat = new Date().toISOString();
      return worker;
    }
    return undefined;
  }

  getBridgeTasks(bridgeId: string): BridgeTask[] {
    return this.bridgeTasks.get(bridgeId) || [];
  }

  addBridgeTask(bridgeId: string, task: BridgeTask) {
    if (!this.bridgeTasks.has(bridgeId)) {
      this.bridgeTasks.set(bridgeId, []);
    }
    this.bridgeTasks.get(bridgeId)!.unshift(task);
  }

  updateBridgeTask(bridgeId: string, taskId: string, updates: Partial<BridgeTask>): BridgeTask | undefined {
    const tasks = this.bridgeTasks.get(bridgeId) || [];
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, updates);
      return task;
    }
    return undefined;
  }

  getBridgeDashboardState(bridgeId: string): BridgeDashboardState | null {
    const bridge = this.agentBridges.get(bridgeId);
    if (!bridge) return null;

    const workerNodes = this.getBridgeWorkers(bridgeId);
    const recentTasks = this.getBridgeTasks(bridgeId);
    const messages = this.getBridgeMessages(bridgeId);

    const totalQueries = messages.filter(m => m.sender === 'admin' || m.sender === 'staff').length * 4 + 48;
    const completedTasks = recentTasks.filter(t => t.status === 'completed').length;
    const totalTasks = recentTasks.length;
    const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 98;

    const memoryTotalMb = workerNodes.reduce((acc, w) => acc + w.memoryUsageMb, 0) || 1540;
    const cpuLoadAverage = workerNodes.length > 0 
      ? Math.round(workerNodes.reduce((acc, w) => acc + w.cpuUsagePercent, 0) / workerNodes.length) 
      : 22;

    return {
      bridge,
      workerNodes,
      recentTasks,
      messages,
      telemetry: {
        totalQueries,
        successRate,
        avgLatencyMs: bridge.latencyMs || 105,
        activeToolBuses: bridge.supportedTools || ['crm_search', 'web_scraper', 'invoice_issuer'],
        uptimeSeconds: 86400 * 4 + 3600 * 2,
        memoryTotalMb,
        cpuLoadAverage
      }
    };
  }

  getInvoices(tenantId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter(i => i.tenantId === tenantId);
  }

  getPayments(tenantId: string): PaymentTransaction[] {
    return Array.from(this.payments.values()).filter(p => p.tenantId === tenantId);
  }

  getEmails(tenantId: string): EmailDispatchLog[] {
    return Array.from(this.emails.values()).filter(e => e.tenantId === tenantId);
  }
}

export const db = new DatabaseStore();
