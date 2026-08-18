import {
  Tenant,
  User,
  Company,
  Contact,
  Lead,
  AgentConfig,
  Conversation,
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
} from '../types/index.ts';

export class ApiClient {
  private tenantId: string = 'tenant_business_hub';

  setTenantId(id: string) {
    this.tenantId = id;
  }

  getTenantId(): string {
    return this.tenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
    const headers = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.tenantId,
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      return res.json();
    } catch (err: any) {
      if (retries > 0 && (!err.message || err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        // Wait 300ms and retry
        await new Promise(r => setTimeout(r, 300));
        return this.request<T>(endpoint, options, retries - 1);
      }
      console.warn(`[ApiClient] Request to ${endpoint} failed:`, err.message || err);
      throw err;
    }
  }

  // Auth
  async login(payload: { email?: string; role?: string; tenantId?: string }): Promise<{ success: boolean; token: string; user: User; tenant: Tenant }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getMe(): Promise<{ user: User; tenant: Tenant }> {
    return this.request('/api/auth/me');
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    return this.request<Tenant[]>('/api/tenants');
  }

  async getTenant(id: string): Promise<Tenant> {
    return this.request<Tenant>(`/api/tenants/${id}`);
  }

  async createTenant(data: Partial<Tenant>): Promise<Tenant> {
    return this.request<Tenant>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBranding(id: string, branding: any): Promise<Tenant> {
    return this.request<Tenant>(`/api/tenants/${id}/branding`, {
      method: 'PATCH',
      body: JSON.stringify(branding)
    });
  }

  async updateCompliance(id: string, compliance: any): Promise<Tenant> {
    return this.request<Tenant>(`/api/tenants/${id}/compliance`, {
      method: 'PATCH',
      body: JSON.stringify(compliance)
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  // Cloud APIs
  async getCloudApis(): Promise<CloudApiConfig[]> {
    return this.request<CloudApiConfig[]>('/api/cloud-apis');
  }

  async createCloudApi(data: Partial<CloudApiConfig>): Promise<CloudApiConfig> {
    return this.request<CloudApiConfig>('/api/cloud-apis', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCloudApi(id: string, data: Partial<CloudApiConfig>): Promise<CloudApiConfig> {
    return this.request<CloudApiConfig>(`/api/cloud-apis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteCloudApi(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/cloud-apis/${id}`, { method: 'DELETE' });
  }

  async testCloudApi(data: { provider: string; model: string; apiKey?: string }): Promise<any> {
    return this.request('/api/cloud-apis/test', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Agentic Bridges (Hermes, OpenClaw, LangGraph)
  async getAgentBridges(): Promise<AgenticBridgeConfig[]> {
    return this.request<AgenticBridgeConfig[]>('/api/agent-bridges');
  }

  async createAgentBridge(data: Partial<AgenticBridgeConfig>): Promise<AgenticBridgeConfig> {
    return this.request<AgenticBridgeConfig>('/api/agent-bridges', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAgentBridge(id: string, data: Partial<AgenticBridgeConfig>): Promise<AgenticBridgeConfig> {
    return this.request<AgenticBridgeConfig>(`/api/agent-bridges/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async pingAgentBridge(id: string): Promise<{ success: boolean; latencyMs: number; status: string }> {
    return this.request(`/api/agent-bridges/${id}/ping`, { method: 'POST' });
  }

  async deleteAgentBridge(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/agent-bridges/${id}`, { method: 'DELETE' });
  }

  async getBridgeDashboard(id: string): Promise<BridgeDashboardState> {
    return this.request<BridgeDashboardState>(`/api/agent-bridges/${id}/dashboard`);
  }

  async getBridgeMessages(id: string): Promise<BridgeMessage[]> {
    return this.request<BridgeMessage[]>(`/api/agent-bridges/${id}/messages`);
  }

  async interactWithBridge(id: string, data: { message: string; senderRole?: string; senderName?: string }): Promise<{ userMessage: BridgeMessage; agentMessage: BridgeMessage; dashboardState: BridgeDashboardState }> {
    return this.request(`/api/agent-bridges/${id}/interact`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createBridgeTask(id: string, data: { title: string; type?: string; params?: any; assignedWorker?: string; createdByName?: string }): Promise<BridgeTask> {
    return this.request<BridgeTask>(`/api/agent-bridges/${id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async toggleBridgeWorker(id: string, workerId: string): Promise<BridgeWorkerNode> {
    return this.request<BridgeWorkerNode>(`/api/agent-bridges/${id}/workers/${workerId}/toggle`, {
      method: 'POST'
    });
  }

  async executeBridgeTool(id: string, data: { toolName: string; args?: any }): Promise<{ success: boolean; result: any; toolMsg: BridgeMessage; dashboardState: BridgeDashboardState }> {
    return this.request(`/api/agent-bridges/${id}/execute-tool`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Payment Pipeline & Invoices
  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>('/api/invoices');
  }

  async createInvoice(data: any): Promise<{ invoice: Invoice; emailLog: EmailDispatchLog }> {
    return this.request('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async payInvoice(id: string, data: { paymentMethod?: string; payerName?: string; payerEmail?: string }): Promise<{ success: boolean; invoice: Invoice; transaction: PaymentTransaction; receiptEmail: EmailDispatchLog }> {
    return this.request(`/api/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getPayments(): Promise<PaymentTransaction[]> {
    return this.request<PaymentTransaction[]>('/api/payments');
  }

  // Emails
  async getEmails(): Promise<EmailDispatchLog[]> {
    return this.request<EmailDispatchLog[]>('/api/emails');
  }

  async sendEmail(data: { toEmail: string; toName?: string; subject: string; bodyPreview?: string; category?: string }): Promise<EmailDispatchLog> {
    return this.request('/api/emails/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // CRM
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/api/leads');
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    return this.request<Lead>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteLead(id: string): Promise<{ success: boolean }> {
    return this.request(`/api/leads/${id}`, { method: 'DELETE' });
  }

  async getCompanies(): Promise<Company[]> {
    return this.request<Company[]>('/api/companies');
  }

  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/api/contacts');
  }

  // Discovery
  async discoverLeads(criteria: string, location?: string, count?: number): Promise<{ success: boolean; count: number; leads: Lead[] }> {
    return this.request('/api/leads/discover', {
      method: 'POST',
      body: JSON.stringify({ criteria, location, count })
    });
  }

  // Agents
  async getAgents(): Promise<AgentConfig[]> {
    return this.request<AgentConfig[]>('/api/agents');
  }

  async updateAgent(id: string, data: Partial<AgentConfig>): Promise<AgentConfig> {
    return this.request<AgentConfig>(`/api/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/conversations');
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.request<Conversation>(`/api/conversations/${id}`);
  }

  async createConversation(data: any): Promise<Conversation> {
    return this.request<Conversation>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async sendMessage(conversationId: string, content: string, sender: 'lead' | 'human_agent' = 'lead'): Promise<any> {
    return this.request(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, sender })
    });
  }

  // Calls
  async getCalls(): Promise<CallLog[]> {
    return this.request<CallLog[]>('/api/calls');
  }

  async runVoiceTurn(data: { utterance: string; leadId?: string; history: any[]; agentId?: string }): Promise<any> {
    return this.request('/api/calls/voice-turn', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async summarizeCall(data: { leadId: string; transcript: any[] }): Promise<CallLog> {
    return this.request('/api/calls/summarize', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Calendar
  async getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/api/appointments');
  }

  async getAvailability(params?: any): Promise<any> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/api/calendar/availability${qs}`);
  }

  async createAppointment(data: any): Promise<any> {
    return this.request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async cancelAppointment(id: string): Promise<any> {
    return this.request(`/api/appointments/${id}`, { method: 'DELETE' });
  }

  // Knowledge
  async getKnowledge(): Promise<KnowledgeDocument[]> {
    return this.request<KnowledgeDocument[]>('/api/knowledge');
  }

  async createKnowledge(data: any): Promise<KnowledgeDocument> {
    return this.request('/api/knowledge', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteKnowledge(id: string): Promise<any> {
    return this.request(`/api/knowledge/${id}`, { method: 'DELETE' });
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.request<Campaign[]>('/api/campaigns');
  }

  async createCampaign(data: any): Promise<Campaign> {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Events & Analytics
  async getEvents(): Promise<PlatformEvent[]> {
    return this.request<PlatformEvent[]>('/api/events');
  }

  async getAnalytics(): Promise<any> {
    return this.request('/api/analytics');
  }
}

export const api = new ApiClient();
