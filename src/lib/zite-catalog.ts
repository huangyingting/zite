export interface ZiteFieldTypeSpec {
  type: string;
  label: string;
  category: "Basic" | "Numeric" | "Select & Date" | "Relational & Computed" | "AI";
  valueShape: string;
  defaultSettings: string;
}

export const ZITE_FIELD_TYPES: ZiteFieldTypeSpec[] = [
  { type: "single_line_text", label: "Text", category: "Basic", valueShape: "string", defaultSettings: "Primary-capable text column" },
  { type: "long_text", label: "Long Text", category: "Basic", valueShape: "string (multi-line)", defaultSettings: "Multi-line notes & descriptions" },
  { type: "email", label: "Email", category: "Basic", valueShape: "string (validated)", defaultSettings: "RFC email format check" },
  { type: "url", label: "URL", category: "Basic", valueShape: "string (validated)", defaultSettings: "Clickable URL field" },
  { type: "phone_number", label: "Phone", category: "Basic", valueShape: "string", defaultSettings: "International / local phone formatting" },
  { type: "number", label: "Number", category: "Numeric", valueShape: "number | null", defaultSettings: "decimalPlaces: 1, numberFormat: local" },
  { type: "currency", label: "Currency", category: "Numeric", valueShape: "number | null", defaultSettings: "currencySymbol: $, decimalPlaces: 2" },
  { type: "percent", label: "Percent", category: "Numeric", valueShape: "number | null", defaultSettings: "decimalPlaces: 0, showProgressBar: true" },
  { type: "rating", label: "Rating", category: "Numeric", valueShape: "number (0-5)", defaultSettings: "maxRating: 5" },
  { type: "duration", label: "Duration", category: "Numeric", valueShape: "number (seconds)", defaultSettings: "format: h:mm" },
  { type: "single_select", label: "Single Select", category: "Select & Date", valueShape: "string | null", defaultSettings: "options[] with colored pills" },
  { type: "multiple_select", label: "Multiple Select", category: "Select & Date", valueShape: "string[]", defaultSettings: "options[] multi-tag selector" },
  { type: "checkbox", label: "Checkbox", category: "Select & Date", valueShape: "boolean", defaultSettings: "color: #2563EB" },
  { type: "date", label: "Date", category: "Select & Date", valueShape: "string (ISO date)", defaultSettings: "dateFormat: local" },
  { type: "datetime", label: "DateTime", category: "Select & Date", valueShape: "string (ISO datetime)", defaultSettings: "timeFormat: 12h, timezone: browser" },
  { type: "attachments", label: "Attachments", category: "Basic", valueShape: "Array<{ url, filename }>", defaultSettings: "Cloud file upload & preview" },
  { type: "linked_record", label: "Linked Record", category: "Relational & Computed", valueShape: "string[] (record IDs)", defaultSettings: "tableId (bidirectional relation)" },
  { type: "lookup", label: "Lookup", category: "Relational & Computed", valueShape: "any | any[]", defaultSettings: "linkedRecordFieldId + lookupFieldId" },
  { type: "formula", label: "Formula", category: "Relational & Computed", valueShape: "computed", defaultSettings: "expression: e.g. {amount} * {probability}" },
  { type: "autonumber", label: "Autonumber", category: "Relational & Computed", valueShape: "number (read-only)", defaultSettings: "Auto-incrementing row number" },
  { type: "source", label: "Source", category: "Relational & Computed", valueShape: "JSONB union", defaultSettings: "manual | workflow | form_submission | public_api" },
  { type: "ai_field", label: "AI Field", category: "AI", valueShape: "string (AI synthesized)", defaultSettings: "Prompt referencing {Column} values + web search option" },
];

export interface ZiteTemplateSpec {
  slug: string;
  name: string;
  category:
    | "Popular"
    | "Portals"
    | "Operations"
    | "Sales"
    | "Marketing"
    | "HR"
    | "IT"
    | "Product"
    | "Education"
    | "Finance"
    | "Events"
    | "Real Estate";
  tagline: string;
  description: string;
  tables: string[];
  workflows: string[];
  accentColor: string;
  liveDemoSlug: string;
}

export const ZITE_TEMPLATES: ZiteTemplateSpec[] = [
  {
    slug: "customer-relationship-management",
    name: "Customer Relationship Management (CRM)",
    category: "Sales",
    tagline: "Full-pipeline sales OS with Leads, Deals Kanban, Companies, Outreach Sequences, and Revenue Forecasting.",
    description:
      "Track every lead, deal, company, contact, task, and multi-step outreach sequence over one unified Zite Database. Includes weighted pipeline formulas, AI deal briefs, and executive Q4 forecast reports.",
    tables: ["Leads", "Deals", "Companies", "Contacts", "Tasks", "OutreachSequences"],
    workflows: ["createLeadFollowup.ts", "generateDealQuotePdf.ts", "syncHubSpotPipeline.ts"],
    accentColor: "#2563EB",
    liveDemoSlug: "ashgrove-crm",
  },
  {
    slug: "applicant-tracking-system",
    name: "Applicant Tracking System (ATS)",
    category: "HR",
    tagline: "Manage job requisitions, candidate pipelines, interview scorecards, and AI resume screening.",
    description:
      "Centralize recruiting across hiring managers and recruiters with candidate stage boards, automated interview scheduling workflows, and AI Field candidate fit summaries.",
    tables: ["Applicants", "JobPositions", "Interviews", "OfferLetters"],
    workflows: ["scoreCandidateResume.ts", "sendInterviewInvite.ts", "generateOfferLetterPdf.ts"],
    accentColor: "#059669",
    liveDemoSlug: "talentflow-ats",
  },
  {
    slug: "customer-portal",
    name: "Customer Booking & Invoice Portal",
    category: "Portals",
    tagline: "External client portal with row-level permissions, project milestones, bookings, and PDF invoice downloads.",
    description:
      "Give every customer a branded self-service portal backed by your Zite Database. Row-level access rules ensure clients only see their own bookings, deliverables, and Stripe-synced invoices.",
    tables: ["Bookings", "Invoices", "ClientAccounts", "SupportRequests"],
    workflows: ["renderInvoicePdf.ts", "handleStripeWebhook.ts", "notifySlackChannel.ts"],
    accentColor: "#7C3AED",
    liveDemoSlug: "clienthub-portal",
  },
  {
    slug: "inventory-order-management",
    name: "Inventory & Purchase Order Tracker",
    category: "Operations",
    tagline: "Multi-warehouse stock levels, reorder alerts, supplier POs, and barcode SKU tracking.",
    description:
      "Prevent stockouts with automated low-stock Slack alerts, supplier purchase order PDF generation, and real-time margin formulas.",
    tables: ["Products", "Warehouses", "PurchaseOrders", "Suppliers"],
    workflows: ["checkLowInventoryCron.ts", "generatePurchaseOrderPdf.ts"],
    accentColor: "#D97706",
    liveDemoSlug: "ashgrove-crm",
  },
  {
    slug: "it-helpdesk-asset-tracker",
    name: "IT Helpdesk & Device Asset Manager",
    category: "IT",
    tagline: "Internal ticketing, SLA timers, laptop provisioning, and software license governance.",
    description:
      "Route employee IT requests automatically, track hardware serial numbers, and enforce SLA escalations via scheduled Zite workflows.",
    tables: ["Tickets", "HardwareAssets", "Employees", "SoftwareLicenses"],
    workflows: ["triageTicketWithAi.ts", "escalateBreachedSla.ts"],
    accentColor: "#0284C7",
    liveDemoSlug: "talentflow-ats",
  },
  {
    slug: "finance-expense-approvals",
    name: "Expense Approvals & Vendor Spend OS",
    category: "Finance",
    tagline: "Receipt OCR extraction, multi-tier budget approval workflows, and monthly burn analytics.",
    description:
      "Streamline employee reimbursement and vendor invoice approvals with role-based sign-off rules and automated accounting exports.",
    tables: ["ExpenseClaims", "DepartmentBudgets", "Vendors", "Payouts"],
    workflows: ["approveExpenseClaim.ts", "exportMonthlyLedgerCsv.ts"],
    accentColor: "#059669",
    liveDemoSlug: "clienthub-portal",
  },
  {
    slug: "marketing-campaign-hub",
    name: "Marketing Campaign & Content Calendar",
    category: "Marketing",
    tagline: "Cross-channel campaign planning, creative asset approvals, and UTM attribution rollups.",
    description:
      "Coordinate product launches, social copy generation with AI Fields, and ROI attribution tied directly to CRM pipeline.",
    tables: ["Campaigns", "ContentAssets", "Channels", "AttributionTouchpoints"],
    workflows: ["generateCampaignCopy.ts", "syncAnalyticsMetrics.ts"],
    accentColor: "#DB2777",
    liveDemoSlug: "ashgrove-crm",
  },
  {
    slug: "product-roadmap-feedback",
    name: "Product Roadmap & Customer Feedback Portal",
    category: "Product",
    tagline: "Public feature voting portal linked to internal engineering sprints and ARR impact.",
    description:
      "Weight feature requests automatically by customer ARR in your Zite Database and notify voters when features ship.",
    tables: ["FeatureRequests", "RoadmapItems", "CustomerVotes", "ReleaseNotes"],
    workflows: ["calculateArrImpact.ts", "notifyVotersOnShip.ts"],
    accentColor: "#4F46E5",
    liveDemoSlug: "clienthub-portal",
  },
  {
    slug: "real-estate-property-portal",
    name: "Commercial Real Estate & Lease Manager",
    category: "Real Estate",
    tagline: "Property listings, tenant lease renewals, maintenance work orders, and rent roll reports.",
    description:
      "Manage multi-property portfolios, tenant communications, and automated 60-day lease renewal sequences.",
    tables: ["Properties", "Units", "Leases", "MaintenanceOrders"],
    workflows: ["sendLeaseRenewalNotice.ts", "generateRentRollPdf.ts"],
    accentColor: "#0D9488",
    liveDemoSlug: "ashgrove-crm",
  },
];

export interface ZiteIntegrationSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  authType: "OAuth 2.0" | "API Key / Secret" | "Native SDK";
  sdkImport: string;
}

export const ZITE_INTEGRATIONS: ZiteIntegrationSpec[] = [
  { id: "airtable", name: "Airtable", category: "Databases", description: "Two-way sync or one-click base migration into Zite Database.", authType: "OAuth 2.0", sdkImport: "import { airtable } from 'zitejs/integrations';" },
  { id: "salesforce", name: "Salesforce", category: "CRM", description: "Sync enterprise accounts, opportunities, and custom SOQL objects.", authType: "OAuth 2.0", sdkImport: "import { salesforce } from 'zitejs/integrations';" },
  { id: "google-sheets", name: "Google Sheets", category: "Spreadsheets", description: "Import spreadsheets into full-stack apps or sync live rows.", authType: "OAuth 2.0", sdkImport: "import { googleSheets } from 'zitejs/integrations';" },
  { id: "slack", name: "Slack", category: "Communication", description: "Send rich Block Kit alerts and approval buttons from workflows.", authType: "OAuth 2.0", sdkImport: "import { slack } from 'zitejs/integrations';" },
  { id: "hubspot", name: "HubSpot", category: "CRM", description: "Sync contacts, deals, and marketing lifecycle events.", authType: "OAuth 2.0", sdkImport: "import { hubspot } from 'zitejs/integrations';" },
  { id: "stripe", name: "Stripe", category: "Payments & Billing", description: "Process payments, subscriptions, and inbound billing webhooks.", authType: "API Key / Secret", sdkImport: "import Stripe from 'stripe'; // uses process.env.STRIPE_SECRET_KEY" },
  { id: "google-calendar", name: "Google Calendar", category: "Scheduling", description: "Book meetings and sync availability directly inside Zite apps.", authType: "OAuth 2.0", sdkImport: "import { googleCalendar } from 'zitejs/integrations';" },
  { id: "notion", name: "Notion", category: "Docs & Wiki", description: "Sync Notion databases and knowledge pages with Zite workspaces.", authType: "OAuth 2.0", sdkImport: "import { notion } from 'zitejs/integrations';" },
  { id: "linear", name: "Linear", category: "Engineering", description: "Create and sync engineering issues, cycles, and triage queues.", authType: "OAuth 2.0", sdkImport: "import { linear } from 'zitejs/integrations';" },
  { id: "github", name: "GitHub", category: "Engineering", description: "Connect repositories, pull requests, and issue webhooks.", authType: "OAuth 2.0", sdkImport: "import { github } from 'zitejs/integrations';" },
  { id: "openai", name: "OpenAI", category: "AI Models", description: "Call GPT-4o, embeddings, and structured outputs inside workflows.", authType: "API Key / Secret", sdkImport: "import OpenAI from 'openai';" },
  { id: "anthropic", name: "Anthropic Claude", category: "AI Models", description: "Run Claude Opus/Sonnet reasoning steps in backend endpoints.", authType: "API Key / Secret", sdkImport: "import Anthropic from '@anthropic-ai/sdk';" },
  { id: "resend", name: "Resend", category: "Email", description: "Send transactional emails and PDF invoice attachments.", authType: "API Key / Secret", sdkImport: "import { Resend } from 'resend';" },
  { id: "postgresql", name: "External PostgreSQL", category: "Databases", description: "Query external data warehouses alongside your workspace database.", authType: "API Key / Secret", sdkImport: "import pg from 'pg';" },
];

export function evaluateFormulaOnRow(
  expression: string,
  row: Record<string, unknown>
): string | number {
  if (!expression) return "";
  try {
    // Support e.g. "{amount} * {probability} / 100" or "SUM({price}, {tax})"
    const sumMatch = expression.match(/^SUM\((.+)\)$/i);
    if (sumMatch) {
      const args = sumMatch[1].split(",").map((s) => s.trim());
      let total = 0;
      for (const arg of args) {
        const key = arg.replace(/[{}]/g, "").trim();
        total += Number(row[key] ?? 0) || 0;
      }
      return Math.round(total * 100) / 100;
    }

    const replaced = expression.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
      const val = Number(row[key] ?? 0);
      return Number.isFinite(val) ? String(val) : "0";
    });

    if (/^[0-9+\-*/().\s]+$/.test(replaced)) {
      const computed = Function(`"use strict"; return (${replaced});`)();
      if (typeof computed === "number" && Number.isFinite(computed)) {
        return Math.round(computed * 100) / 100;
      }
    }
    return replaced;
  } catch {
    return 0;
  }
}
