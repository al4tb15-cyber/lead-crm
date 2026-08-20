# Production Maintenance & Operational Runbook

**Platform**: Business HUB Australia Autonomous Revenue Operating System  
**Jurisdiction**: New South Wales, Commonwealth of Australia (ABN 84 629 104 883)  
**Environment**: Full-Stack Node.js / Express / React / Vite Container Runtime  

---

## Table of Contents
1. [System Health Checks & Monitoring](#1-system-health-checks--monitoring)
2. [Role-Based Access Control (RBAC) Administration](#2-role-based-access-control-rbac-administration)
3. [Legal Document Repository & Digital Signature Auditing](#3-legal-document-repository--digital-signature-auditing)
4. [Cloud AI Provider Configuration & Key Rotation](#4-cloud-ai-provider-configuration--key-rotation)
5. [Autonomous Swarm & Bridge Maintenance (Hermes & OpenClaw)](#5-autonomous-swarm--bridge-maintenance-hermes--openclaw)
6. [Australian Regulatory Compliance (ACMA DNCR, Spam Act, Privacy Act)](#6-australian-regulatory-compliance-acma-dncr-spam-act-privacy-act)
7. [Disaster Recovery & Data Integrity](#7-disaster-recovery--data-integrity)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. System Health Checks & Monitoring

### Health Endpoint
The platform exposes a standard health monitoring route:
```http
GET /api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "version": "2.4.0",
  "timestamp": "2026-08-20T06:00:00.000Z",
  "uptime": 14280.24,
  "tenantCount": 1
}
```

### Metrics & AI Metering
- Monitored via `/api/analytics` and `/api/events`.
- Real-time token consumption, voice call duration (seconds), and payment conversions are tracked per tenant.

---

## 2. Role-Based Access Control (RBAC) Administration

### Department Role Structure
| Department | Default Level | Key Capabilities |
| :--- | :--- | :--- |
| **Sales** | `sales_rep` / `sales_manager` | Access CRM, Voice Dialer, Discovery, Lead Scoring |
| **Marketing** | `marketer` | Campaigns, Omnichannel Inbox, RAG Knowledge Base, Public Chat |
| **Operations** | `ops_member` | Calendar Bookings, Billing Invoicing, Client Portal Coordination |
| **Compliance** | `compliance_officer` | ACMA DNCR Audits, Legal Document Execution, Call Disclosures |
| **Admin** | `admin` / `super_admin` | Full system control, Cloud API Key updates, Role Permissions |

### Updating Role Permissions
- Modifications can be executed through the UI at `Settings > Department RBAC` or via:
```http
PUT /api/rbac/roles/:roleId
Content-Type: application/json

{
  "permissions": ["crm_view", "crm_edit", "voice_outbound", "billing_read"]
}
```
- All changes are recorded in the tamper-evident `RbacAuditLog`.

---

## 3. Legal Document Repository & Digital Signature Auditing

### Statutory Compliance
Agreements are executed pursuant to the **Electronic Transactions Act 1999 (Cth)** Section 10.

### Signing Flow
1. User or client opens the document in `Legal Terms & E-Sign` or via `Settings > Legal Documents`.
2. Selects execution method: **Handwritten Canvas Draw**, **Executive Cursive**, or **PKI Certificate**.
3. Posts payload to `/api/legal/documents/:id/sign`.
4. The system calculates a deterministic SHA-256 digest:
   $$\text{Hash} = \text{SHA256}(\text{docId} + \text{signatoryEmail} + \text{timestamp} + \text{title})$$
5. The agreement is stamped with status `executed` and countersigned by Business HUB Australia Legal Counsel.

### Document Delivery
To dispatch the signed agreement to the client's verified email inbox:
```http
POST /api/legal/documents/:id/deliver
Content-Type: application/json

{
  "recipientEmail": "client@enterprise.com.au",
  "recipientName": "Harrison Sterling"
}
```
This logs an email dispatch entry in `EmailDispatchLog` with the subject and download link.

---

## 4. Cloud AI Provider Configuration & Key Rotation

### Dynamic Provider Switching
Business HUB supports hot-swapping between foundational models without restarting the server:

1. **Google Gemini** (Gemini 2.5 Flash, Gemini 2.5 Pro): Default server-side engine.
2. **Anthropic Claude** (Claude 3.7 Sonnet, Claude 3.5 Haiku): Complex contracts and objection resolution.
3. **OpenAI** (GPT-4o, o3-mini): Fast JSON structuring and conversational turns.
4. **DeepSeek** (DeepSeek-R1, DeepSeek-V3): Mathematical reasoning & market audit.
5. **Custom / On-Prem vLLM**: Sovereign VPC endpoints for data residency.

### Key Rotation Steps
1. Navigate to **Cloud APIs & Agent Bridges** (`/cloud_apis`).
2. Add or update the API key for the respective provider.
3. Click **"Test Connection / Ping"** to verify latency and HTTP 200 response.
4. Click **"Make Default"** to set as the active provider across all autonomous voice and chat agents.

---

## 5. Autonomous Swarm & Bridge Maintenance (Hermes & OpenClaw)

### Nous Hermes 3 Function Gateway
- **Endpoint**: `https://hermes-agent.portal.businesshub.app/api/v2/agents/revenue-orchestrator`
- **Protocol**: `hermes_fc_protocol` (High-speed multi-tool execution).
- **Maintenance Action**: Use `/api/agent-bridges/:id/ping` to test heartbeat.

### OpenClaw Autonomous Web Crawlers
- **Protocol**: `openclaw_tool_bus` (Parallel web scraping & lead extraction).
- **Concurrency**: Configured to 6 distributed worker nodes.

---

## 6. Australian Regulatory Compliance (ACMA DNCR, Spam Act, Privacy Act)

### 1. Do Not Call Register (DNCR)
- Before initiating any outbound campaign or automated voice call, verify against `/api/compliance/dncr-scrub`.
- Exemption rules: Prior B2B express consent, inquiries within 30 days.

### 2. Spam Act 2003 (Cth)
- All automated email and SMS dispatches must include:
  - Sender identity (`Business HUB Australia Pty Ltd ABN 84 629 104 883`).
  - Clear functional unsubscribe mechanism.
  - Verification of commercial consent.

### 3. Australian Privacy Principles (APPs 1988)
- Data sovereignty: All customer CRM data and call recordings are hosted exclusively in Australian cloud regions (AWS/GCP Sydney).
- Notifiable Data Breaches (NDB): Incidents must trigger notification within 24 hours.

---

## 7. Disaster Recovery & Data Integrity

- **RPO (Recovery Point Objective)**: < 15 minutes.
- **RTO (Recovery Time Objective)**: < 60 minutes.
- In container environments, state is loaded and seeded automatically via `server/db.ts` upon startup.

---

## 8. Troubleshooting & FAQ

### Issue: "Signatory email is required"
- **Solution**: Ensure `signatoryEmail` and `signatoryName` are provided in the `/api/legal/documents/:id/sign` payload.

### Issue: "Cloud API ping timeout"
- **Solution**: Check provider rate limits and verify that the API key is active. Test using the `/api/cloud-apis/test` endpoint.

### Issue: "Port mismatch or 502 Bad Gateway"
- **Solution**: Ensure the Express server in `server.ts` is strictly bound to `0.0.0.0:3000`. Never configure custom ports.
