import { Department, PermissionModule } from '../../../types/index.ts';

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'leads',
    name: 'Lead Discovery & CRM',
    description: 'Prospect searching, ABN/ASIC live enrichment, score tuning, and CRM records management.',
    icon: 'Users',
    departmentScope: ['sales', 'marketing', 'admin', 'operations', 'executive'],
    permissions: [
      { key: 'leads:view', label: 'View Leads & Companies', description: 'Browse and search prospect lists and company profiles', category: 'read' },
      { key: 'leads:create', label: 'Create Prospects', description: 'Add new prospective companies and contacts manually or via CSV', category: 'write' },
      { key: 'leads:enrich', label: 'Run AI & ASIC Enrichment', description: 'Trigger live Australian business register and AI profile scrapers', category: 'write' },
      { key: 'leads:edit', label: 'Modify Lead Details', description: 'Update pipeline stages, deal values, and custom CRM attributes', category: 'write' },
      { key: 'leads:delete', label: 'Delete Records', description: 'Permanently remove or archive contact and lead records', category: 'delete', isHighRisk: true },
      { key: 'leads:export', label: 'Export Data to CSV', description: 'Download customer lists and contact databases externally', category: 'read', isHighRisk: true }
    ]
  },
  {
    id: 'voice',
    name: 'AI Voice Calling Station',
    description: 'Outbound live telephony, real-time agent speech synthesis, and call telemetry.',
    icon: 'PhoneCall',
    departmentScope: ['sales', 'operations', 'admin'],
    permissions: [
      { key: 'voice:initiate_call', label: 'Initiate Outbound Calls', description: 'Launch automated AI outbound phone calls to prospective clients', category: 'write' },
      { key: 'voice:listen_audio', label: 'Listen Call Audio', description: 'Stream live synthesized call audio during active sessions', category: 'read' },
      { key: 'voice:export_recordings', label: 'Export Recordings & Transcripts', description: 'Download call audio WAV files and full AI conversation logs', category: 'read' },
      { key: 'voice:override_dncr', label: 'Supervisor DNCR Override', description: 'Authorize emergency compliance exceptions for registered numbers', category: 'admin', isHighRisk: true }
    ]
  },
  {
    id: 'voice_studio',
    name: 'Custom Voice Studio & Cloning',
    description: 'Voice clone recordings, neural voice synthesis tuning, and per-agent acoustic assignments.',
    icon: 'Mic2',
    departmentScope: ['marketing', 'admin', 'sales'],
    permissions: [
      { key: 'voice_studio:view', label: 'View Voice Library', description: 'Browse available cloned voices and system presets', category: 'read' },
      { key: 'voice_studio:record_clone', label: 'Record & Clone Voices', description: 'Record microphone samples to generate custom AI voice clones', category: 'write' },
      { key: 'voice_studio:tune_neural', label: 'Tune Neural Parameters', description: 'Modify stability, pitch, speed, and latency parameters', category: 'write' },
      { key: 'voice_studio:assign_agent', label: 'Assign Voices to Agents', description: 'Link custom voices to autonomous calling agents', category: 'admin' }
    ]
  },
  {
    id: 'communications',
    name: 'Omnichannel Communications',
    description: 'Unified multi-channel inbox across email, SMS, and live webchat channels.',
    icon: 'Mail',
    departmentScope: ['sales', 'marketing', 'operations', 'admin'],
    permissions: [
      { key: 'communications:view', label: 'View Unified Inbox', description: 'Read incoming and outgoing email, SMS, and chat threads', category: 'read' },
      { key: 'communications:send_email', label: 'Send Outbound Emails', description: 'Dispatch manual and automated email sequences', category: 'write' },
      { key: 'communications:send_sms', label: 'Send Australian SMS', description: 'Transmit compliant text messages with opt-out mechanisms', category: 'write' },
      { key: 'communications:manage_templates', label: 'Manage Templates', description: 'Create and edit standardized response and sequence templates', category: 'write' }
    ]
  },
  {
    id: 'agents',
    name: 'Autonomous AI Agents Hub',
    description: 'Agentic prompts, tool bus connections, decision temperature, and deployment configuration.',
    icon: 'Bot',
    departmentScope: ['admin', 'operations'],
    permissions: [
      { key: 'agents:view', label: 'View Agent Configurations', description: 'Inspect persona guidelines, telemetry, and execution logs', category: 'read' },
      { key: 'agents:edit_prompt', label: 'Modify System Prompts', description: 'Update AI system instructions, objection handlers, and tone', category: 'write', isHighRisk: true },
      { key: 'agents:toggle_tools', label: 'Configure Tool Buses', description: 'Enable or disable CRM, Scraper, and Voice tools on agents', category: 'admin' },
      { key: 'agents:create_agent', label: 'Deploy New Agents', description: 'Create and initialize brand new autonomous AI worker nodes', category: 'admin' }
    ]
  },
  {
    id: 'campaigns',
    name: 'Multi-Touch Outreach Campaigns',
    description: 'Automated multi-day drip cadences, audience segmentation, and funnel analytics.',
    icon: 'Send',
    departmentScope: ['marketing', 'sales', 'admin', 'executive'],
    permissions: [
      { key: 'campaigns:view', label: 'View Campaigns & Metrics', description: 'Review active outreach cadences and delivery status', category: 'read' },
      { key: 'campaigns:create', label: 'Create New Campaigns', description: 'Design multi-touch email, call, and SMS sequences', category: 'write' },
      { key: 'campaigns:launch', label: 'Launch / Pause Campaigns', description: 'Execute live campaign triggers and dispatch schedules', category: 'write' },
      { key: 'campaigns:analytics', label: 'Advanced Funnel Analytics', description: 'Access granular conversion and ROI telemetry dashboards', category: 'read' }
    ]
  },
  {
    id: 'calendar',
    name: 'Calendar & Bookings',
    description: 'Appointment slot management, Google Workspace integration, and meeting rescheduling.',
    icon: 'Calendar',
    departmentScope: ['sales', 'operations', 'admin', 'executive'],
    permissions: [
      { key: 'calendar:view', label: 'View Team Schedules', description: 'Browse booked discovery calls and rep availability', category: 'read' },
      { key: 'calendar:book', label: 'Book Appointments', description: 'Reserve meeting slots with qualified prospective clients', category: 'write' },
      { key: 'calendar:reschedule', label: 'Reschedule / Cancel', description: 'Modify booked time slots and send calendar updates', category: 'write' },
      { key: 'calendar:sync_settings', label: 'Configure Calendar Sync', description: 'Connect Google Workspace & Microsoft 365 calendar feeds', category: 'admin' }
    ]
  },
  {
    id: 'knowledge',
    name: 'RAG Knowledge Documents',
    description: 'Indexing company documents, compliance guidelines, pricing sheets, and objection answers.',
    icon: 'FileText',
    departmentScope: ['admin', 'sales', 'marketing', 'operations'],
    permissions: [
      { key: 'knowledge:view', label: 'Search Knowledge Base', description: 'Query indexed knowledge vectors and training snippets', category: 'read' },
      { key: 'knowledge:upload', label: 'Upload & Index Documents', description: 'Ingest PDF, Markdown, and TXT files for AI retrieval', category: 'write' },
      { key: 'knowledge:delete', label: 'Delete Documents', description: 'Remove indexed company files and knowledge chunks', category: 'delete', isHighRisk: true }
    ]
  },
  {
    id: 'billing',
    name: 'Invoicing & Stripe Billing',
    description: 'Australian GST invoicing, payment transactions, credit top-ups, and subscription management.',
    icon: 'CreditCard',
    departmentScope: ['admin', 'operations', 'executive'],
    permissions: [
      { key: 'billing:view', label: 'View Invoices & Balances', description: 'Inspect transaction receipts and voice/token credit usage', category: 'read' },
      { key: 'billing:issue_invoice', label: 'Issue Tax Invoices', description: 'Generate AUD invoices with 10% Australian GST calculations', category: 'write' },
      { key: 'billing:manage_plan', label: 'Manage Tenant Plan', description: 'Upgrade subscription tiers and configure auto-replenish', category: 'admin', isHighRisk: true }
    ]
  },
  {
    id: 'bridges',
    name: 'Hermes & OpenClaw Bridges',
    description: 'Agentic worker node telemetry, task orchestration, and background worker queues.',
    icon: 'Cpu',
    departmentScope: ['admin', 'operations'],
    permissions: [
      { key: 'bridges:view', label: 'View Cluster Telemetry', description: 'Monitor worker latency, memory usage, and task states', category: 'read' },
      { key: 'bridges:dispatch_tasks', label: 'Dispatch Remote Tasks', description: 'Send high-concurrency enrichment jobs to worker nodes', category: 'write' },
      { key: 'bridges:manage_workers', label: 'Manage Worker Nodes', description: 'Start, pause, scale, or terminate background bridge processes', category: 'admin', isHighRisk: true }
    ]
  },
  {
    id: 'settings',
    name: 'Workspace Governance & RBAC',
    description: 'Tenant white-label branding, DNCR compliance policies, and departmental role delegations.',
    icon: 'Shield',
    departmentScope: ['admin'],
    permissions: [
      { key: 'settings:view', label: 'View Workspace Settings', description: 'Inspect general workspace details and compliance status', category: 'read' },
      { key: 'settings:manage_rbac', label: 'Manage Roles & Permissions', description: 'Create, modify, and delete department roles and assign users', category: 'admin', isHighRisk: true },
      { key: 'settings:manage_branding', label: 'Update White-Label Branding', description: 'Change tenant company name, colors, and custom subdomains', category: 'admin' },
      { key: 'settings:manage_compliance', label: 'Enforce Telecommunications Policy', description: 'Configure Australian DNCR, Spam Act, and calling hour rules', category: 'admin', isHighRisk: true }
    ]
  }
];

export const DEPARTMENT_CONFIGS: Record<Department, { label: string; color: string; bg: string; border: string; description: string; defaultPermissions: string[] }> = {
  admin: {
    label: 'Administration',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    description: 'Total control over workspace configuration, security policies, billing, and team permissions.',
    defaultPermissions: ['*']
  },
  sales: {
    label: 'Sales & Revenue',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    description: 'Lead generation, live outbound autonomous calling, meeting scheduling, and deal closing.',
    defaultPermissions: [
      'leads:view', 'leads:create', 'leads:enrich', 'leads:edit',
      'voice:initiate_call', 'voice:listen_audio',
      'communications:view', 'communications:send_email', 'communications:send_sms',
      'calendar:view', 'calendar:book', 'calendar:reschedule',
      'campaigns:view', 'knowledge:view'
    ]
  },
  marketing: {
    label: 'Marketing & Growth',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    description: 'Multi-touch outbound campaigns, voice cloning, template management, and funnel analytics.',
    defaultPermissions: [
      'campaigns:view', 'campaigns:create', 'campaigns:launch', 'campaigns:analytics',
      'leads:view', 'leads:create', 'leads:enrich', 'leads:export',
      'voice_studio:view', 'voice_studio:record_clone', 'voice_studio:tune_neural', 'voice_studio:assign_agent',
      'communications:view', 'communications:send_email', 'communications:manage_templates',
      'knowledge:view', 'knowledge:upload'
    ]
  },
  operations: {
    label: 'Operations & Compliance',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    description: 'Australian telecommunications compliance, worker cluster oversight, and operational reliability.',
    defaultPermissions: [
      'settings:view', 'settings:manage_compliance',
      'leads:view', 'leads:edit',
      'voice:listen_audio', 'voice:export_recordings',
      'communications:view', 'calendar:view', 'calendar:reschedule',
      'knowledge:view', 'billing:view', 'bridges:view'
    ]
  },
  support: {
    label: 'Client Success & Support',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'Customer inquiry triage, multi-channel messaging, and calendar rescheduling.',
    defaultPermissions: [
      'leads:view', 'leads:edit',
      'communications:view', 'communications:send_email', 'communications:send_sms',
      'calendar:view', 'calendar:reschedule', 'knowledge:view'
    ]
  },
  executive: {
    label: 'Executive & Board',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    description: 'High-level business intelligence, conversion funnels, financial reporting, and read-only telemetry.',
    defaultPermissions: [
      'leads:view', 'campaigns:view', 'campaigns:analytics',
      'calendar:view', 'billing:view', 'analytics:view'
    ]
  }
};
