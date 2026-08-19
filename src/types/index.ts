export type UserRole = 
  | 'super_admin'
  | 'business_hub_admin'
  | 'account_owner'
  | 'admin'
  | 'manager'
  | 'staff'
  | 'sales_user'
  | 'agent_operator'
  | 'client'
  | 'viewer';

export type LeadStatus = 
  | 'new'
  | 'researching'
  | 'qualified'
  | 'contacted'
  | 'engaged'
  | 'appointment_requested'
  | 'booked'
  | 'completed'
  | 'won'
  | 'lost';

export type ChannelType = 'email' | 'sms' | 'chat' | 'voice';

export type AgentType = 
  | 'orchestrator'
  | 'lead_generation'
  | 'research'
  | 'qualification'
  | 'sales'
  | 'email'
  | 'chat'
  | 'voice'
  | 'booking'
  | 'follow_up'
  | 'knowledge'
  | 'crm'
  | 'escalation'
  | 'analytics'
  | 'hermes_bridge'
  | 'openclaw_swarm';

export interface TenantBranding {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  subdomain: string;
  customDomain?: string;
  agentAvatarUrl?: string;
  voiceGender: 'female' | 'male' | 'neutral';
  voiceStyle: 'professional' | 'energetic' | 'consultative' | 'empathetic';
}

export interface TenantLimits {
  monthlyLeadCredits: number;
  monthlyAiTokens: number;
  monthlyVoiceMinutes: number;
  monthlyEmailVolume: number;
  maxUsers: number;
  maxAgents: number;
}

export interface TenantUsage {
  usedLeadCredits: number;
  usedAiTokens: number;
  usedVoiceMinutes: number;
  usedEmailVolume: number;
  currentEstimatedCost: number;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'growth' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  branding: TenantBranding;
  limits: TenantLimits;
  usage: TenantUsage;
  isPlatformOwner?: boolean; // Business HUB is true
  complianceSettings: {
    australianCompliance: boolean;
    gdprCompliant: boolean;
    canSpamCompliant: boolean;
    callRecordingDisclosure: boolean;
    dataRetentionDays: number;
    doNotContactEnforced: boolean;
  };
}

export type Department = 'sales' | 'marketing' | 'admin' | 'operations' | 'support' | 'executive';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  customRoleId?: string;
  customRoleName?: string;
  jobTitle?: string;
  avatarUrl?: string;
  phone?: string;
  active: boolean;
  mfaEnabled?: boolean;
  customPermissions?: string[];
  lastLogin?: string;
  companyName?: string;
  createdAt?: string;
}

export interface DepartmentRole {
  id: string;
  tenantId: string;
  name: string;
  department: Department;
  description: string;
  isSystemDefault?: boolean;
  color: string;
  permissions: string[];
  assignedUsersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: 'read' | 'write' | 'delete' | 'admin';
  isHighRisk?: boolean;
}

export interface PermissionModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  departmentScope: Department[];
  permissions: PermissionDefinition[];
}

export interface RbacAuditLog {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  action: 'create_role' | 'update_role' | 'delete_role' | 'assign_role' | 'update_permissions' | 'user_invited' | 'user_status_changed';
  targetType: 'role' | 'user' | 'policy';
  targetName: string;
  details: string;
  timestamp: string;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  website: string;
  industry: string;
  employeeCount: string;
  location: string;
  phone?: string;
  email?: string;
  annualRevenue?: string;
  techStack?: string[];
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
  };
  overview?: string;
  painPoints?: string[];
  leadScore: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  tenantId: string;
  companyId?: string;
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  location?: string;
  timezone: string;
  linkedinUrl?: string;
  source: string;
  consentGiven: boolean;
  isDoNotContact: boolean;
  tags: string[];
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  companyId?: string;
  contactId?: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  jobTitle: string;
  industry: string;
  status: LeadStatus;
  leadScore: number;
  scoreBreakdown: {
    category: string;
    points: number;
    reason: string;
  }[];
  source: string;
  assignedAgentId?: string;
  assignedStaffId?: string;
  estimatedValue?: number;
  notes: string[];
  campaignId?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Cloud API & Agentic Bridge Interfaces
// ==========================================
export type CloudAiProvider = 
  | 'google_gemini'
  | 'anthropic_claude'
  | 'openai_gpt'
  | 'deepseek'
  | 'hermes_agent'
  | 'openclaw_swarm'
  | 'custom_endpoint';

export interface CloudApiConfig {
  id: string;
  tenantId: string;
  provider: CloudAiProvider;
  model: string;
  apiKeyMasked: string;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
  isDefault: boolean;
  temperature: number;
  maxTokens: number;
  rateLimitRpm: number;
  status: 'active' | 'degraded' | 'unreachable';
  lastPingMs: number;
  enabledCapabilities: string[];
  updatedAt: string;
}

export interface BridgeToolCall {
  name: string;
  params: Record<string, any>;
  result?: any;
  status: 'running' | 'completed' | 'failed';
  executedAt: string;
}

export interface BridgeMessage {
  id: string;
  bridgeId: string;
  sender: 'admin' | 'staff' | 'remote_agent' | 'system' | 'tool_bus';
  senderName: string;
  content: string;
  thoughtChain?: string;
  rawXmlOrJson?: string;
  toolCalls?: BridgeToolCall[];
  timestamp: string;
  workerNodeId?: string;
  latencyMs?: number;
}

export interface BridgeWorkerNode {
  id: string;
  name: string;
  role: string;
  framework: 'hermes' | 'openclaw' | 'langgraph' | 'crewai' | 'custom_agent';
  status: 'idle' | 'active' | 'executing' | 'paused';
  currentTask?: string;
  tasksCompleted: number;
  memoryUsageMb: number;
  cpuUsagePercent: number;
  lastLog: string;
  lastHeartbeat: string;
}

export interface BridgeTask {
  id: string;
  bridgeId: string;
  title: string;
  type: 'lead_scrape' | 'crm_enrich' | 'draft_invoices' | 'voice_campaign' | 'compliance_audit' | 'custom_agent_action';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  assignedWorker: string;
  params: Record<string, any>;
  outputSummary?: string;
  createdByName: string;
  createdAt: string;
  completedAt?: string;
}

export interface BridgeDashboardState {
  bridge: AgenticBridgeConfig;
  workerNodes: BridgeWorkerNode[];
  recentTasks: BridgeTask[];
  messages: BridgeMessage[];
  telemetry: {
    totalQueries: number;
    successRate: number;
    avgLatencyMs: number;
    activeToolBuses: string[];
    uptimeSeconds: number;
    memoryTotalMb: number;
    cpuLoadAverage: number;
  };
}

export interface AgenticBridgeConfig {
  id: string;
  tenantId: string;
  framework: 'hermes' | 'openclaw' | 'langgraph' | 'crewai' | 'custom_agent';
  name: string;
  endpointUrl: string;
  authTokenMasked: string;
  protocol: 'rest_webhook' | 'websocket_stream' | 'hermes_fc_protocol' | 'openclaw_tool_bus';
  status: 'connected' | 'syncing' | 'offline';
  latencyMs: number;
  activeWorkers: number;
  supportedTools: string[];
  routingPriority: number;
  lastHeartbeat: string;
  description: string;
  systemPromptPreset?: string;
}

export interface CustomVoice {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  language: string;
  provider: 'gemini_neural' | 'elevenlabs_clone' | 'webrtc_edge' | 'custom_recorded';
  sampleAudioUrl?: string;
  audioDurationSeconds?: number;
  isRecordedByMe: boolean;
  sampleScript?: string;
  settings: {
    speed: number; // 0.5 to 1.5 (default 1.0)
    pitch: number; // 0.5 to 1.5 (default 1.0)
    stability: number; // 0 to 100
    similarityBoost: number; // 0 to 100
    styleExaggeration: number; // 0 to 100
    noiseReduction: boolean;
  };
  labels?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentVoiceConfig {
  voiceId: string; // custom voice id or built-in voice id
  voiceName: string;
  provider: 'gemini_neural' | 'elevenlabs_clone' | 'webrtc_edge' | 'custom_recorded';
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  speed: number;
  pitch: number;
  stability: number;
  similarityBoost: number;
  greetingScript?: string;
  audioPreviewUrl?: string;
}

export interface AgentConfig {
  id: string;
  tenantId: string;
  type: AgentType;
  name: string;
  description: string;
  active: boolean;
  personality: string;
  tone: string;
  promptInstruction: string;
  model: string;
  cloudProvider?: CloudAiProvider;
  bridgeId?: string;
  voiceConfig?: AgentVoiceConfig;
  allowedChannels: ChannelType[];
  qualificationRules: string[];
  objectionHandlingRules: { objection: string; counterStrategy: string }[];
  bookingRules: {
    preferredAppointmentType: string;
    calendarId: string;
    minNoticeHours: number;
  };
  escalationRules: {
    triggerCondition: string;
    escalateTo: string;
  }[];
  enabledTools: string[];
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'lead' | 'agent' | 'human_agent' | 'system';
  channel: ChannelType;
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'interested' | 'hesitant';
  intent?: 'question' | 'pricing_inquiry' | 'booking_request' | 'objection' | 'opt_out' | 'general';
  toolCallsExecuted?: { toolName: string; args: any; result: any }[];
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  leadId: string;
  contactId: string;
  channel: ChannelType;
  status: 'active' | 'waiting_on_lead' | 'escalated_to_human' | 'closed';
  unreadByHuman: boolean;
  assignedAgentId: string;
  lastMessageAt: string;
  subject?: string;
  escalationReason?: string;
  messages: Message[];
}

export interface CallLog {
  id: string;
  tenantId: string;
  leadId: string;
  contactName: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'in_progress' | 'failed' | 'busy' | 'scheduled';
  durationSeconds: number;
  startedAt: string;
  endedAt?: string;
  recordingAvailable: boolean;
  summary: string;
  sentiment: string;
  actionItems: string[];
  leadStatusUpdatedTo?: LeadStatus;
  appointmentBookedId?: string;
  transcript: { speaker: string; text: string; time: string }[];
}

export interface Appointment {
  id: string;
  tenantId: string;
  leadId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  companyName: string;
  title: string;
  appointmentType: 'Discovery Call' | 'Product Demo' | 'Consultation' | 'Technical Review' | 'Closing Strategy';
  durationMinutes: number;
  startTime: string; // ISO
  endTime: string;   // ISO
  timezone: string;
  staffName: string;
  staffEmail: string;
  status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show';
  meetingUrl: string;
  notes?: string;
  bookedByAgentId?: string;
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  tenantId: string;
  title: string;
  category: 'Company FAQ' | 'Product & Pricing' | 'Objection Playbook' | 'Case Study' | 'Policy & Compliance' | 'Website Scraped Data';
  content: string;
  sourceUrl?: string;
  fileType?: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string;
  channels: ChannelType[];
  leadCount: number;
  engagedCount: number;
  appointmentCount: number;
  wonCount: number;
  conversionRate: number;
  assignedAgentId: string;
  sequenceSteps: {
    day: number;
    channel: ChannelType;
    actionDescription: string;
    templatePrompt: string;
  }[];
  createdAt: string;
}

export interface PlatformEvent {
  id: string;
  tenantId: string;
  eventType: 
    | 'lead.created'
    | 'lead.enriched'
    | 'lead.qualified'
    | 'email.sent'
    | 'email.received'
    | 'chat.started'
    | 'call.completed'
    | 'appointment.requested'
    | 'appointment.created'
    | 'appointment.rescheduled'
    | 'appointment.cancelled'
    | 'agent.escalated'
    | 'human.replied'
    | 'lead.won'
    | 'payment.link_created'
    | 'payment.received'
    | 'invoice.issued'
    | 'bridge.synced';
  summary: string;
  details: Record<string, any>;
  triggeredByAgent?: string;
  timestamp: string;
}

// ==========================================
// Payment Pipeline & Email Integration Types
// ==========================================
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type SupportedCurrency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'CAD' | 'NZD' | 'JPY';

export type TaxJurisdiction = 
  | 'AU_GST'
  | 'US_SALES_TAX'
  | 'EU_VAT'
  | 'UK_VAT'
  | 'SG_GST'
  | 'NZ_GST'
  | 'ZERO_RATED_EXPORT';

export type DashboardWidgetId = 
  | 'key_metrics'
  | 'quick_actions'
  | 'pipeline_funnel'
  | 'global_revenue_map'
  | 'call_sentiment_chart'
  | 'token_metering_chart'
  | 'live_activity_feed'
  | 'upcoming_bookings'
  | 'swarm_cluster_hud'
  | 'tax_compliance_summary';

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  title: string;
  category: 'metric' | 'chart' | 'action' | 'feed' | 'system';
  enabled: boolean;
  order: number;
  width: 'full' | 'half' | 'third';
  pinned?: boolean;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  leadId?: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  taxJurisdiction?: TaxJurisdiction;
  taxRate?: number;
  taxLabel?: string;
  taxIdOrVat?: string;
  legalTermsPreset?: string;
  total: number;
  currency: SupportedCurrency;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'refunded';
  dueDate: string;
  issuedDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentLinkUrl: string;
  stripePaymentIntentId?: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  tenantId: string;
  invoiceId: string;
  leadId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  payerName: string;
  payerEmail: string;
  paymentMethodType: 'card' | 'direct_debit' | 'apple_pay' | 'pay_id';
  receiptUrl: string;
  timestamp: string;
  emailReceiptSent: boolean;
}

export interface EmailDispatchLog {
  id: string;
  tenantId: string;
  toEmail: string;
  toName: string;
  fromName: string;
  subject: string;
  bodyPreview: string;
  category: 'payment_receipt' | 'invoice_dispatch' | 'booking_confirmation' | 'outreach' | 'quote_proposal';
  status: 'delivered' | 'opened' | 'clicked' | 'bounced';
  sentAt: string;
  metadata?: Record<string, any>;
}
