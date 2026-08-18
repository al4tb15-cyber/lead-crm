import { SupportedCurrency, TaxJurisdiction } from '../types/index.ts';

export interface CurrencyMetadata {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  exchangeRateToAud: number; // 1 Base Currency = X AUD
  defaultJurisdiction: TaxJurisdiction;
}

export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyMetadata> = {
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    flag: '🇦🇺',
    exchangeRateToAud: 1.0,
    defaultJurisdiction: 'AU_GST'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    exchangeRateToAud: 1.54,
    defaultJurisdiction: 'US_SALES_TAX'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    exchangeRateToAud: 1.66,
    defaultJurisdiction: 'EU_VAT'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    exchangeRateToAud: 1.95,
    defaultJurisdiction: 'UK_VAT'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    flag: '🇸🇬',
    exchangeRateToAud: 1.15,
    defaultJurisdiction: 'SG_GST'
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    flag: '🇨🇦',
    exchangeRateToAud: 1.13,
    defaultJurisdiction: 'ZERO_RATED_EXPORT'
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    flag: '🇳🇿',
    exchangeRateToAud: 0.93,
    defaultJurisdiction: 'NZ_GST'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    flag: '🇯🇵',
    exchangeRateToAud: 0.0102,
    defaultJurisdiction: 'ZERO_RATED_EXPORT'
  }
};

export interface TaxJurisdictionMetadata {
  code: TaxJurisdiction;
  name: string;
  standardRate: number;
  label: string;
  taxIdName: string;
  defaultTaxId: string;
  governingLawRegion: string;
  legalDisclaimer: string;
}

export const TAX_JURISDICTIONS: Record<TaxJurisdiction, TaxJurisdictionMetadata> = {
  AU_GST: {
    code: 'AU_GST',
    name: 'Australia (GST 10%)',
    standardRate: 0.10,
    label: 'GST (10%)',
    taxIdName: 'ABN / ACN',
    defaultTaxId: 'ABN 48 612 890 341',
    governingLawRegion: 'New South Wales, Australia',
    legalDisclaimer: 'Tax Invoice compliant with A New Tax System (Goods and Services Tax) Act 1999 (Cth). All prices include 10% Australian GST unless stated as input taxed.'
  },
  US_SALES_TAX: {
    code: 'US_SALES_TAX',
    name: 'United States (State Sales Tax / Exemption)',
    standardRate: 0.0825,
    label: 'US Sales Tax (8.25%)',
    taxIdName: 'Federal EIN',
    defaultTaxId: 'EIN 92-8491023',
    governingLawRegion: 'State of Delaware, United States',
    legalDisclaimer: 'B2B SaaS software and cloud inference services billed in accordance with US Nexus rules. B2B resale exemption certificates accepted.'
  },
  EU_VAT: {
    code: 'EU_VAT',
    name: 'European Union (Standard VAT 20% / Reverse Charge)',
    standardRate: 0.20,
    label: 'EU VAT (20%)',
    taxIdName: 'EU VAT ID',
    defaultTaxId: 'EU372008912',
    governingLawRegion: 'Republic of Ireland / EU Jurisdiction',
    legalDisclaimer: 'Article 196 EU VAT Directive compliant. For VAT-registered businesses in the EU outside our establishment, Reverse Charge mechanism applies.'
  },
  UK_VAT: {
    code: 'UK_VAT',
    name: 'United Kingdom (VAT 20%)',
    standardRate: 0.20,
    label: 'UK VAT (20%)',
    taxIdName: 'UK VAT Reg',
    defaultTaxId: 'GB 921 4451 09',
    governingLawRegion: 'England and Wales, United Kingdom',
    legalDisclaimer: 'VAT Invoice issued under UK Value Added Tax Act 1994. Standard rate of 20% applied.'
  },
  SG_GST: {
    code: 'SG_GST',
    name: 'Singapore (GST 9%)',
    standardRate: 0.09,
    label: 'Singapore GST (9%)',
    taxIdName: 'Singapore UEN',
    defaultTaxId: 'UEN 202419820K',
    governingLawRegion: 'Republic of Singapore',
    legalDisclaimer: 'Registered under the Singapore Goods and Services Tax Act 1993. Reverse Charge applies for imported digital B2B services.'
  },
  NZ_GST: {
    code: 'NZ_GST',
    name: 'New Zealand (GST 15%)',
    standardRate: 0.15,
    label: 'NZ GST (15%)',
    taxIdName: 'NZ GST Number',
    defaultTaxId: 'NZ 139-441-890',
    governingLawRegion: 'New Zealand',
    legalDisclaimer: 'Issued pursuant to New Zealand Goods and Services Tax Act 1985 (Remote digital services tax rules).'
  },
  ZERO_RATED_EXPORT: {
    code: 'ZERO_RATED_EXPORT',
    name: 'Global Cross-Border Export (0% Zero-Rated B2B)',
    standardRate: 0.00,
    label: 'Zero-Rated B2B Export (0%)',
    taxIdName: 'International Tax ID',
    defaultTaxId: 'INTL-EXP-0089',
    governingLawRegion: 'International Commercial Arbitration / Delaware',
    legalDisclaimer: 'Cross-border B2B digital export exempt from destination sales tax under international trade treaties and reciprocal cross-border rules.'
  }
};

export const GLOBAL_LEGAL_TERMS = {
  saasMasterServices: `1. MASTER SERVICES & AUTONOMOUS AI SLA: Business HUB operates high-concurrency autonomous revenue agents, voice synthesizers, and lead ingestion pipelines. Service availability is governed by our 99.9% uptime SLA.
2. JURISDICTION & GOVERNING LAW: Any commercial contract, tax invoice, or engagement is governed by the selected jurisdiction and prevailing international commercial arbitration standards.
3. DATA RESIDENCY & PRIVACY: Data processed is strictly segregated per tenant and complies with Australian Privacy Act 1988, GDPR (EU/UK), and US CCPA regulations.
4. TAXATION & PAYMENT TERMS: Payments are due within the invoice due date in the nominated currency. Invoices not settled within terms may incur statutory commercial interest.`,
  
  crossBorderExportDisclaimer: `Cross-border software-as-a-service transactions are processed in accordance with international tax treaty guidelines. The purchaser represents that services are received for valid enterprise commercial operations.`
};

export function formatCurrency(amount: number, currency: SupportedCurrency = 'AUD'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.AUD;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: currency === 'JPY' ? 0 : 2,
      maximumFractionDigits: currency === 'JPY' ? 0 : 2
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString()}`;
  }
}

export function convertFromAud(amountInAud: number, targetCurrency: SupportedCurrency): number {
  if (targetCurrency === 'AUD') return amountInAud;
  const rate = CURRENCY_CONFIG[targetCurrency]?.exchangeRateToAud || 1;
  return amountInAud / rate;
}

export function calculateTaxAndTotal(
  subtotal: number,
  jurisdiction: TaxJurisdiction = 'AU_GST',
  isCrossBorderExempt: boolean = false
): {
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  taxLabel: string;
} {
  if (isCrossBorderExempt || jurisdiction === 'ZERO_RATED_EXPORT') {
    return {
      subtotal,
      taxRate: 0,
      tax: 0,
      total: subtotal,
      taxLabel: 'Zero-Rated B2B Export (0%)'
    };
  }

  const meta = TAX_JURISDICTIONS[jurisdiction] || TAX_JURISDICTIONS.AU_GST;
  const tax = Math.round(subtotal * meta.standardRate * 100) / 100;
  const total = subtotal + tax;

  return {
    subtotal,
    taxRate: meta.standardRate,
    tax,
    total,
    taxLabel: meta.label
  };
}
