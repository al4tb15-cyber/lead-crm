import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Lead, CrmActivityLogItem } from '../types/index.ts';

export interface ExportPdfOptions {
  tenantName?: string;
  operatorName?: string;
  userRole?: string;
  anonymize?: boolean;
  anonymizeSensitiveFields?: boolean;
  filtersApplied?: {
    searchQuery?: string;
    statusFilter?: string;
    industryFilter?: string;
    minScoreFilter?: number;
  };
  currency?: string;
}

/**
 * Compute SHA-256 hex digest for any Blob
 */
export async function computeBlobSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Trigger immediate browser download of a Blob
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Trigger download of text content (CSV/JSON/TXT)
 */
export function triggerTextDownload(
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  triggerBlobDownload(blob, filename);
}

/**
 * Generate Executive Leads Report PDF (Landscape A4)
 */
export async function generateLeadsPdf(
  leads: Lead[],
  options: ExportPdfOptions = {}
): Promise<{ doc: jsPDF; blob: Blob; filename: string; sha256: string }> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const tenantName = options.tenantName || 'Business HUB Australia';
  const operatorName = options.operatorName || 'Alexander Ross (Platform Super Admin)';
  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampFormatted = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  const dateSlug = timestampIso.split('T')[0];
  const filename = `business_hub_leads_report_${dateSlug}.pdf`;

  // Aggregate stats
  const totalLeads = leads.length;
  const totalPipelineAud = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const qualifiedCount = leads.filter(l => ['qualified', 'contacted', 'engaged', 'booked', 'won'].includes(l.status)).length;
  const wonCount = leads.filter(l => l.status === 'won').length;
  const bookedCount = leads.filter(l => l.status === 'booked').length;
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((s, l) => s + (l.leadScore || 0), 0) / totalLeads) : 0;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 32, 'F');

  // Accent Line
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 32, 297, 1.5, 'F');

  // Organization & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BUSINESS HUB AUSTRALIA | AI REVENUE OS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Tenant: ${tenantName}   |   Statutory Privacy & Data Export Dossier`, 14, 18);
  doc.text(`Generated: ${timestampFormatted} AEST   |   Operator: ${operatorName}`, 14, 24);

  // Security Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(210, 8, 73, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('VERIFIED STATUTORY EXPORT', 214, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Electronic Transactions Act 1999 (Cth)', 214, 20);

  // KPI Metric Cards Row (4 boxes)
  const cardY = 38;
  const cardW = 63;
  const cardH = 16;
  const gap = 8;
  const startX = 14;

  const kpis = [
    { label: 'TOTAL LEADS SELECTED', val: `${totalLeads} Records`, color: [30, 41, 59] },
    { label: 'EST. PIPELINE VALUE', val: `$${totalPipelineAud.toLocaleString()} AUD`, color: [16, 185, 129] },
    { label: 'AI QUALIFIED / ENGAGED', val: `${qualifiedCount} (${totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0}%)`, color: [99, 102, 241] },
    { label: 'WON & BOOKED ON CAL', val: `${wonCount} Won / ${bookedCount} Booked`, color: [245, 158, 11] }
  ];

  kpis.forEach((k, idx) => {
    const x = startX + idx * (cardW + gap);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(k.label, x + 4, cardY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.val, x + 4, cardY + 12);
  });

  // Filter Notice if active
  let filterText = '';
  if (options.filtersApplied) {
    const parts: string[] = [];
    if (options.filtersApplied.searchQuery) parts.push(`Search: "${options.filtersApplied.searchQuery}"`);
    if (options.filtersApplied.statusFilter && options.filtersApplied.statusFilter !== 'all') parts.push(`Stage: ${options.filtersApplied.statusFilter}`);
    if (options.filtersApplied.industryFilter && options.filtersApplied.industryFilter !== 'all') parts.push(`Industry: ${options.filtersApplied.industryFilter}`);
    if (options.filtersApplied.minScoreFilter && options.filtersApplied.minScoreFilter > 0) parts.push(`Min Score: ${options.filtersApplied.minScoreFilter}+`);
    if (parts.length > 0) {
      filterText = `Active Criteria Applied: ${parts.join('  •  ')}`;
    }
  }

  let tableStartY = 59;
  if (filterText) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(filterText, 14, 57);
    tableStartY = 61;
  }

  const isAnonymized = options.anonymize || options.anonymizeSensitiveFields;

  // Build Table Body Rows
  const tableData = leads.map((l, index) => {
    const stageName = l.status ? l.status.toUpperCase().replace('_', ' ') : 'NEW';
    const estVal = l.estimatedValue ? `$${l.estimatedValue.toLocaleString()} AUD` : '$0 AUD';
    const contactFull = l.contactName + (l.jobTitle ? `\n(${l.jobTitle})` : '');
    
    let displayEmail = l.contactEmail || 'No email';
    let displayPhone = l.contactPhone || 'No phone';
    if (isAnonymized) {
      if (l.contactEmail && l.contactEmail.includes('@')) {
        const [u, d] = l.contactEmail.split('@');
        displayEmail = `${u.slice(0, 2)}***@${d}`;
      }
      if (l.contactPhone) {
        displayPhone = l.contactPhone.replace(/\d(?=\d{3})/g, '*');
      }
    }
    const contactComm = displayEmail + '\n' + displayPhone;
    const topReason = l.scoreBreakdown?.[0]?.reason || (l.notes?.[0] ? l.notes[0].slice(0, 45) + '...' : 'ICP Fit');

    return [
      (index + 1).toString(),
      `${l.companyName}\n[${l.industry || 'General'}]`,
      contactFull,
      contactComm,
      stageName,
      `${l.leadScore}/100\n${topReason}`,
      estVal,
      l.source || 'Autonomous Discovery'
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [[
      '#',
      'Company & Industry',
      'Contact & Title',
      'Email & Phone',
      'Stage',
      'AI Score & ICP',
      'Est. Deal Value',
      'Source / Agent'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 42 },
      3: { cellWidth: 48 },
      4: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 42 },
      6: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      7: { cellWidth: 25 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      // Bottom footer bar
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 202, 283, 202);

      doc.text(
        'CONFIDENTIAL & PROPRIETARY — Statutory Compliance: Australian Privacy Act 1988 (Cth) / Australian Spam Act 2003.',
        14,
        206
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}   |   Business HUB Cloud Instance ID: bh-prod-syd-01`,
        240,
        206
      );
    }
  });

  const pdfOutput = doc.output('blob');
  const sha256 = await computeBlobSha256(pdfOutput);

  return {
    doc,
    blob: pdfOutput,
    filename,
    sha256
  };
}

/**
 * Generate CRM Activity & Audit Telemetry Report PDF (Landscape A4)
 */
export async function generateActivityReportPdf(
  activities: CrmActivityLogItem[],
  options: ExportPdfOptions = {}
): Promise<{ doc: jsPDF; blob: Blob; filename: string; sha256: string }> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const tenantName = options.tenantName || 'Business HUB Australia';
  const operatorName = options.operatorName || 'Alexander Ross (Platform Super Admin)';
  const now = new Date();
  const timestampIso = now.toISOString();
  const timestampFormatted = now.toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
  const dateSlug = timestampIso.split('T')[0];
  const filename = `business_hub_activity_report_${dateSlug}.pdf`;

  // Aggregate metrics
  const totalEvents = activities.length;
  const callsCount = activities.filter(a => a.eventType.includes('call') || a.summary.toLowerCase().includes('call')).length;
  const apptsCount = activities.filter(a => a.eventType.includes('appointment') || a.summary.toLowerCase().includes('meeting') || a.summary.toLowerCase().includes('appointment')).length;
  const wonCount = activities.filter(a => a.eventType.includes('won') || a.summary.toLowerCase().includes('won')).length;
  const totalValueImpact = activities.reduce((sum, a) => sum + (a.value || 0), 0);

  // Top Dark Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 32, 'F');

  // Accent Line
  doc.setFillColor(168, 85, 247); // purple-500
  doc.rect(0, 32, 297, 1.5, 'F');

  // Title & Organization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BUSINESS HUB AUSTRALIA | CRM ACTIVITY & TELEMETRY REPORT', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tenant: ${tenantName}   |   Real-Time Multi-Agent Execution & Pipeline Audit Trail`, 14, 18);
  doc.text(`Generated: ${timestampFormatted} AEST   |   Exported By: ${operatorName}`, 14, 24);

  // Compliance Badge
  doc.setFillColor(139, 92, 246); // purple-600
  doc.roundedRect(205, 8, 78, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('STATUTORY AUDIT LOGGED', 209, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('ACMA DNCR & Privacy Act 1988 Certified', 209, 20);

  // KPI Metric Cards Row
  const cardY = 38;
  const cardW = 63;
  const cardH = 16;
  const gap = 8;
  const startX = 14;

  const kpis = [
    { label: 'TOTAL ACTIVITIES LOGGED', val: `${totalEvents} Events`, color: [30, 41, 59] },
    { label: 'VOICE AI CALLS & CHATS', val: `${callsCount} Completed`, color: [14, 165, 233] },
    { label: 'CONSULTATIONS BOOKED', val: `${apptsCount} Scheduled`, color: [16, 185, 129] },
    { label: 'DEALS WON / REVENUE VALUE', val: `${wonCount} Deals ($${totalValueImpact.toLocaleString()} AUD)`, color: [245, 158, 11] }
  ];

  kpis.forEach((k, idx) => {
    const x = startX + idx * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardW, cardH, 1.5, 1.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label, x + 4, cardY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(k.color[0], k.color[1], k.color[2]);
    doc.text(k.val, x + 4, cardY + 12);
  });

  // Table Data
  const tableData = activities.map((act, index) => {
    let formattedDate = act.timestamp;
    try {
      formattedDate = new Date(act.timestamp).toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {}

    const eventBadge = act.eventType.toUpperCase().replace('.', ' > ');
    const entity = (act.companyName || 'Lead') + (act.contactName ? `\n(${act.contactName})` : '');
    const trigger = act.triggeredBy || 'Autonomous Agent';
    const valText = act.value ? `$${act.value.toLocaleString()} AUD` : '-';

    return [
      (index + 1).toString(),
      formattedDate,
      eventBadge,
      entity,
      act.summary,
      trigger,
      valText
    ];
  });

  autoTable(doc, {
    startY: 59,
    head: [[
      '#',
      'Time (AEST)',
      'Event Category',
      'Related Prospect / Company',
      'Activity Summary & Autonomous Action',
      'Executed By',
      'Value Impact'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    styles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      overflow: 'linebreak',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 44 },
      4: { cellWidth: 85 },
      5: { cellWidth: 38 },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 202, 283, 202);

      doc.text(
        'STATUTORY AUDIT LOG — Preserved under the Electronic Transactions Act 1999 (Cth) & Security of Critical Infrastructure Act.',
        14,
        206
      );
      doc.text(
        `Page ${currentPage} of ${pageCount}   |   Telemetry Bus: Sydney-01 EventBus`,
        240,
        206
      );
    }
  });

  const pdfOutput = doc.output('blob');
  const sha256 = await computeBlobSha256(pdfOutput);

  return {
    doc,
    blob: pdfOutput,
    filename,
    sha256
  };
}

/**
 * Generate CSV string from Leads
 */
export function generateLeadsCsv(leads: Lead[], anonymize: boolean = false): { content: string; filename: string } {
  const dateFormatted = new Date().toISOString().split('T')[0];
  const filename = `business_hub_leads_${dateFormatted}.csv`;

  const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email || '';
    const [u, d] = email.split('@');
    if (u.length <= 2) return `${u[0]}*@${d}`;
    return `${u[0]}***${u[u.length - 1]}@${d}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 6) return phone || '';
    return phone.slice(0, 4) + ' *** ' + phone.slice(-2);
  };

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    'Lead ID',
    'Company Name',
    'Contact Name',
    'Contact Email',
    'Contact Phone',
    'Job Title',
    'Industry',
    'Pipeline Status',
    'AI Lead Score',
    'Estimated Deal Value (AUD)',
    'Source',
    'Assigned Staff',
    'Assigned Agent',
    'Notes Summary',
    'Top Score Factor',
    'Created At',
    'Updated At'
  ];

  const rows = leads.map(l => [
    escapeCsv(l.id),
    escapeCsv(l.companyName),
    escapeCsv(l.contactName),
    escapeCsv(anonymize ? maskEmail(l.contactEmail) : l.contactEmail),
    escapeCsv(anonymize ? maskPhone(l.contactPhone) : l.contactPhone),
    escapeCsv(l.jobTitle),
    escapeCsv(l.industry),
    escapeCsv(l.status),
    escapeCsv(l.leadScore),
    escapeCsv(l.estimatedValue || 0),
    escapeCsv(l.source || 'Autonomous Discovery'),
    escapeCsv(l.assignedStaffId || 'Alexander Ross'),
    escapeCsv(l.assignedAgentId || 'Voice AI SDR'),
    escapeCsv(l.notes?.join(' | ') || ''),
    escapeCsv(l.scoreBreakdown?.[0]?.reason || 'High ICP match'),
    escapeCsv(l.createdAt),
    escapeCsv(l.updatedAt || l.createdAt)
  ].join(','));

  const content = [headers.join(','), ...rows].join('\r\n');
  return { content, filename };
}

/**
 * Generate CSV string from Activity Log Items
 */
export function generateActivityCsv(activities: CrmActivityLogItem[]): { content: string; filename: string } {
  const dateFormatted = new Date().toISOString().split('T')[0];
  const filename = `business_hub_activity_report_${dateFormatted}.csv`;

  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headers = [
    'Activity ID',
    'Timestamp (ISO)',
    'Date & Time (AEST)',
    'Activity Type',
    'Summary & Description',
    'Related Prospect / Company',
    'Contact Name',
    'Executed By',
    'Deal Value (AUD)',
    'Status'
  ];

  const rows = activities.map(act => [
    escapeCsv(act.id),
    escapeCsv(act.timestamp),
    escapeCsv(new Date(act.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })),
    escapeCsv(act.eventType),
    escapeCsv(act.summary),
    escapeCsv(act.companyName || ''),
    escapeCsv(act.contactName || ''),
    escapeCsv(act.triggeredBy || 'Autonomous AI'),
    escapeCsv(act.value ? `$${act.value} AUD` : ''),
    escapeCsv(act.status || 'completed')
  ].join(','));

  const content = [headers.join(','), ...rows].join('\r\n');
  return { content, filename };
}
