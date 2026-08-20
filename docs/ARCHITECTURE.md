# System Architecture & Technical Specifications

**Platform**: Business HUB Australia Autonomous Revenue Operating System  
**Version**: 2026.4 Production  
**License**: Proprietary Commercial SaaS  

---

## 1. High-Level Architecture

```
+-------------------------------------------------------------------------------+
|                            React 18 SPA Frontend                              |
|   Tailwind CSS  |  Lucide Icons  |  Canvas E-Signature  |  Tenant Context     |
+---------------------------------------+---------------------------------------+
                                        | HTTP / JSON REST
                                        v
+-------------------------------------------------------------------------------+
|                           Express 4.x Backend Server                          |
|  - Rate Limiting & Auth Middleware    - Multi-Tenant Isolation                |
|  - SHA-256 Signature Engine           - Australian DNCR / ACMA Validator      |
|  - Cloud AI Proxy (Gemini, Claude, GPT, DeepSeek, Hermes, OpenClaw)           |
+---------------------------------------+---------------------------------------+
                                        | In-Memory Data Store & Audit Stream
                                        v
+-------------------------------------------------------------------------------+
|                         Database & Repository Layer                           |
|  - Multi-Tenant Schema (Tenants, Users, Leads, Invoices, Voice, Legal Docs)   |
|  - RBAC Audit Trail & Security Ledger                                         |
+-------------------------------------------------------------------------------+
```

---

## 2. API Routes Reference

### Legal & Digital Signatures
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/legal/documents` | Retrieve all master terms and contracts |
| `GET` | `/api/legal/documents/:id` | Retrieve specific agreement with audit certificates |
| `POST` | `/api/legal/documents` | Create new customized contract |
| `PUT` | `/api/legal/documents/:id` | Update clauses or schedule terms |
| `DELETE` | `/api/legal/documents/:id` | Remove document draft |
| `POST` | `/api/legal/documents/:id/sign` | Digitally sign agreement with SHA-256 certification |
| `POST` | `/api/legal/documents/:id/deliver` | Dispatch signed copy via email to recipient |

### Role-Based Access Control (RBAC)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rbac/roles` | List all department roles and permission flags |
| `PUT` | `/api/rbac/roles/:roleId` | Update granular permissions for a role |
| `GET` | `/api/rbac/users` | List department users and their assigned roles |
| `PUT` | `/api/rbac/users/:userId/role` | Reassign user department role |
| `GET` | `/api/rbac/audit-logs` | Retrieve tamper-evident administrative audit trail |

### Cloud AI Providers & Agent Bridges
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cloud-apis` | List configured AI model providers |
| `POST` | `/api/cloud-apis` | Register new cloud or on-prem model endpoint |
| `PUT` | `/api/cloud-apis/:id` | Update model settings or set default |
| `POST` | `/api/cloud-apis/test` | Test latency and connectivity to model provider |
| `GET` | `/api/agent-bridges` | List Hermes / OpenClaw / LangGraph bridges |
| `POST` | `/api/agent-bridges/:id/ping` | Verify agentic swarm heartbeat |

---

## 3. Legal Document Schemas & Digital Integrity

### Cryptographic Hash Construction
When an agreement is digitally executed:
```typescript
const payload = `${document.id}:${signatureData.signatoryEmail}:${Date.now()}:${document.title}`;
const certificateHashSha256 = crypto.createHash('sha256').update(payload).digest('hex');
```

The resulting `DigitalSignatureRecord` stores:
- `signatoryName`, `signatoryEmail`, `signatoryTitle`, `signatoryCompany`, `signatoryTaxIdOrAbn`
- `signatureType` (`draw` | `type` | `crypto_certificate`)
- `signatureDataUrl` (PNG base64 representation of drawn signature)
- `signedAt` (ISO-8601 Timestamp)
- `ipAddress` (IPv4/IPv6 client IP)
- `certificateHashSha256` (64-character hex string)
- `auditTrailId` (`CERT-AU-XXXXXX`)

---

## 4. Australian Regulatory Compliance Framework

1. **Electronic Transactions Act 1999 (Cth) Section 10**: Validates that electronic signatures have full force of law.
2. **Privacy Act 1988 (Cth) & 13 APPs**: Regulates collection, storage, and cross-border transfer of Australian consumer and enterprise records.
3. **Do Not Call Register Act 2006 (Cth)**: Automated scrubbing of outbound voice dialer queues.
4. **Spam Act 2003 (Cth)**: Automated unsubscribe links and commercial consent checks for marketing emails and SMS.
