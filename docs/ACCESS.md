# Authorized Portal Access & Login Credentials

**Platform**: Business HUB Australia Autonomous Revenue Operating System  
**Portal Domain**: `portal.businesshub.app`  
**Security Status**: Production Enforced  

---

## 1. Authorized User Personas & Credentials

| Role Scope | Persona Name | Email Address | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Super Admin** | Alexander Ross | `al4tb15@gmail.com` | `AdminPass2026!` | Full platform administration, cross-tenant management, Cloud AI keys, legal contract signing, RBAC configuration. |
| **Sales Operations (Demo)** | Sarah Jenkins | `sarah.jenkins@businesshub.app` | `StaffPass2026!` | CRM pipeline, AI Voice station dialer, prospect discovery scraping, omnichannel inbox. |
| **Enterprise Client (Demo)** | James Thornton | `james.thornton@apexlegal.com.au` | `ClientPass2026!` | Client self-service portal, tax invoices (GST/VAT receipts), executed legal agreements, consultation bookings. |

---

## 2. Production Authentication Policy

- **Admin Account Security**: To protect tenant configurations and billing infrastructure, the **Super Admin** persona is **excluded from 1-Click login bypass**. Administrators must authenticate with email and password.
- **Demo Accounts**: Fast 1-click sandbox access is provided for the **Staff** (`Sarah Jenkins`) and **Client** (`James Thornton`) personas for testing and workflow demonstration.
- **Tenant Context**: All sessions preserve multi-tenant boundary isolation. Admins can seamlessly switch active tenant context using the top header workspace switcher.

---

## 3. Cloud AI API Providers

The system is configured with open Cloud API routing:
1. **Google Gemini** (`@google/genai`): Gemini 2.5 Flash / Pro (Default server-side engine)
2. **Anthropic Claude**: Claude 3.7 Sonnet / 3.5 Haiku
3. **OpenAI**: GPT-4o / o3-mini
4. **DeepSeek AI**: DeepSeek-R1 / V3
5. **Nous Hermes 3 405B**: Swarm Tool Bus Node
6. **Custom vLLM / Ollama**: On-Premise VPC Sovereign Endpoint

Keys can be configured in the UI under **Cloud APIs & Agent Bridges** (`/cloud_apis`) or in `Settings > Cloud AI Providers`.

---

## 4. CRM Bulk Data Export & SHA-256 Integrity Verification

Authorized roles (`super_admin`, `business_hub_admin`, `account_owner`, `admin`, `manager`, `staff`, `sales_user`) can extract CRM data in CSV and structured JSON format from the CRM Pipeline (`/crm`):

- **Supported Scopes**: Filtered Leads, All Leads Repository, Outreach Campaigns, and Unified Master CRM Bundle.
- **Export Formats**: Standard CSV (RFC 4180 compliant) and Structured JSON with `_exportMetadata` audit envelope.
- **Cryptographic Hash**: Every exported dataset is stamped with an immutable FIPS 180-4 **SHA-256 cryptographic digest**.
- **Companion Manifest**: Generates a standard `.sha256` checksum manifest file for statutory archival and offline integrity verification.
- **Privacy Controls**: Optional PII obfuscation masks direct emails and phone numbers in compliance with the *Privacy Act 1988 (Cth)*.
- **Statutory Audit Log**: Emits an entry to `db.recordRbacAudit()` recording the operator, timestamp, record count, and SHA-256 digest.
