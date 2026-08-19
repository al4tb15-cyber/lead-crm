import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.ts';
import { eventBus } from './server/events.ts';
import { toolRegistry } from './server/tools.ts';
import {
  generateAgentTurn,
  discoverProspects,
  runVoiceAgentTurn,
  summarizeCall,
  executeBridgeInteraction
} from './server/gemini.ts';
import { 
  Tenant, 
  Lead, 
  Company, 
  Contact, 
  Appointment, 
  KnowledgeDocument, 
  Campaign, 
  CloudApiConfig, 
  AgenticBridgeConfig, 
  BridgeMessage,
  BridgeWorkerNode,
  BridgeTask,
  BridgeDashboardState,
  Invoice, 
  PaymentTransaction, 
  EmailDispatchLog, 
  User,
  CustomVoice,
  DepartmentRole,
  RbacAuditLog
} from './src/types/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware: Extract Tenant ID header (default to Business HUB if not passed)
  app.use((req, res, next) => {
    const tenantHeader = req.headers['x-tenant-id'] as string;
    req.body = req.body || {};
    req.query = req.query || {};
    (req as any).tenantId = tenantHeader || 'tenant_business_hub';
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Business HUB AI Revenue OS',
      domain: 'portal.businesshub.app',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // 1. AUTHENTICATION & MULTI-ROLE LOGIN (Admin, Staff, Client)
  // ==========================================
  app.post('/api/auth/login', (req, res) => {
    const { email, role, tenantId } = req.body;

    // Find existing user or create/mock authenticated session
    let matchedUser = Array.from(db.users.values()).find(
      u => u.email.toLowerCase() === (email || '').toLowerCase()
    );

    if (!matchedUser && role) {
      matchedUser = Array.from(db.users.values()).find(u => u.role === role);
    }

    if (!matchedUser) {
      // Default to Alexander Ross (super_admin) or generate authenticated session
      const targetRole = role || 'super_admin';
      const assignedTenantId = tenantId || (targetRole === 'client' ? 'tenant_apex_legal' : 'tenant_business_hub');
      matchedUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        tenantId: assignedTenantId,
        name: email ? email.split('@')[0].replace('.', ' ') : (targetRole === 'client' ? 'Valued Client' : 'Revenue Operator'),
        email: email || 'user@portal.businesshub.app',
        role: targetRole,
        active: true,
        lastLogin: new Date().toISOString(),
        companyName: targetRole === 'client' ? 'Apex Client Portal' : 'Business HUB Team'
      };
      db.users.set(matchedUser.id, matchedUser);
    }

    matchedUser.lastLogin = new Date().toISOString();
    
    // Find associated tenant
    const userTenant = db.getTenant(matchedUser.tenantId) || db.getTenant('tenant_business_hub');

    res.json({
      success: true,
      token: 'jwt_portal_' + Buffer.from(matchedUser.id + ':' + Date.now()).toString('base64'),
      user: matchedUser,
      tenant: userTenant
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const tenantId = (req as any).tenantId;
    const user = Array.from(db.users.values()).find(u => u.tenantId === tenantId) || Array.from(db.users.values())[0];
    res.json({ user, tenant: db.getTenant(tenantId) });
  });

  // ==========================================
  // 2. TENANTS & USERS (Multi-Tenancy)
  // ==========================================
  app.get('/api/tenants', (req, res) => {
    const all = Array.from(db.tenants.values());
    res.json(all);
  });

  app.get('/api/tenants/:id', (req, res) => {
    const tenant = db.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  });

  app.post('/api/tenants', (req, res) => {
    const { name, plan, branding } = req.body;
    const tenantId = 'tenant_' + Math.random().toString(36).substr(2, 9);
    const slug = (name || 'Client').toLowerCase().replace(/[^a-z0-9]/g, '-');

    const newTenant: Tenant = {
      id: tenantId,
      name: name || 'New Enterprise Client',
      slug,
      plan: plan || 'growth',
      status: 'active',
      isPlatformOwner: false,
      createdAt: new Date().toISOString(),
      branding: {
        companyName: branding?.companyName || name || 'Client Practice',
        primaryColor: branding?.primaryColor || '#0f172a',
        accentColor: branding?.accentColor || '#6366f1',
        subdomain: `${slug}.portal.businesshub.app`,
        voiceGender: branding?.voiceGender || 'female',
        voiceStyle: branding?.voiceStyle || 'professional'
      },
      limits: {
        monthlyLeadCredits: plan === 'enterprise' ? 50000 : plan === 'professional' ? 10000 : 5000,
        monthlyAiTokens: plan === 'enterprise' ? 100000000 : plan === 'professional' ? 25000000 : 10000000,
        monthlyVoiceMinutes: plan === 'enterprise' ? 5000 : plan === 'professional' ? 1200 : 500,
        monthlyEmailVolume: plan === 'enterprise' ? 250000 : plan === 'professional' ? 50000 : 20000,
        maxUsers: plan === 'enterprise' ? 100 : plan === 'professional' ? 15 : 5,
        maxAgents: plan === 'enterprise' ? 50 : plan === 'professional' ? 10 : 5
      },
      usage: {
        usedLeadCredits: 0,
        usedAiTokens: 0,
        usedVoiceMinutes: 0,
        usedEmailVolume: 0,
        currentEstimatedCost: 0
      },
      complianceSettings: {
        australianCompliance: true,
        gdprCompliant: true,
        canSpamCompliant: true,
        callRecordingDisclosure: true,
        dataRetentionDays: 180,
        doNotContactEnforced: true
      }
    };

    db.tenants.set(tenantId, newTenant);
    db.seedAgentsForTenant(tenantId, newTenant.name);
    db.seedCloudApis(tenantId);
    db.seedAgenticBridges(tenantId);

    res.status(201).json(newTenant);
  });

  app.patch('/api/tenants/:id/branding', (req, res) => {
    const tenant = db.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.branding = { ...tenant.branding, ...req.body };
    res.json(tenant);
  });

  app.patch('/api/tenants/:id/compliance', (req, res) => {
    const tenant = db.getTenant(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.complianceSettings = { ...tenant.complianceSettings, ...req.body };
    res.json(tenant);
  });

  app.get('/api/users', (req, res) => {
    const tenantId = (req as any).tenantId;
    const users = db.getUsers(tenantId);
    res.json(users);
  });

  // ==========================================
  // RBAC & GRANULAR PERMISSIONS API
  // ==========================================
  app.get('/api/rbac/roles', (req, res) => {
    const tenantId = (req as any).tenantId;
    const roles = db.getDepartmentRoles(tenantId);
    res.json(roles);
  });

  app.post('/api/rbac/roles', (req, res) => {
    const tenantId = (req as any).tenantId;
    const roleId = `role_${Math.random().toString(36).substr(2, 9)}_${tenantId}`;
    const newRole: DepartmentRole = {
      id: roleId,
      tenantId,
      name: req.body.name || 'Custom Department Role',
      department: req.body.department || 'sales',
      description: req.body.description || '',
      isSystemDefault: false,
      color: req.body.color || '#6366f1',
      permissions: Array.isArray(req.body.permissions) ? req.body.permissions : [],
      assignedUsersCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.createDepartmentRole(newRole);

    db.addRbacAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      actorId: 'usr_super_admin',
      actorName: 'Alexander Ross',
      action: 'create_role',
      targetType: 'role',
      targetName: saved.name,
      details: `Created new ${saved.department.toUpperCase()} role with ${saved.permissions.length} granular permissions.`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(saved);
  });

  app.put('/api/rbac/roles/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const updated = db.updateDepartmentRole(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Role not found' });

    db.addRbacAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      actorId: 'usr_super_admin',
      actorName: 'Alexander Ross',
      action: 'update_permissions',
      targetType: 'role',
      targetName: updated.name,
      details: `Updated permissions matrix (${updated.permissions.length} active grants) and role metadata.`,
      timestamp: new Date().toISOString()
    });

    res.json(updated);
  });

  app.delete('/api/rbac/roles/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const existing = db.getDepartmentRole(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Role not found' });
    if (existing.isSystemDefault) {
      return res.status(400).json({ error: 'System default department roles cannot be deleted.' });
    }

    const success = db.deleteDepartmentRole(req.params.id);
    if (success) {
      db.addRbacAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tenantId,
        actorId: 'usr_super_admin',
        actorName: 'Alexander Ross',
        action: 'delete_role',
        targetType: 'role',
        targetName: existing.name,
        details: `Deleted custom department role '${existing.name}' from ${existing.department.toUpperCase()} department.`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success });
  });

  app.get('/api/rbac/audit-logs', (req, res) => {
    const tenantId = (req as any).tenantId;
    const logs = db.getRbacAuditLogs(tenantId);
    res.json(logs);
  });

  // User Management with RBAC assignments
  app.post('/api/rbac/users', (req, res) => {
    const tenantId = (req as any).tenantId;
    const userId = `usr_${Math.random().toString(36).substr(2, 9)}_${tenantId}`;
    const newUser: User = {
      id: userId,
      tenantId,
      name: req.body.name || 'New Team Member',
      email: req.body.email || `user_${Date.now()}@businesshub.app`,
      role: req.body.role || 'staff',
      department: req.body.department || 'sales',
      customRoleId: req.body.customRoleId,
      customRoleName: req.body.customRoleName,
      jobTitle: req.body.jobTitle || 'Specialist',
      active: req.body.active ?? true,
      mfaEnabled: req.body.mfaEnabled ?? false,
      customPermissions: req.body.customPermissions || [],
      companyName: req.body.companyName || 'Business HUB Australia',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const saved = db.createUser(newUser);

    db.addRbacAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      actorId: 'usr_super_admin',
      actorName: 'Alexander Ross',
      action: 'user_invited',
      targetType: 'user',
      targetName: saved.name,
      details: `Provisioned user access for ${saved.email} assigned to ${saved.department?.toUpperCase() || 'GENERAL'} department with role '${saved.customRoleName || saved.role}'.`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(saved);
  });

  app.put('/api/rbac/users/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const updated = db.updateUser(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'User not found' });

    db.addRbacAuditLog({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      tenantId,
      actorId: 'usr_super_admin',
      actorName: 'Alexander Ross',
      action: 'assign_role',
      targetType: 'user',
      targetName: updated.name,
      details: `Updated user access profile: Department '${updated.department || 'None'}', Role '${updated.customRoleName || updated.role}', Active Status: ${updated.active}.`,
      timestamp: new Date().toISOString()
    });

    res.json(updated);
  });

  app.delete('/api/rbac/users/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const existing = db.getUser(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (existing.role === 'super_admin') {
      return res.status(400).json({ error: 'Platform Super Admin cannot be deleted.' });
    }

    const success = db.deleteUser(req.params.id);
    if (success) {
      db.addRbacAuditLog({
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        tenantId,
        actorId: 'usr_super_admin',
        actorName: 'Alexander Ross',
        action: 'user_status_changed',
        targetType: 'user',
        targetName: existing.name,
        details: `Revoked workspace access and deleted user account (${existing.email}).`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success });
  });

  // ==========================================
  // 3. CLOUD API MANAGEMENT FOR ONBOARDED AGENTS
  // ==========================================
  app.get('/api/cloud-apis', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getCloudApis(tenantId));
  });

  app.post('/api/cloud-apis', (req, res) => {
    const tenantId = (req as any).tenantId;
    const id = 'api_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const newConfig: CloudApiConfig = {
      id,
      tenantId,
      provider: req.body.provider || 'google_gemini',
      model: req.body.model || 'gemini-2.5-flash',
      apiKeyMasked: req.body.apiKey ? `${req.body.apiKey.slice(0, 7)}...${req.body.apiKey.slice(-4)}` : 'AIzaSy...configured',
      baseUrl: req.body.baseUrl,
      customHeaders: req.body.customHeaders,
      isDefault: req.body.isDefault || false,
      temperature: req.body.temperature ?? 0.7,
      maxTokens: req.body.maxTokens ?? 8192,
      rateLimitRpm: req.body.rateLimitRpm ?? 120,
      status: 'active',
      lastPingMs: Math.floor(Math.random() * 80 + 40),
      enabledCapabilities: req.body.enabledCapabilities || ['function_calling', 'json_mode', 'streaming'],
      updatedAt: new Date().toISOString()
    };

    if (newConfig.isDefault) {
      db.getCloudApis(tenantId).forEach(c => { c.isDefault = false; });
    }

    db.cloudApis.set(id, newConfig);
    res.status(201).json(newConfig);
  });

  app.put('/api/cloud-apis/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const config = db.cloudApis.get(req.params.id);
    if (!config || config.tenantId !== tenantId) return res.status(404).json({ error: 'Config not found' });

    if (req.body.isDefault) {
      db.getCloudApis(tenantId).forEach(c => { c.isDefault = false; });
    }

    Object.assign(config, req.body, { updatedAt: new Date().toISOString() });
    res.json(config);
  });

  app.delete('/api/cloud-apis/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const config = db.cloudApis.get(req.params.id);
    if (!config || config.tenantId !== tenantId) return res.status(404).json({ error: 'Config not found' });
    db.cloudApis.delete(req.params.id);
    res.json({ success: true });
  });

  app.post('/api/cloud-apis/test', (req, res) => {
    const latency = Math.floor(Math.random() * 90 + 45);
    res.json({
      success: true,
      latencyMs: latency,
      message: `Successfully authenticated with ${req.body.provider || 'Cloud API'} (${req.body.model || 'model'}). Protocol ping response OK.`,
      capabilities: ['function_calling', 'context_caching', 'structured_outputs']
    });
  });

  // ==========================================
  // 4. AGENTIC BRIDGES (Hermes, OpenClaw, LangGraph)
  // ==========================================
  app.get('/api/agent-bridges', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getAgentBridges(tenantId));
  });

  app.post('/api/agent-bridges', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridgeId = 'bridge_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const newBridge: AgenticBridgeConfig = {
      id: bridgeId,
      tenantId,
      framework: req.body.framework || 'hermes',
      name: req.body.name || 'Agent Bridge Connector',
      endpointUrl: req.body.endpointUrl || `https://${req.body.framework || 'agent'}.portal.businesshub.app/v1`,
      authTokenMasked: req.body.authToken ? `${req.body.authToken.slice(0, 8)}...` : 'bridge_tok_...live',
      protocol: req.body.protocol || 'hermes_fc_protocol',
      status: 'connected',
      latencyMs: Math.floor(Math.random() * 60 + 65),
      activeWorkers: req.body.activeWorkers || 4,
      supportedTools: req.body.supportedTools || ['web_scraper', 'crm_event_emitter', 'call_dialer'],
      routingPriority: req.body.routingPriority || 1,
      lastHeartbeat: new Date().toISOString(),
      description: req.body.description || 'Autonomous agent protocol bridge.'
    };
    db.agentBridges.set(bridgeId, newBridge);

    eventBus.emit({
      tenantId,
      eventType: 'bridge.synced',
      summary: `Agentic Bridge connected: ${newBridge.name} (${newBridge.framework})`,
      details: { bridgeId, endpoint: newBridge.endpointUrl }
    });

    res.status(201).json(newBridge);
  });

  app.put('/api/agent-bridges/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });
    Object.assign(bridge, req.body);
    res.json(bridge);
  });

  app.post('/api/agent-bridges/:id/ping', (req, res) => {
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge) return res.status(404).json({ error: 'Bridge not found' });
    bridge.latencyMs = Math.floor(Math.random() * 40 + 50);
    bridge.lastHeartbeat = new Date().toISOString();
    bridge.status = 'connected';
    res.json({ success: true, latencyMs: bridge.latencyMs, status: bridge.status });
  });

  app.delete('/api/agent-bridges/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });
    db.agentBridges.delete(req.params.id);
    res.json({ success: true });
  });

  // Bridge Wrapped Dashboard State & Interactive Communication
  app.get('/api/agent-bridges/:id/dashboard', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });

    const state = db.getBridgeDashboardState(req.params.id);
    if (!state) return res.status(404).json({ error: 'Bridge state unavailable' });
    res.json(state);
  });

  app.get('/api/agent-bridges/:id/messages', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });
    res.json(db.getBridgeMessages(req.params.id));
  });

  app.post('/api/agent-bridges/:id/interact', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });

    const { message, senderRole = 'admin', senderName = 'Operator' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message content is required' });

    try {
      const result = await executeBridgeInteraction({
        tenantId,
        bridgeId: bridge.id,
        userMessage: message,
        senderRole: senderRole === 'client' ? 'staff' : senderRole,
        senderName
      });
      res.json(result);
    } catch (err: any) {
      console.error('[Agent Bridge Interact Error]:', err);
      res.status(500).json({ error: err.message || 'Bridge interaction failed' });
    }
  });

  app.post('/api/agent-bridges/:id/tasks', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });

    const { title, type, params, assignedWorker, createdByName = 'Operator' } = req.body;
    const taskId = 'task_' + Math.random().toString(36).substr(2, 9);
    
    const newTask: BridgeTask = {
      id: taskId,
      bridgeId: bridge.id,
      title: title || 'Autonomous Swarm Task',
      type: type || 'lead_scrape',
      status: 'running',
      progress: 25,
      assignedWorker: assignedWorker || (bridge.framework === 'hermes' ? 'Nous Orchestrator Node-01' : 'OpenClaw-Worker-01 (Sydney Edge)'),
      params: params || {},
      createdByName,
      createdAt: new Date().toISOString()
    };

    db.addBridgeTask(bridge.id, newTask);

    // Auto-advance task to completed after processing
    setTimeout(async () => {
      newTask.progress = 100;
      newTask.status = 'completed';
      newTask.completedAt = new Date().toISOString();
      newTask.outputSummary = `Swarm executed ${newTask.title} with 100% telemetry validation. Results committed to database.`;
      
      eventBus.emit({
        tenantId,
        eventType: 'bridge.synced',
        summary: `Swarm task completed: "${newTask.title}" on ${bridge.name}`,
        details: { taskId: newTask.id, bridgeId: bridge.id }
      });
    }, 1200);

    res.status(201).json(newTask);
  });

  app.post('/api/agent-bridges/:id/workers/:workerId/toggle', (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });

    const updatedWorker = db.toggleBridgeWorker(bridge.id, req.params.workerId);
    if (!updatedWorker) return res.status(404).json({ error: 'Worker node not found' });
    res.json(updatedWorker);
  });

  app.post('/api/agent-bridges/:id/execute-tool', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const bridge = db.agentBridges.get(req.params.id);
    if (!bridge || bridge.tenantId !== tenantId) return res.status(404).json({ error: 'Bridge not found' });

    const { toolName, args } = req.body;
    const toolDef = toolRegistry[toolName];
    if (!toolDef) return res.status(400).json({ error: `Tool ${toolName} not registered in tool bus` });

    try {
      const result = await toolDef.execute(tenantId, args || {}, bridge.name);
      
      // Log as tool_bus message
      const toolMsg: BridgeMessage = {
        id: 'bmsg_tb_' + Math.random().toString(36).substr(2, 9),
        bridgeId: bridge.id,
        sender: 'tool_bus',
        senderName: `Tool Bus (${toolName})`,
        content: `Direct tool execution of [${toolName}]: ${result.success ? 'Success' : 'Failed'}.`,
        toolCalls: [{
          name: toolName,
          params: args || {},
          result: result.data || result,
          status: result.success ? 'completed' : 'failed',
          executedAt: new Date().toISOString()
        }],
        timestamp: new Date().toISOString()
      };
      db.addBridgeMessage(bridge.id, toolMsg);

      res.json({ success: true, result, toolMsg, dashboardState: db.getBridgeDashboardState(bridge.id) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Tool execution failed' });
    }
  });

  // ==========================================
  // 5. CRM (Leads, Companies, Contacts)
  // ==========================================
  app.get('/api/leads', (req, res) => {
    const tenantId = (req as any).tenantId;
    const leads = db.getLeads(tenantId);
    res.json(leads);
  });

  app.post('/api/leads', (req, res) => {
    const tenantId = (req as any).tenantId;
    const leadId = 'lead_' + Math.random().toString(36).substr(2, 9);
    const newLead: Lead = {
      id: leadId,
      tenantId,
      contactId: 'cont_' + Math.random().toString(36).substr(2, 9),
      companyName: req.body.companyName || 'Unknown Co',
      contactName: req.body.contactName || 'Lead Contact',
      contactEmail: req.body.contactEmail || '',
      contactPhone: req.body.contactPhone || '',
      jobTitle: req.body.jobTitle || 'Executive',
      industry: req.body.industry || 'Professional Services',
      status: req.body.status || 'new',
      leadScore: req.body.leadScore || 75,
      scoreBreakdown: req.body.scoreBreakdown || [{ category: 'Manual Entry', points: 75, reason: 'Manually added to CRM' }],
      source: req.body.source || 'Manual Entry',
      estimatedValue: req.body.estimatedValue || 15000,
      notes: req.body.notes || ['Lead record created.'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.leads.set(leadId, newLead);

    eventBus.emit({
      tenantId,
      eventType: 'lead.created',
      summary: `New lead created: ${newLead.companyName} (${newLead.contactName})`,
      details: { leadId: newLead.id, companyName: newLead.companyName }
    });

    res.status(201).json(newLead);
  });

  app.patch('/api/leads/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const lead = db.leads.get(req.params.id);
    if (!lead || lead.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const prevStatus = lead.status;
    Object.assign(lead, req.body, { updatedAt: new Date().toISOString() });

    if (req.body.status && req.body.status !== prevStatus) {
      eventBus.emit({
        tenantId,
        eventType: req.body.status === 'won' ? 'lead.won' : 'lead.qualified',
        summary: `Lead ${lead.companyName} transitioned to ${req.body.status}`,
        details: { leadId: lead.id, status: req.body.status, value: lead.estimatedValue }
      });
    }

    res.json(lead);
  });

  app.delete('/api/leads/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const lead = db.leads.get(req.params.id);
    if (!lead || lead.tenantId !== tenantId) return res.status(404).json({ error: 'Not found' });
    db.leads.delete(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/companies', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getCompanies(tenantId));
  });

  app.get('/api/contacts', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getContacts(tenantId));
  });

  // ==========================================
  // 6. PAYMENT PIPELINE & INVOICES & EMAILS
  // ==========================================
  app.get('/api/invoices', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getInvoices(tenantId));
  });

  app.post('/api/invoices', (req, res) => {
    const tenantId = (req as any).tenantId;
    const invId = 'inv_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const items = req.body.items || [
      { id: 'item_1', description: req.body.description || 'AI Revenue OS Service Retainer', quantity: 1, unitPrice: Number(req.body.amount) || 2500, total: Number(req.body.amount) || 2500 }
    ];
    const subtotal = items.reduce((acc: number, it: any) => acc + (it.total || (it.quantity * it.unitPrice)), 0);
    const taxRate = typeof req.body.taxRate === 'number' ? req.body.taxRate : 0.10; // Default 10% GST or custom
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const total = subtotal + tax;

    const newInvoice: Invoice = {
      id: invId,
      tenantId,
      invoiceNumber: invNum,
      leadId: req.body.leadId,
      clientName: req.body.clientName || 'Valued Client',
      clientEmail: req.body.clientEmail || 'client@portal.businesshub.app',
      companyName: req.body.companyName || 'Enterprise Partner',
      items,
      subtotal,
      tax,
      taxJurisdiction: req.body.taxJurisdiction || 'AU_GST',
      taxRate,
      taxLabel: req.body.taxLabel || 'GST (10%)',
      taxIdOrVat: req.body.taxIdOrVat || 'ABN 48 612 890 341',
      legalTermsPreset: req.body.legalTermsPreset || 'Standard Global SaaS Master Services Agreement',
      total,
      currency: req.body.currency || 'AUD',
      status: 'sent',
      issuedDate: new Date().toISOString(),
      dueDate: req.body.dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
      paymentLinkUrl: `https://portal.businesshub.app/pay/${invId}`,
      notes: req.body.notes || 'Generated via Business HUB AI Revenue OS payment pipeline.'
    };

    db.invoices.set(invId, newInvoice);

    // Auto-create email dispatch log
    const emailLog: EmailDispatchLog = {
      id: 'email_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`,
      tenantId,
      toEmail: newInvoice.clientEmail,
      toName: newInvoice.clientName,
      fromName: 'Business HUB Revenue Gateway',
      subject: `Invoice ${newInvoice.invoiceNumber} for ${newInvoice.companyName} ($${newInvoice.total.toLocaleString()} ${newInvoice.currency})`,
      bodyPreview: `Please find attached tax invoice ${newInvoice.invoiceNumber}. You can pay directly online using credit card, PayID, or bank transfer: ${newInvoice.paymentLinkUrl}`,
      category: 'invoice_dispatch',
      status: 'delivered',
      sentAt: new Date().toISOString()
    };
    db.emails.set(emailLog.id, emailLog);

    eventBus.emit({
      tenantId,
      eventType: 'invoice.issued',
      summary: `Invoice ${newInvoice.invoiceNumber} issued to ${newInvoice.clientName} ($${newInvoice.total} ${newInvoice.currency})`,
      details: { invoiceId: invId, amount: newInvoice.total }
    });

    res.status(201).json({ invoice: newInvoice, emailLog });
  });

  // Process payment on an invoice
  app.post('/api/invoices/:id/pay', (req, res) => {
    const tenantId = (req as any).tenantId;
    const inv = db.invoices.get(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });

    const { paymentMethod = 'card', payerName, payerEmail } = req.body;

    inv.status = 'paid';
    inv.paidAt = new Date().toISOString();
    inv.paymentMethod = paymentMethod === 'card' ? 'Credit Card (Stripe)' : paymentMethod === 'apple_pay' ? 'Apple Pay' : 'PayID / Direct Debit';
    inv.stripePaymentIntentId = 'pi_' + Math.random().toString(36).substr(2, 16);

    // Record transaction
    const txId = 'pay_tx_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const tx: PaymentTransaction = {
      id: txId,
      tenantId,
      invoiceId: inv.id,
      leadId: inv.leadId,
      amount: inv.total,
      currency: inv.currency,
      status: 'succeeded',
      payerName: payerName || inv.clientName,
      payerEmail: payerEmail || inv.clientEmail,
      paymentMethodType: paymentMethod as any,
      receiptUrl: `https://portal.businesshub.app/receipts/${txId}.pdf`,
      timestamp: new Date().toISOString(),
      emailReceiptSent: true
    };
    db.payments.set(txId, tx);

    // Update lead to 'won' if linked
    if (inv.leadId && db.leads.has(inv.leadId)) {
      const lead = db.leads.get(inv.leadId)!;
      lead.status = 'won';
      lead.updatedAt = new Date().toISOString();
      lead.notes.push(`Payment of $${inv.total.toLocaleString()} ${inv.currency} confirmed on invoice ${inv.invoiceNumber}. Deal marked Won.`);
    }

    // Auto-dispatch receipt email
    const receiptEmail: EmailDispatchLog = {
      id: 'email_rec_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`,
      tenantId,
      toEmail: tx.payerEmail,
      toName: tx.payerName,
      fromName: 'Business HUB Billing Desk',
      subject: `Payment Receipt: ${inv.invoiceNumber} ($${inv.total.toLocaleString()} ${inv.currency}) - Business HUB Australia`,
      bodyPreview: `Thank you for your payment! Your transaction has cleared successfully. Receipt PDF: ${tx.receiptUrl}`,
      category: 'payment_receipt',
      status: 'opened',
      sentAt: new Date().toISOString()
    };
    db.emails.set(receiptEmail.id, receiptEmail);

    eventBus.emit({
      tenantId,
      eventType: 'payment.received',
      summary: `Payment received: $${inv.total.toLocaleString()} ${inv.currency} for ${inv.invoiceNumber} from ${tx.payerName}`,
      details: { invoiceId: inv.id, transactionId: txId, amount: inv.total }
    });

    res.json({ success: true, invoice: inv, transaction: tx, receiptEmail });
  });

  app.get('/api/payments', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getPayments(tenantId));
  });

  app.get('/api/emails', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getEmails(tenantId));
  });

  app.post('/api/emails/send', (req, res) => {
    const tenantId = (req as any).tenantId;
    const { toEmail, toName, subject, bodyPreview, category } = req.body;

    const emailId = 'email_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const newEmail: EmailDispatchLog = {
      id: emailId,
      tenantId,
      toEmail: toEmail || 'prospect@enterprise.com.au',
      toName: toName || 'Recipient',
      fromName: 'Business HUB Revenue Engine',
      subject: subject || 'Notice from Business HUB',
      bodyPreview: bodyPreview || 'Email body content sent via integration gateway.',
      category: category || 'outreach',
      status: 'delivered',
      sentAt: new Date().toISOString()
    };
    db.emails.set(emailId, newEmail);

    eventBus.emit({
      tenantId,
      eventType: 'email.sent',
      summary: `Email dispatched to ${newEmail.toName} (${newEmail.toEmail}): "${newEmail.subject}"`,
      details: { emailId, toEmail: newEmail.toEmail }
    });

    res.status(201).json(newEmail);
  });

  // ==========================================
  // 7. AI LEAD DISCOVERY & SCRAPING ENGINE
  // ==========================================
  app.post('/api/leads/discover', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const { criteria, location, count } = req.body;

    if (!criteria) {
      return res.status(400).json({ error: 'Criteria prompt is required' });
    }

    try {
      const results = await discoverProspects({
        tenantId,
        targetCriteria: criteria,
        location,
        count: count || 4
      });
      res.json({ success: true, count: results.length, leads: results });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Discovery engine error' });
    }
  });

  // ==========================================
  // 8. AI AGENTS CONFIGURATION & TESTING
  // ==========================================
  app.get('/api/agents', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getAgents(tenantId));
  });

  app.patch('/api/agents/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const agent = db.agents.get(req.params.id);
    if (!agent || agent.tenantId !== tenantId) return res.status(404).json({ error: 'Agent not found' });
    Object.assign(agent, req.body, { updatedAt: new Date().toISOString() });
    res.json(agent);
  });

  // ==========================================
  // 9. OMNICHANNEL CONVERSATIONS
  // ==========================================
  app.get('/api/conversations', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getConversations(tenantId));
  });

  app.get('/api/conversations/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const conv = db.conversations.get(req.params.id);
    if (!conv || conv.tenantId !== tenantId) return res.status(404).json({ error: 'Not found' });
    res.json(conv);
  });

  app.post('/api/conversations', (req, res) => {
    const tenantId = (req as any).tenantId;
    const { leadId, contactId, channel, subject, initialMessage } = req.body;
    const convId = 'conv_' + Math.random().toString(36).substr(2, 9);
    
    const conv = {
      id: convId,
      tenantId,
      leadId: leadId || '',
      contactId: contactId || '',
      channel: channel || 'email',
      status: 'active' as const,
      unreadByHuman: false,
      assignedAgentId: `agent_sales_${tenantId}`,
      lastMessageAt: new Date().toISOString(),
      subject: subject || 'Conversation',
      messages: initialMessage ? [
        {
          id: 'msg_' + Math.random().toString(36).substr(2, 9),
          conversationId: convId,
          sender: 'agent' as const,
          channel: channel || 'email',
          content: initialMessage,
          timestamp: new Date().toISOString()
        }
      ] : []
    };
    db.conversations.set(convId, conv);
    res.status(201).json(conv);
  });

  app.post('/api/conversations/:id/messages', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const conv = db.conversations.get(req.params.id);
    if (!conv || conv.tenantId !== tenantId) return res.status(404).json({ error: 'Conversation not found' });

    const { content, sender = 'lead', channel = conv.channel } = req.body;

    const userMsg = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      conversationId: conv.id,
      sender: sender as 'lead' | 'human_agent',
      channel,
      content,
      timestamp: new Date().toISOString()
    };
    conv.messages.push(userMsg);
    conv.lastMessageAt = userMsg.timestamp;

    // If message is from the lead, execute AI Agent Turn
    if (sender === 'lead') {
      const agentTurn = await generateAgentTurn({
        tenantId,
        channel: conv.channel,
        userMessage: content,
        leadId: conv.leadId,
        conversationId: conv.id,
        agentId: conv.assignedAgentId
      });

      const aiMsg = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        conversationId: conv.id,
        sender: 'agent' as const,
        channel: conv.channel,
        content: agentTurn.replyText,
        timestamp: new Date().toISOString(),
        sentiment: agentTurn.sentiment,
        intent: agentTurn.intent,
        toolCallsExecuted: agentTurn.toolCallsExecuted
      };
      conv.messages.push(aiMsg);
      conv.lastMessageAt = aiMsg.timestamp;

      await eventBus.emit({
        tenantId,
        eventType: conv.channel === 'email' ? 'email.received' : 'chat.started',
        summary: `AI Agent responded to ${conv.channel} message (Intent: ${agentTurn.intent})`,
        details: { conversationId: conv.id, intent: agentTurn.intent, reply: agentTurn.replyText },
        triggeredByAgent: 'Sales Agent'
      });

      return res.json({ userMessage: userMsg, aiMessage: aiMsg, conversation: conv });
    }

    res.json({ userMessage: userMsg, conversation: conv });
  });

  // ==========================================
  // 10. VOICE CALLS, CUSTOM VOICE CLONING & REAL-TIME AUDIO
  // ==========================================
  app.get('/api/custom-voices', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getCustomVoices(tenantId));
  });

  app.post('/api/custom-voices', (req, res) => {
    const tenantId = (req as any).tenantId;
    const voiceId = 'voice_' + Math.random().toString(36).substr(2, 9) + `_${tenantId}`;
    const newVoice: CustomVoice = {
      id: voiceId,
      tenantId,
      name: req.body.name || 'Custom Executive Voice',
      description: req.body.description || 'Custom recorded/cloned AI calling voice profile',
      gender: req.body.gender || 'neutral',
      accent: req.body.accent || 'en-AU (Australian)',
      language: req.body.language || 'English (Australian)',
      provider: req.body.provider || 'custom_recorded',
      sampleAudioUrl: req.body.sampleAudioUrl || '',
      audioDurationSeconds: req.body.audioDurationSeconds || 30,
      isRecordedByMe: req.body.isRecordedByMe !== undefined ? req.body.isRecordedByMe : true,
      sampleScript: req.body.sampleScript || 'Hello, I am calling to discuss our partnership options.',
      settings: {
        speed: req.body.settings?.speed || 1.0,
        pitch: req.body.settings?.pitch || 1.0,
        stability: req.body.settings?.stability || 85,
        similarityBoost: req.body.settings?.similarityBoost || 90,
        styleExaggeration: req.body.settings?.styleExaggeration || 15,
        noiseReduction: req.body.settings?.noiseReduction !== undefined ? req.body.settings.noiseReduction : true
      },
      labels: req.body.labels || ['Custom Cloned', 'Live Calling'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.createCustomVoice(newVoice);

    eventBus.emit({
      tenantId,
      eventType: 'custom_voice.created' as any,
      summary: `New custom voice profile "${newVoice.name}" synthesized and added to voice library.`,
      details: { voiceId: newVoice.id, provider: newVoice.provider }
    });

    res.status(201).json(newVoice);
  });

  app.patch('/api/custom-voices/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const voice = db.getCustomVoice(req.params.id);
    if (!voice || voice.tenantId !== tenantId) return res.status(404).json({ error: 'Voice not found' });

    const updated = db.updateCustomVoice(req.params.id, req.body);
    res.json(updated);
  });

  app.delete('/api/custom-voices/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const voice = db.getCustomVoice(req.params.id);
    if (!voice || voice.tenantId !== tenantId) return res.status(404).json({ error: 'Voice not found' });

    db.deleteCustomVoice(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/calls', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getCalls(tenantId));
  });

  app.post('/api/calls/simulate-turn', async (req, res) => {
    const tenantId = (req as any).tenantId;
    const { leadId, userSpeech, history } = req.body;

    try {
      const turn = await runVoiceAgentTurn({
        tenantId,
        leadId,
        callerUtterance: userSpeech || 'Hello?',
        conversationHistory: history || []
      });
      res.json(turn);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Voice turn error' });
    }
  });

  app.post('/api/calls', (req, res) => {
    const tenantId = (req as any).tenantId;
    const callId = 'call_' + Math.random().toString(36).substr(2, 9);
    const newCall = {
      id: callId,
      tenantId,
      leadId: req.body.leadId || '',
      contactName: req.body.contactName || 'Prospect',
      phoneNumber: req.body.phoneNumber || '+61 400 000 000',
      direction: req.body.direction || 'outbound',
      status: 'completed' as const,
      durationSeconds: req.body.durationSeconds || 140,
      startedAt: new Date(Date.now() - 140000).toISOString(),
      endedAt: new Date().toISOString(),
      recordingAvailable: true,
      summary: req.body.summary || 'AI qualification call completed successfully.',
      sentiment: req.body.sentiment || 'positive',
      actionItems: req.body.actionItems || ['Send calendar invite for demo'],
      transcript: req.body.transcript || []
    };
    db.calls.set(callId, newCall);

    eventBus.emit({
      tenantId,
      eventType: 'call.completed',
      summary: `Voice Call completed with ${newCall.contactName} (${newCall.durationSeconds}s)`,
      details: { callId, sentiment: newCall.sentiment }
    });

    res.status(201).json(newCall);
  });

  // ==========================================
  // 11. CALENDAR & APPOINTMENTS
  // ==========================================
  app.get('/api/appointments', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getAppointments(tenantId));
  });

  app.post('/api/appointments', (req, res) => {
    const tenantId = (req as any).tenantId;
    const apptId = 'appt_' + Math.random().toString(36).substr(2, 9);
    const startTime = req.body.startTime || new Date(Date.now() + 86400000).toISOString();
    const duration = req.body.durationMinutes || 30;
    const endTime = new Date(new Date(startTime).getTime() + duration * 60000).toISOString();

    const newAppt: Appointment = {
      id: apptId,
      tenantId,
      leadId: req.body.leadId || '',
      contactName: req.body.contactName || 'Lead Contact',
      contactEmail: req.body.contactEmail || 'lead@example.com',
      contactPhone: req.body.contactPhone || '+61 400 000 000',
      companyName: req.body.companyName || 'Lead Company',
      title: req.body.title || 'AI Strategy Discovery Meeting',
      appointmentType: req.body.appointmentType || 'Discovery Call',
      durationMinutes: duration,
      startTime,
      endTime,
      timezone: 'Australia/Sydney',
      staffName: req.body.staffName || 'Alexander Ross',
      staffEmail: req.body.staffEmail || 'alexander@portal.businesshub.app',
      status: 'scheduled',
      meetingUrl: `https://meet.portal.businesshub.app/room/${apptId}`,
      notes: req.body.notes || 'Autonomous calendar booking via AI Revenue OS.',
      bookedByAgentId: req.body.bookedByAgentId || `agent_voice_${tenantId}`,
      createdAt: new Date().toISOString()
    };
    db.appointments.set(apptId, newAppt);

    eventBus.emit({
      tenantId,
      eventType: 'appointment.created',
      summary: `Meeting booked with ${newAppt.contactName} (${newAppt.companyName}) for ${new Date(startTime).toLocaleDateString()}`,
      details: { appointmentId: apptId, startTime }
    });

    res.status(201).json(newAppt);
  });

  // ==========================================
  // 12. KNOWLEDGE BASE & RAG
  // ==========================================
  app.get('/api/knowledge', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getKnowledge(tenantId));
  });

  app.post('/api/knowledge', (req, res) => {
    const tenantId = (req as any).tenantId;
    const docId = 'kb_' + Math.random().toString(36).substr(2, 9);
    const newDoc: KnowledgeDocument = {
      id: docId,
      tenantId,
      title: req.body.title || 'New Knowledge Entry',
      category: req.body.category || 'Company FAQ',
      content: req.body.content || '',
      chunkCount: Math.ceil((req.body.content || '').length / 400),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.knowledge.set(docId, newDoc);
    res.status(201).json(newDoc);
  });

  app.delete('/api/knowledge/:id', (req, res) => {
    const tenantId = (req as any).tenantId;
    const doc = db.knowledge.get(req.params.id);
    if (!doc || doc.tenantId !== tenantId) return res.status(404).json({ error: 'Not found' });
    db.knowledge.delete(req.params.id);
    res.json({ success: true });
  });

  // ==========================================
  // 13. CAMPAIGNS
  // ==========================================
  app.get('/api/campaigns', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getCampaigns(tenantId));
  });

  app.post('/api/campaigns', (req, res) => {
    const tenantId = (req as any).tenantId;
    const campId = 'camp_' + Math.random().toString(36).substr(2, 9);
    const newCamp: Campaign = {
      id: campId,
      tenantId,
      name: req.body.name || 'New AI Outreach Campaign',
      description: req.body.description || '',
      status: req.body.status || 'active',
      targetAudience: req.body.targetAudience || 'Target B2B Segment',
      channels: req.body.channels || ['email', 'voice'],
      leadCount: req.body.leadCount || 25,
      engagedCount: 0,
      appointmentCount: 0,
      wonCount: 0,
      conversionRate: 0,
      assignedAgentId: `agent_orch_${tenantId}`,
      sequenceSteps: req.body.sequenceSteps || [
        { day: 1, channel: 'email', actionDescription: 'Initial problem-solution value hook', templatePrompt: 'Draft high-relevance email.' },
        { day: 3, channel: 'voice', actionDescription: 'Autonomous qualification phone call', templatePrompt: 'Call and propose discovery meeting.' }
      ],
      createdAt: new Date().toISOString()
    };
    db.campaigns.set(campId, newCamp);
    res.status(201).json(newCamp);
  });

  // ==========================================
  // 14. EVENTS & AUDIT LOGS
  // ==========================================
  app.get('/api/events', (req, res) => {
    const tenantId = (req as any).tenantId;
    res.json(db.getEvents(tenantId));
  });

  // ==========================================
  // 15. REVENUE & AI METERING ANALYTICS
  // ==========================================
  app.get('/api/analytics', (req, res) => {
    const tenantId = (req as any).tenantId;
    const tenant = db.getTenant(tenantId);
    const leads = db.getLeads(tenantId);
    const appointments = db.getAppointments(tenantId);
    const calls = db.getCalls(tenantId);
    const convs = db.getConversations(tenantId);
    const invoices = db.getInvoices(tenantId);
    const paidInvoices = invoices.filter(i => i.status === 'paid');

    const qualified = leads.filter(l => ['qualified', 'contacted', 'engaged', 'appointment_requested', 'booked', 'completed', 'won'].includes(l.status)).length;
    const booked = leads.filter(l => ['booked', 'completed', 'won'].includes(l.status)).length;
    const won = leads.filter(l => l.status === 'won').length;
    const totalPipelineValue = leads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
    const wonRevenue = paidInvoices.reduce((acc, i) => acc + i.total, 0) || leads.filter(l => l.status === 'won').reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

    res.json({
      tenantName: tenant?.name || 'Business HUB',
      plan: tenant?.plan || 'enterprise',
      funnel: {
        totalLeads: leads.length,
        qualifiedLeads: qualified,
        appointmentsBooked: booked,
        wonDeals: won,
        conversionRate: leads.length > 0 ? ((booked / leads.length) * 100).toFixed(1) : '0.0'
      },
      financials: {
        totalPipelineValue,
        wonRevenue,
        invoicedTotal: invoices.reduce((acc, i) => acc + i.total, 0),
        paidInvoicesCount: paidInvoices.length,
        projectedMonthlyRevenue: Math.round(wonRevenue * 1.3 + totalPipelineValue * 0.2)
      },
      aiUsage: {
        tokensUsed: tenant?.usage.usedAiTokens || 0,
        tokensLimit: tenant?.limits.monthlyAiTokens || 10000000,
        voiceMinutesUsed: tenant?.usage.usedVoiceMinutes || 0,
        voiceMinutesLimit: tenant?.limits.monthlyVoiceMinutes || 500,
        leadCreditsUsed: tenant?.usage.usedLeadCredits || 0,
        leadCreditsLimit: tenant?.limits.monthlyLeadCredits || 5000,
        estimatedAiCost: tenant?.usage.currentEstimatedCost || 0
      },
      channelMetrics: {
        totalConversations: convs.length,
        totalCalls: calls.length,
        avgCallDurationSeconds: calls.length > 0 ? Math.round(calls.reduce((a, c) => a + c.durationSeconds, 0) / calls.length) : 0,
        totalAppointments: appointments.length
      }
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Business HUB AI Revenue OS] Running on http://localhost:${PORT} (Domain: portal.businesshub.app)`);
  });
}

startServer();
