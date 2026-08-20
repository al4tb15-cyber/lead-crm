# Autonomous Agent Maintenance & Operational Guidelines

This document provides system-level rules and guidelines for AI coding agents and human engineers maintaining the **Business HUB Australia** platform.

---

## 1. System Architecture Overview

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Lucide Icons.
- **Backend Server**: Node.js + Express (`server.ts`) bundled with `esbuild` for CommonJS runtime stability.
- **Database Layer**: In-memory high-throughput multi-tenant relational store (`server/db.ts`) with cryptographic sealing and transactional audit logging.
- **Cloud Ingress & Port**: Hardcoded to Port `3000` on Host `0.0.0.0`. Do NOT modify the port.

---

## 2. Key Modules & Conventions

### A. Role-Based Access Control (RBAC)
- All department permissions are scoped under `DepartmentRole` (`sales`, `marketing`, `admin`, `operations`, `compliance`).
- Every permission modification MUST emit an entry into `RbacAuditLog` via `db.recordRbacAudit()`.
- Department roles dictate UI capabilities and API route permissions.

### B. Legal Terms & Digital Signature Repository
- Endpoints: `/api/legal/documents`, `/api/legal/documents/:id/sign`, `/api/legal/documents/:id/deliver`.
- Electronic signatures are legally binding under the *Electronic Transactions Act 1999 (Cth)*.
- Signature records MUST compute and preserve the SHA-256 cryptographic digest (`certificateHashSha256`) and Audit Trail ID.
- Deliverable documents can be rendered, previewed, emailed, or printed with clean `@media print` styling.

### C. Cloud AI Providers & Agentic Bridges
- Supports Google Gemini (`@google/genai`), Anthropic Claude, OpenAI, DeepSeek, Nous Hermes 3, OpenClaw, and Custom vLLM.
- All AI keys and sensitive credentials remain server-side.
- The default model can be dynamically updated per tenant without server restarts.

### D. Australian Telecommunications & Compliance
- ACMA Do Not Call Register (DNCR) real-time scrubbing checks (`/api/compliance/dncr-scrub`).
- Calling hours window: 9:00 AM – 8:00 PM AEST on weekdays, 9:00 AM – 5:00 PM AEST on Saturdays, strictly prohibited on Sundays and public holidays.
- Two-party synthetic speech recording disclosures.

---

## 3. Maintenance Rules for Agents

1. **No Fake/Mock Placeholders**: All views and controllers must make actual API calls to `/api/*` endpoints.
2. **Type Safety**: All interfaces reside in `/src/types/index.ts`. Never define loose `any` types for domain objects.
3. **Database Operations**: Add all queries and mutations to `server/db.ts` methods on `DatabaseStore`.
4. **Build Verification**: Run `compile_applet` and `lint_applet` before completing any maintenance turn.
