import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/account-admission/password";
import { hashInvitationToken } from "../src/lib/account-admission/token";

export const SEED_PENDING_INVITE_TOKEN = "zite_inv_demo_pending_token_2026";
export const SEED_EXPIRED_INVITE_TOKEN = "zite_inv_demo_expired_token_2026";

async function main() {
  console.log("Seeding Zite AI Platform database...");
  const passwordHash = await hashPassword("Password123!");
  const now = new Date();

  // 1. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@zite.com" },
    create: {
      email: "admin@zite.com",
      name: "Dominic Olsen",
      role: "ADMIN",
      status: "ACTIVE",
      aiCreditLimit: 1000,
      aiCreditsUsed: 60,
      createdByAdminBootstrap: true,
      lastLoginAt: now,
      passwordCredential: {
        create: { passwordHash, passwordUpdatedAt: now },
      },
    },
    update: {
      name: "Dominic Olsen",
      role: "ADMIN",
      status: "ACTIVE",
      createdByAdminBootstrap: true,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: "editor@zite.com" },
    create: {
      email: "editor@zite.com",
      name: "Marcus Bell",
      role: "EDITOR",
      status: "ACTIVE",
      aiCreditLimit: 400,
      aiCreditsUsed: 38,
      invitedById: adminUser.id,
      lastLoginAt: now,
      passwordCredential: {
        create: { passwordHash, passwordUpdatedAt: now },
      },
    },
    update: {
      name: "Marcus Bell",
      role: "EDITOR",
      status: "ACTIVE",
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: "viewer@zite.com" },
    create: {
      email: "viewer@zite.com",
      name: "Hannah Lindqvist",
      role: "VIEWER",
      status: "ACTIVE",
      aiCreditLimit: 100,
      aiCreditsUsed: 12,
      invitedById: adminUser.id,
      lastLoginAt: now,
      passwordCredential: {
        create: { passwordHash, passwordUpdatedAt: now },
      },
    },
    update: {
      name: "Hannah Lindqvist",
      role: "VIEWER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "revoked@zite.com" },
    create: {
      email: "revoked@zite.com",
      name: "Alex Vane (Revoked)",
      role: "VIEWER",
      status: "REVOKED",
      sessionVersion: 3,
      revokedAt: now,
      invitedById: adminUser.id,
      passwordCredential: {
        create: { passwordHash, passwordUpdatedAt: now },
      },
    },
    update: {
      status: "REVOKED",
      revokedAt: now,
    },
  });

  // 2. Seed Invitations
  const pendingHash = hashInvitationToken(SEED_PENDING_INVITE_TOKEN);
  await prisma.accountInvitation.upsert({
    where: { tokenHash: pendingHash },
    create: {
      email: "aisha.karim@ashgrovesoftware.com",
      role: "EDITOR",
      tokenHash: pendingHash,
      tokenPreview: SEED_PENDING_INVITE_TOKEN.slice(0, 14) + "…",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      invitedByUserId: adminUser.id,
    },
    update: {
      status: "PENDING",
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
    },
  });

  const expiredHash = hashInvitationToken(SEED_EXPIRED_INVITE_TOKEN);
  await prisma.accountInvitation.upsert({
    where: { tokenHash: expiredHash },
    create: {
      email: "expired.guest@ashgrovesoftware.com",
      role: "VIEWER",
      tokenHash: expiredHash,
      tokenPreview: SEED_EXPIRED_INVITE_TOKEN.slice(0, 14) + "…",
      status: "EXPIRED",
      expiresAt: new Date(Date.now() - 24 * 3600 * 1000),
      invitedByUserId: adminUser.id,
    },
    update: {
      status: "EXPIRED",
    },
  });

  // 3. Seed User Groups
  await prisma.userGroup.deleteMany();
  await prisma.userGroup.createMany({
    data: [
      {
        name: "Revenue & Sales Leadership",
        description: "Full read/write access to Ashgrove CRM Deals, Companies, and Forecast Reports",
        membersJson: JSON.stringify(["admin@zite.com", "editor@zite.com"]),
        permissionsJson: JSON.stringify({ tables: ["Deals", "Leads", "Companies"], access: "read_write" }),
      },
      {
        name: "Account Executives",
        description: "Can manage assigned Leads, Tasks, and Outreach Sequences",
        membersJson: JSON.stringify(["editor@zite.com", "viewer@zite.com"]),
        permissionsJson: JSON.stringify({ tables: ["Leads", "Tasks", "OutreachSequences"], access: "read_only_unassigned" }),
      },
      {
        name: "External Portal Clients",
        description: "Row-level scoped access to Customer Booking & Invoice Portal",
        membersJson: JSON.stringify(["viewer@zite.com"]),
        permissionsJson: JSON.stringify({ rowFilter: "record.clientEmail === context.user.email", access: "portal" }),
      },
    ],
  });

  // 4. Seed Workspaces
  await prisma.workspace.deleteMany();

  const crmWorkspace = await prisma.workspace.create({
    data: {
      publicId: "ws_ashgrove_crm",
      name: "Ashgrove Software — Revenue OS",
      description: "Unified CRM database, outbound sequences, deal forecasting, and automated quote workflows.",
      icon: "Briefcase",
      color: "#2563EB",
      ownerId: adminUser.id,
    },
  });

  const atsWorkspace = await prisma.workspace.create({
    data: {
      publicId: "ws_talent_ats",
      name: "TalentFlow — Recruiting & ATS",
      description: "Applicant tracking system with AI candidate screening, interview scorecards, and offer workflows.",
      icon: "Users",
      color: "#059669",
      ownerId: adminUser.id,
    },
  });

  const portalWorkspace = await prisma.workspace.create({
    data: {
      publicId: "ws_client_portal",
      name: "ClientHub — Customer & Billing Portal",
      description: "External client portal with row-level permissions, project bookings, and PDF invoice generation.",
      icon: "Globe",
      color: "#7C3AED",
      ownerId: editorUser.id,
    },
  });

  // 5. Seed Brand Kits
  await prisma.brandKit.createMany({
    data: [
      {
        workspaceId: crmWorkspace.id,
        name: "Ashgrove Editorial Brand Kit",
        logoText: "AS",
        primaryColor: "#2563EB",
        accentColor: "#059669",
        backgroundColor: "#FAF9F5",
        surfaceColor: "#FFFFFF",
        textColor: "#141413",
        headingFont: "Georgia",
        bodyFont: "Inter",
        borderRadius: "8px",
        toneOfVoice: "Crisp, operational, and executive-ready",
        sourceWebsiteUrl: "https://ashgrovesoftware.com",
        isDefault: true,
      },
      {
        workspaceId: atsWorkspace.id,
        name: "TalentFlow Modern Emerald",
        logoText: "TF",
        primaryColor: "#059669",
        accentColor: "#2563EB",
        backgroundColor: "#F8FAFC",
        surfaceColor: "#FFFFFF",
        textColor: "#0F172A",
        headingFont: "Inter",
        bodyFont: "Inter",
        borderRadius: "10px",
        toneOfVoice: "Warm, people-centric, and structured",
        sourceWebsiteUrl: "https://zite.com",
        isDefault: true,
      },
    ],
  });

  // 6. Seed Database Tables & Records for Ashgrove CRM Workspace
  const dealsTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "Deals",
      sdkName: "deals",
      icon: "DollarSign",
      description: "Everything in flight across New business and Renewals & expansion pipelines.",
      orderIndex: 0,
      fieldsJson: JSON.stringify([
        { id: "fld_deal_name", name: "Deal Name", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_deal_company", name: "Company", sdkName: "company", type: "single_line_text" },
        {
          id: "fld_deal_stage",
          name: "Stage",
          sdkName: "stage",
          type: "single_select",
          options: [
            { label: "Qualification", color: "blue" },
            { label: "Discovery", color: "indigo" },
            { label: "Demo", color: "violet" },
            { label: "Proposal", color: "amber" },
            { label: "Negotiation", color: "emerald" },
            { label: "Closed Won", color: "green" },
          ],
        },
        { id: "fld_deal_pipeline", name: "Pipeline", sdkName: "pipeline", type: "single_select", options: [{ label: "New business", color: "blue" }, { label: "Renewals & expansion", color: "teal" }] },
        { id: "fld_deal_amount", name: "Amount", sdkName: "amount", type: "currency" },
        { id: "fld_deal_prob", name: "Probability (%)", sdkName: "probability", type: "percent" },
        {
          id: "fld_deal_weighted",
          name: "Weighted Value",
          sdkName: "weightedValue",
          type: "formula",
          expression: "{amount} * {probability} / 100",
        },
        { id: "fld_deal_owner", name: "Owner", sdkName: "owner", type: "email" },
        { id: "fld_deal_close", name: "Close Date", sdkName: "closeDate", type: "date" },
        { id: "fld_deal_next", name: "Next Step", sdkName: "nextStep", type: "single_line_text" },
        {
          id: "fld_deal_ai_brief",
          name: "AI Deal Brief",
          sdkName: "aiDealBrief",
          type: "ai_field",
          promptTemplate: "Summarize executive deal strategy for {name} at {company} in {stage} worth ${amount}.",
        },
      ]),
      viewsJson: JSON.stringify([
        { id: "view_deals_grid", name: "All Deals Grid", type: "grid", sortField: "amount", sortDir: "desc" },
        { id: "view_deals_kanban", name: "Pipeline Kanban", type: "kanban", groupByField: "stage" },
      ]),
      accessRulesJson: JSON.stringify([
        { role: "ADMIN", access: "read_write" },
        { role: "EDITOR", access: "read_write" },
        { role: "VIEWER", access: "read_only" },
      ]),
    },
  });

  const leadsTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "Leads",
      sdkName: "leads",
      icon: "UserPlus",
      description: "Inbound and outbound prospects before qualification into open pipeline.",
      orderIndex: 1,
      fieldsJson: JSON.stringify([
        { id: "fld_lead_name", name: "Full Name", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_lead_company", name: "Company", sdkName: "company", type: "single_line_text" },
        { id: "fld_lead_email", name: "Email", sdkName: "email", type: "email" },
        { id: "fld_lead_phone", name: "Phone", sdkName: "phone", type: "phone_number" },
        {
          id: "fld_lead_status",
          name: "Status",
          sdkName: "status",
          type: "single_select",
          options: [
            { label: "New Inbound", color: "blue" },
            { label: "Working", color: "amber" },
            { label: "Meeting Booked", color: "emerald" },
            { label: "Qualified", color: "green" },
          ],
        },
        { id: "fld_lead_score", name: "Fit Rating", sdkName: "rating", type: "rating" },
        { id: "fld_lead_source", name: "Source URL", sdkName: "sourceUrl", type: "url" },
        { id: "fld_lead_owner", name: "Owner", sdkName: "owner", type: "single_line_text" },
        {
          id: "fld_lead_ai",
          name: "AI Enrichment",
          sdkName: "aiSummary",
          type: "ai_field",
          promptTemplate: "Enrich lead {name} from {company} ({status})",
        },
      ]),
      viewsJson: JSON.stringify([
        { id: "view_leads_all", name: "Active Leads (9)", type: "grid", sortField: "rating", sortDir: "desc" },
        { id: "view_leads_kanban", name: "Lead Status Board", type: "kanban", groupByField: "status" },
      ]),
    },
  });

  const companiesTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "Companies",
      sdkName: "companies",
      icon: "Building2",
      description: "Everyone you sell to, and what is open with each of them.",
      orderIndex: 2,
      fieldsJson: JSON.stringify([
        { id: "fld_co_name", name: "Company Name", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_co_domain", name: "Website", sdkName: "website", type: "url" },
        { id: "fld_co_type", name: "Account Type", sdkName: "accountType", type: "single_select", options: [{ label: "Prospect", color: "blue" }, { label: "Customer", color: "emerald" }, { label: "Partner", color: "violet" }] },
        { id: "fld_co_employees", name: "Employees", sdkName: "employees", type: "number" },
        { id: "fld_co_pipeline", name: "Open Pipeline", sdkName: "openPipeline", type: "currency" },
        { id: "fld_co_won", name: "Won Revenue", sdkName: "wonRevenue", type: "currency" },
      ]),
      viewsJson: JSON.stringify([
        { id: "view_companies_all", name: "All Companies", type: "grid" },
      ]),
    },
  });

  const contactsTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "Contacts",
      sdkName: "contacts",
      icon: "Contact",
      description: "Everyone you know at the companies you sell to.",
      orderIndex: 3,
      fieldsJson: JSON.stringify([
        { id: "fld_ct_name", name: "Contact Name", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_ct_title", name: "Role / Title", sdkName: "title", type: "single_line_text" },
        { id: "fld_ct_company", name: "Company", sdkName: "company", type: "single_line_text" },
        { id: "fld_ct_email", name: "Email", sdkName: "email", type: "email" },
        { id: "fld_ct_reachable", name: "Reachable", sdkName: "reachable", type: "checkbox" },
        { id: "fld_ct_last", name: "Last Activity", sdkName: "lastActivity", type: "date" },
      ]),
      viewsJson: JSON.stringify([{ id: "view_contacts_all", name: "All Contacts", type: "grid" }]),
    },
  });

  const tasksTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "Tasks",
      sdkName: "tasks",
      icon: "CheckSquare",
      description: "Everything you owe someone, in the order it comes due.",
      orderIndex: 4,
      fieldsJson: JSON.stringify([
        { id: "fld_tsk_title", name: "Task", sdkName: "title", type: "single_line_text", primary: true },
        { id: "fld_tsk_bucket", name: "Bucket", sdkName: "bucket", type: "single_select", options: [{ label: "Today", color: "blue" }, { label: "Overdue", color: "red" }, { label: "Upcoming", color: "amber" }, { label: "Done", color: "green" }] },
        { id: "fld_tsk_deal", name: "Related Deal / Account", sdkName: "account", type: "single_line_text" },
        { id: "fld_tsk_owner", name: "Assignee", sdkName: "owner", type: "single_line_text" },
        { id: "fld_tsk_due", name: "Due Date", sdkName: "dueDate", type: "date" },
        { id: "fld_tsk_done", name: "Completed", sdkName: "completed", type: "checkbox" },
      ]),
      viewsJson: JSON.stringify([{ id: "view_tasks_all", name: "My & Team Tasks", type: "grid" }]),
    },
  });

  const outreachTable = await prisma.databaseTable.create({
    data: {
      workspaceId: crmWorkspace.id,
      name: "OutreachSequences",
      sdkName: "outreachSequences",
      icon: "Send",
      description: "Multi-step outreach that runs itself, and stops the moment someone replies.",
      orderIndex: 5,
      fieldsJson: JSON.stringify([
        { id: "fld_seq_name", name: "Sequence", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_seq_desc", name: "Description", sdkName: "description", type: "long_text" },
        { id: "fld_seq_cadence", name: "Cadence", sdkName: "cadence", type: "single_line_text" },
        { id: "fld_seq_enrolled", name: "Enrolled Now", sdkName: "enrolledNow", type: "number" },
        { id: "fld_seq_replied", name: "Replied (%)", sdkName: "repliedRate", type: "percent" },
        { id: "fld_seq_meetings", name: "Meetings (%)", sdkName: "meetingsRate", type: "percent" },
        { id: "fld_seq_owner", name: "Owner", sdkName: "owner", type: "single_line_text" },
      ]),
      viewsJson: JSON.stringify([{ id: "view_seq_all", name: "Running Sequences", type: "grid" }]),
    },
  });

  // Seed Deals Records matching explored Zite CRM report ($1.6M open pipeline · $604.6K weighted)
  const dealsSeed = [
    {
      name: "Signal Advisors — Enterprise Wealth OS",
      company: "Signal Advisors",
      stage: "Proposal",
      pipeline: "New business",
      amount: 245400,
      probability: 60,
      weightedValue: 147240,
      owner: "dominic@ashgrovesoftware.com",
      closeDate: "2026-11-15",
      nextStep: "Security & SOC2 review call on Tuesday",
      aiDealBrief: "Signal Advisors (Proposal, $245,400): High-fit opportunity — recommend scheduling executive follow-up within 48h.",
    },
    {
      name: "Mercury Financial — Treasury Portal",
      company: "Mercury",
      stage: "Demo",
      pipeline: "New business",
      amount: 290800,
      probability: 40,
      weightedValue: 116320,
      owner: "editor@zite.com",
      closeDate: "2026-11-28",
      nextStep: "Live Zite Database + SSO sandbox walkthrough",
      aiDealBrief: "Mercury Financial (Demo, $290,800): Strong technical champion — showcase row-level portal permissions.",
    },
    {
      name: "Morning Brew — Ad Operations Hub",
      company: "Morning Brew",
      stage: "Negotiation",
      pipeline: "New business",
      amount: 129800,
      probability: 80,
      weightedValue: 103840,
      owner: "dominic@ashgrovesoftware.com",
      closeDate: "2026-10-30",
      nextStep: "Redline MSA & finalize annual credit tier",
      aiDealBrief: "Morning Brew (Negotiation, $129,800): Legal review in progress — ready for signature.",
    },
    {
      name: "KPMG Advisory — Global Audit Tracker",
      company: "KPMG",
      stage: "Qualification",
      pipeline: "New business",
      amount: 630900,
      probability: 10,
      weightedValue: 63090,
      owner: "editor@zite.com",
      closeDate: "2026-12-18",
      nextStep: "Discovery workshop with Partner Operations",
      aiDealBrief: "KPMG Advisory (Qualification, $630,900): Enterprise scope — confirm isolated Postgres requirement.",
    },
    {
      name: "Stripe Atlas — Partner Onboarding",
      company: "Stripe",
      stage: "Discovery",
      pipeline: "New business",
      amount: 140600,
      probability: 25,
      weightedValue: 35150,
      owner: "viewer@zite.com",
      closeDate: "2026-12-05",
      nextStep: "Map webhook payload schema",
      aiDealBrief: "Stripe Atlas (Discovery, $140,600): Technical validation of inbound webhook workflows.",
    },
    {
      name: "Netflix Studio Ops — Multi-Site Renewal",
      company: "Netflix",
      stage: "In review",
      pipeline: "Renewals & expansion",
      amount: 176000,
      probability: 70,
      weightedValue: 123200,
      owner: "dominic@ashgrovesoftware.com",
      closeDate: "2026-11-10",
      nextStep: "QBR & 2027 seat expansion sign-off",
      aiDealBrief: "Netflix Studio Ops (In review, $176,000): Healthy adoption — upsell Zite Max Fast credits.",
    },
  ];

  for (const d of dealsSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: dealsTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(d),
        createdByEmail: d.owner,
      },
    });
  }

  // Seed 9 Leads matching explored "Leads 9" badge
  const leadsSeed = [
    { name: "Elena Rostova", company: "Vanguard Logistics", email: "elena@vanguardlogistics.io", phone: "+1 (415) 890-2311", status: "New Inbound", rating: 5, sourceUrl: "https://www.zite.com/spreadsheet-to-app", owner: "Marcus Bell", aiSummary: "VP Operations replacing 14 Airtable bases; high urgency." },
    { name: "Devon Brooks", company: "Northstar Bio", email: "dbrooks@northstarbio.com", phone: "+1 (617) 402-9812", status: "Working", rating: 4, sourceUrl: "https://www.zite.com/marketplace", owner: "Aisha Karim", aiSummary: "Evaluating clinical trial tracker template." },
    { name: "Sofia Chen", company: "Lattice Works", email: "sofia@latticeworks.co", phone: "+1 (212) 555-0194", status: "Meeting Booked", rating: 5, sourceUrl: "https://www.zite.com/enterprise", owner: "Dominic Olsen", aiSummary: "Booked Enterprise SSO + Audit Log architecture call." },
    { name: "Lucas Meyer", company: "Bespoke Freight", email: "lucas@bespokefreight.de", phone: "+49 30 901820", status: "New Inbound", rating: 4, sourceUrl: "https://www.zite.com/workflows", owner: "Hannah Lindqvist", aiSummary: "Needs automated PDF bill-of-lading generation." },
    { name: "Priya Nair", company: "Finch Capital", email: "priya@finchcap.com", phone: "+1 (312) 609-4410", status: "Qualified", rating: 5, sourceUrl: "https://www.zite.com/database", owner: "Marcus Bell", aiSummary: "LP portal + deal flow database consolidation." },
    { name: "Mateo Silva", company: "Solara Energy", email: "msilva@solara.energy", phone: "+1 (512) 774-3329", status: "Working", rating: 3, sourceUrl: "https://www.zite.com/apps", owner: "Aisha Karim", aiSummary: "Field installer mobile dispatch app." },
    { name: "Chloe Bennett", company: "Arcadia Retail", email: "chloe@arcadiaretail.com", phone: "+1 (206) 881-0023", status: "New Inbound", rating: 4, sourceUrl: "https://www.zite.com/integrations", owner: "Hannah Lindqvist", aiSummary: "Connecting Shopify + Stripe + Slack alerts." },
    { name: "Omar Farooq", company: "Helios Health", email: "omar@helioshealth.org", phone: "+1 (404) 312-7761", status: "Meeting Booked", rating: 5, sourceUrl: "https://www.zite.com/enterprise", owner: "Dominic Olsen", aiSummary: "HIPAA BAA + role-based clinician portal." },
    { name: "Nora Lindholm", company: "Nordic Timber", email: "nora@nordictimber.se", phone: "+46 8 501 22 00", status: "Working", rating: 4, sourceUrl: "https://www.zite.com/pricing", owner: "Marcus Bell", aiSummary: "Migrating from legacy Retool + Zapier stack." },
  ];

  for (const l of leadsSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: leadsTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(l),
        createdByEmail: "editor@zite.com",
      },
    });
  }

  // Seed Companies
  const companiesSeed = [
    { name: "Signal Advisors", website: "https://signaladvisors.com", accountType: "Customer", employees: 220, openPipeline: 245400, wonRevenue: 105000 },
    { name: "Mercury", website: "https://mercury.com", accountType: "Prospect", employees: 650, openPipeline: 290800, wonRevenue: 0 },
    { name: "Morning Brew", website: "https://morningbrew.com", accountType: "Customer", employees: 310, openPipeline: 129800, wonRevenue: 84000 },
    { name: "KPMG", website: "https://kpmg.com", accountType: "Prospect", employees: 5000, openPipeline: 630900, wonRevenue: 0 },
    { name: "Netflix", website: "https://netflix.com", accountType: "Customer", employees: 12000, openPipeline: 176000, wonRevenue: 210000 },
  ];
  for (const c of companiesSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: companiesTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(c),
        createdByEmail: "admin@zite.com",
      },
    });
  }

  // Seed Contacts
  const contactsSeed = [
    { name: "Patrick Kelly", title: "Co-Founder & CTO", company: "Signal Advisors", email: "patrick@signaladvisors.com", reachable: true, lastActivity: "2026-10-18" },
    { name: "Elena Vance", title: "VP Revenue Operations", company: "Mercury", email: "elena@mercury.com", reachable: true, lastActivity: "2026-10-19" },
    { name: "Jordan Hayes", title: "Head of Ad Systems", company: "Morning Brew", email: "jhayes@morningbrew.com", reachable: true, lastActivity: "2026-10-17" },
    { name: "Claire Sterling", title: "Managing Director", company: "KPMG", email: "csterling@kpmg.com", reachable: true, lastActivity: "2026-10-15" },
  ];
  for (const ct of contactsSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: contactsTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(ct),
        createdByEmail: "admin@zite.com",
      },
    });
  }

  // Seed Tasks
  const tasksSeed = [
    { title: "Send SOC2 Type II package & custom MSA redlines", bucket: "Today", account: "Signal Advisors", owner: "Dominic Olsen", dueDate: "2026-10-20", completed: false },
    { title: "Prepare live Zite Database row-level security demo", bucket: "Today", account: "Mercury", owner: "Marcus Bell", dueDate: "2026-10-20", completed: false },
    { title: "Follow up on Q4 renewal expansion pricing", bucket: "Overdue", account: "Netflix", owner: "Dominic Olsen", dueDate: "2026-10-16", completed: false },
    { title: "Export Q3 closed-won ledger to Finance", bucket: "Done", account: "Morning Brew", owner: "Hannah Lindqvist", dueDate: "2026-10-10", completed: true },
  ];
  for (const t of tasksSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: tasksTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(t),
        createdByEmail: "editor@zite.com",
      },
    });
  }

  // Seed Outreach Sequences matching explored `42_demo_crm_outreach`
  const outreachSeed = [
    {
      name: "New inbound lead",
      description: "For someone who asked to hear from us. Fast on day one, then it backs off.",
      cadence: "5 steps · 8d",
      enrolledNow: 4,
      repliedRate: 25,
      meetingsRate: 12,
      owner: "Marcus Bell",
    },
    {
      name: "Outbound prospecting",
      description: "Cold, for operations leaders at multi-site distributors. Stops the moment a deal appears.",
      cadence: "6 steps · 16d",
      enrolledNow: 6,
      repliedRate: 20,
      meetingsRate: 8,
      owner: "Aisha Karim",
    },
    {
      name: "Renewal check-in",
      description: "Starts sixty days out. Warm, short, and it never emails at the weekend.",
      cadence: "4 steps · 12d",
      enrolledNow: 2,
      repliedRate: 33,
      meetingsRate: 33,
      owner: "Hannah Lindqvist",
    },
  ];
  for (const seq of outreachSeed) {
    await prisma.databaseRecord.create({
      data: {
        tableId: outreachTable.id,
        workspaceId: crmWorkspace.id,
        valuesJson: JSON.stringify(seq),
        createdByEmail: "editor@zite.com",
      },
    });
  }

  // Seed ATS Table & Records
  const atsTable = await prisma.databaseTable.create({
    data: {
      workspaceId: atsWorkspace.id,
      name: "Applicants",
      sdkName: "applicants",
      icon: "Users",
      description: "Active candidates across engineering, product, and GTM requisitions.",
      orderIndex: 0,
      fieldsJson: JSON.stringify([
        { id: "fld_app_name", name: "Candidate Name", sdkName: "name", type: "single_line_text", primary: true },
        { id: "fld_app_role", name: "Role Applied", sdkName: "role", type: "single_line_text" },
        { id: "fld_app_stage", name: "Stage", sdkName: "stage", type: "single_select", options: [{ label: "Applied", color: "blue" }, { label: "Technical Screen", color: "violet" }, { label: "Onsite Loop", color: "amber" }, { label: "Offer Extended", color: "emerald" }] },
        { id: "fld_app_email", name: "Email", sdkName: "email", type: "email" },
        { id: "fld_app_score", name: "Interview Rating", sdkName: "score", type: "rating" },
        { id: "fld_app_ai", name: "AI Fit Summary", sdkName: "aiFitSummary", type: "ai_field", promptTemplate: "Assess candidate {name} for {role} ({stage})" },
      ]),
      viewsJson: JSON.stringify([
        { id: "view_ats_grid", name: "All Candidates", type: "grid" },
        { id: "view_ats_kanban", name: "Hiring Pipeline", type: "kanban", groupByField: "stage" },
      ]),
    },
  });

  await prisma.databaseRecord.createMany({
    data: [
      {
        tableId: atsTable.id,
        workspaceId: atsWorkspace.id,
        valuesJson: JSON.stringify({
          name: "Maya Lin",
          role: "Staff Distributed Systems Engineer",
          stage: "Offer Extended",
          email: "maya.lin@stanford.edu",
          score: 5,
          aiFitSummary: "Maya Lin (Offer Extended): Principal-level PostgreSQL & TypeScript architecture background.",
        }),
        createdByEmail: "admin@zite.com",
      },
      {
        tableId: atsTable.id,
        workspaceId: atsWorkspace.id,
        valuesJson: JSON.stringify({
          name: "Liam O'Connor",
          role: "Product Designer, Design Systems",
          stage: "Onsite Loop",
          email: "liam@oconnor.design",
          score: 4,
          aiFitSummary: "Liam O'Connor (Onsite Loop): Strong Brand Kit & interactive canvas craft.",
        }),
        createdByEmail: "editor@zite.com",
      },
    ],
  });

  // Seed ClientHub Portal Table & Records
  const invoicesTable = await prisma.databaseTable.create({
    data: {
      workspaceId: portalWorkspace.id,
      name: "Invoices",
      sdkName: "invoices",
      icon: "FileText",
      description: "Customer invoices with automatic tax formulas and PDF rendering.",
      orderIndex: 0,
      fieldsJson: JSON.stringify([
        { id: "fld_inv_num", name: "Invoice #", sdkName: "invoiceNumber", type: "single_line_text", primary: true },
        { id: "fld_inv_client", name: "Client", sdkName: "client", type: "single_line_text" },
        { id: "fld_inv_status", name: "Status", sdkName: "status", type: "single_select", options: [{ label: "Paid", color: "emerald" }, { label: "Due", color: "amber" }, { label: "Draft", color: "gray" }] },
        { id: "fld_inv_subtotal", name: "Subtotal", sdkName: "subtotal", type: "currency" },
        { id: "fld_inv_tax", name: "Tax", sdkName: "tax", type: "currency" },
        { id: "fld_inv_total", name: "Total Price", sdkName: "totalPrice", type: "formula", expression: "SUM({subtotal}, {tax})" },
      ]),
      viewsJson: JSON.stringify([{ id: "view_inv_all", name: "Client Invoices", type: "grid" }]),
    },
  });

  await prisma.databaseRecord.createMany({
    data: [
      {
        tableId: invoicesTable.id,
        workspaceId: portalWorkspace.id,
        valuesJson: JSON.stringify({
          invoiceNumber: "INV-2026-1042",
          client: "Signal Advisors",
          status: "Paid",
          subtotal: 24000,
          tax: 1920,
          totalPrice: 25920,
        }),
        createdByEmail: "editor@zite.com",
      },
      {
        tableId: invoicesTable.id,
        workspaceId: portalWorkspace.id,
        valuesJson: JSON.stringify({
          invoiceNumber: "INV-2026-1043",
          client: "Morning Brew",
          status: "Due",
          subtotal: 18500,
          tax: 1480,
          totalPrice: 19980,
        }),
        createdByEmail: "editor@zite.com",
      },
    ],
  });

  // 7. Seed Zite Apps with Monorepo Files, Version History & Multi-Chat Threads
  const crmMonorepoFiles = {
    "zite.config.json": JSON.stringify(
      {
        project: {
          name: "Ashgrove Software — Revenue OS",
          basePublicIdentifier: "ws_ashgrove_crm",
        },
        app: {
          name: "Ashgrove CRM",
          slug: "ashgrove-crm",
          accessMode: "INTERNAL",
          integrations: ["slack", "stripe", "hubspot", "resend"],
          userSync: { enabled: true, table: "Contacts" },
        },
      },
      null,
      2
    ),
    "zite.schema.json": JSON.stringify(
      {
        basePublicIdentifier: "ws_ashgrove_crm",
        tables: ["Deals", "Leads", "Companies", "Contacts", "Tasks", "OutreachSequences"],
        generatedBy: "zitejs generate",
      },
      null,
      2
    ),
    ".zite/db.ts": `// AUTO-GENERATED BY ZITE.JS — DO NOT EDIT MANUALLY
import type { ZiteDatabaseClient } from 'zitejs/db';

export interface DealRecord {
  id: string;
  name: string;
  company: string;
  stage: 'Qualification' | 'Discovery' | 'Demo' | 'Proposal' | 'Negotiation' | 'Closed Won';
  pipeline: 'New business' | 'Renewals & expansion';
  amount: number;
  probability: number;
  weightedValue: number;
  owner: string;
  closeDate: string;
  nextStep: string;
  aiDealBrief: string;
}

export declare const zite: ZiteDatabaseClient<{
  deals: DealRecord;
}>;
`,
    "apps/ashgrove-crm/src/App.tsx": `import React, { useState } from 'react';
import { useAuth } from 'zitejs/auth';
import { createLeadFollowup, generateDealQuotePdf } from 'zitejs/api';
import { Button, Card, Badge } from '@project/components/ui';

export default function AshgroveCrmApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'leads' | 'deals' | 'companies' | 'contacts' | 'tasks' | 'outreach' | 'reports'>('home');

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#141413]">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="font-serif text-xl">Ashgrove Software — Revenue OS</h1>
        <span className="text-sm text-neutral-600">{user?.email}</span>
      </header>
    </div>
  );
}
`,
    "apps/ashgrove-crm/src/api/createLeadFollowup.ts": `import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Create an automated follow-up task and Slack alert for high-priority leads',
  authenticated: true,
  inputSchema: z.object({
    leadName: z.string().min(1),
    company: z.string().min(1),
  }),
  outputSchema: z.object({ taskId: z.string(), status: z.string() }),
  execute: async ({ input, context }) => {
    if (!input.leadName) {
      throw new ZiteError({ code: 'BAD_REQUEST', message: 'Lead name is required' });
    }
    const created = await zite.tasks.create({
      record: {
        title: \`Executive follow-up with \${input.leadName} (\${input.company})\`,
        bucket: 'Today',
        account: input.company,
        owner: context.user?.email ?? 'dominic@ashgrovesoftware.com',
      },
    });
    return { taskId: created.id, status: 'scheduled' };
  },
});
`,
    "apps/ashgrove-crm/src/api/generateDealQuotePdf.ts": `import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { ZitePdf } from 'zitejs/pdf';

export default createEndpoint({
  description: 'Render an executive order form PDF for an open deal using ZitePdf.renderHtml',
  authenticated: true,
  inputSchema: z.object({
    dealName: z.string(),
    company: z.string(),
    amount: z.number(),
  }),
  execute: async ({ input }) => {
    const pdf = await ZitePdf.renderHtml({
      filename: \`\${input.company}-Order-Form.pdf\`,
      html: \`<h1>Order Form: \${input.dealName}</h1><p>Total: $\${input.amount.toLocaleString()}</p>\`,
    });
    return { pdfUrl: pdf.url, filename: pdf.filename };
  },
});
`,
  };

  const crmApp = await prisma.ziteApp.create({
    data: {
      publicId: "rnc1vjxbjr",
      slug: "ashgrove-crm",
      workspaceId: crmWorkspace.id,
      name: "Ashgrove CRM",
      description: "Full-pipeline revenue operating system with Leads, Deals Kanban, Companies, Contacts, Tasks, Outreach Sequences, and Executive Forecast Reports.",
      icon: "Briefcase",
      color: "#2563EB",
      templateCategory: "Sales",
      status: "PUBLISHED",
      accessMode: "INTERNAL",
      navigationJson: JSON.stringify([
        { id: "home", label: "Home" },
        { id: "leads", label: "Leads", badge: "9" },
        { id: "deals", label: "Deals" },
        { id: "companies", label: "Companies" },
        { id: "contacts", label: "Contacts" },
        { id: "tasks", label: "Tasks" },
        { id: "outreach", label: "Outreach" },
        { id: "reports", label: "Reports" },
      ]),
      styleOverridesJson: JSON.stringify({
        accentColor: "#2563EB",
        surfaceDensity: "comfortable",
        headingFont: "Georgia",
        cardRadius: "8px",
      }),
      monorepoFilesJson: JSON.stringify(crmMonorepoFiles),
      auditReportJson: JSON.stringify({
        reviewScore: 96,
        designScore: 98,
        accessibilityScore: 95,
        findings: [
          "All 6 database tables use typed zitejs/db SDK callers.",
          "Contrast ratios across Editorial Cream (#FAF9F5) and Ink (#141413) exceed WCAG AAA.",
          "Keyboard navigation (Ctrl+K search & Shift+Tab agent mode switching) verified.",
        ],
      }),
      currentVersion: 3,
    },
  });

  await prisma.appVersion.createMany({
    data: [
      {
        appId: crmApp.id,
        versionNumber: 1,
        label: "v1 — Initial CRM & Unified Database Schema",
        summary: "Generated Deals, Leads, Companies, and Contacts tables with initial grid views.",
        diffSummary: "+ Created apps/ashgrove-crm/src/App.tsx\n+ Created .zite/db.ts (4 tables)",
        snapshotJson: JSON.stringify({
          navigation: [
            { id: "home", label: "Home" },
            { id: "leads", label: "Leads", badge: "9" },
            { id: "deals", label: "Deals" },
            { id: "companies", label: "Companies" },
          ],
          accentColor: "#1D4ED8",
        }),
        createdByEmail: "dominic@ashgrovesoftware.com",
      },
      {
        appId: crmApp.id,
        versionNumber: 2,
        label: "v2 — Added Multi-Step Outreach Sequences & Tasks",
        summary: "Added OutreachSequences and Tasks tables plus createLeadFollowup workflow.",
        diffSummary: "+ Added Outreach & Tasks navigation modules\n+ Added apps/ashgrove-crm/src/api/createLeadFollowup.ts",
        snapshotJson: JSON.stringify({
          navigation: [
            { id: "home", label: "Home" },
            { id: "leads", label: "Leads", badge: "9" },
            { id: "deals", label: "Deals" },
            { id: "companies", label: "Companies" },
            { id: "contacts", label: "Contacts" },
            { id: "tasks", label: "Tasks" },
            { id: "outreach", label: "Outreach" },
          ],
          accentColor: "#2563EB",
        }),
        createdByEmail: "editor@zite.com",
      },
      {
        appId: crmApp.id,
        versionNumber: 3,
        label: "v3 — Q4 2026 Forecast Reports & PDF Order Form Workflow",
        summary: "Added executive Reports tab ($1.6M open pipeline · $604.6K weighted) and ZitePdf order form generator.",
        diffSummary: "+ Added Reports pipeline breakdown & CSV export\n+ Added apps/ashgrove-crm/src/api/generateDealQuotePdf.ts",
        snapshotJson: JSON.stringify({
          navigation: [
            { id: "home", label: "Home" },
            { id: "leads", label: "Leads", badge: "9" },
            { id: "deals", label: "Deals" },
            { id: "companies", label: "Companies" },
            { id: "contacts", label: "Contacts" },
            { id: "tasks", label: "Tasks" },
            { id: "outreach", label: "Outreach" },
            { id: "reports", label: "Reports" },
          ],
          accentColor: "#2563EB",
        }),
        createdByEmail: "dominic@ashgrovesoftware.com",
      },
    ],
  });

  await prisma.aiChatThread.createMany({
    data: [
      {
        appId: crmApp.id,
        title: "Build Q4 Pipeline Reports & PDF Quote Generator",
        mode: "build",
        modelTier: "zite-pro",
        messagesJson: JSON.stringify([
          {
            id: "msg_1",
            role: "user",
            mode: "build",
            modelTier: "zite-pro",
            content: "Add an executive Reports view showing open pipeline by stage, weighted forecast, and a workflow to generate PDF order forms.",
            createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
          },
          {
            id: "msg_2",
            role: "assistant",
            mode: "build",
            modelTier: "zite-pro",
            provider: "copilot-sdk",
            content: "Built the **Reports** module and wired `generateDealQuotePdf.ts` using `ZitePdf.renderHtml`. Open pipeline ($1.61M across 6 active deals, $588.8K weighted) now updates in real time from the `Deals` table.",
            createdAt: new Date(Date.now() - 3550 * 1000).toISOString(),
          },
        ]),
      },
      {
        appId: crmApp.id,
        title: "Plan row-level access rules for Account Executives",
        mode: "plan",
        modelTier: "zite-max",
        messagesJson: JSON.stringify([
          {
            id: "msg_3",
            role: "user",
            mode: "plan",
            modelTier: "zite-max",
            content: "Plan how we should scope deal visibility so external partners only see deals assigned to their company.",
            createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
          },
          {
            id: "msg_4",
            role: "assistant",
            mode: "plan",
            modelTier: "zite-max",
            provider: "copilot-sdk",
            content: "### Access Control Plan (Zite Max)\n1. Enable **User Sync** linking signed-in users to the `Contacts` table.\n2. Add a custom access rule on `Deals`: `record.company === context.user.company`.\n3. Keep internal `ADMIN` and `EDITOR` groups unrestricted.",
            createdAt: new Date(Date.now() - 7150 * 1000).toISOString(),
          },
        ]),
      },
    ],
  });

  // Create TalentFlow ATS & ClientHub Portal apps
  await prisma.ziteApp.create({
    data: {
      publicId: "ats9xk2lm",
      slug: "talentflow-ats",
      workspaceId: atsWorkspace.id,
      name: "TalentFlow ATS",
      description: "Recruiting pipeline, candidate scorecards, and AI resume screening.",
      icon: "Users",
      color: "#059669",
      templateCategory: "HR",
      status: "PUBLISHED",
      accessMode: "INTERNAL",
      navigationJson: JSON.stringify([
        { id: "home", label: "Overview" },
        { id: "leads", label: "Applicants", badge: "2" },
        { id: "tasks", label: "Interviews" },
        { id: "reports", label: "Hiring Velocity" },
      ]),
      monorepoFilesJson: JSON.stringify(crmMonorepoFiles),
      currentVersion: 1,
    },
  });

  await prisma.ziteApp.create({
    data: {
      publicId: "prt4vn8qw",
      slug: "clienthub-portal",
      workspaceId: portalWorkspace.id,
      name: "ClientHub Billing Portal",
      description: "Self-service client portal with project bookings and downloadable PDF invoices.",
      icon: "Globe",
      color: "#7C3AED",
      templateCategory: "Portals",
      status: "PUBLISHED",
      accessMode: "EXTERNAL_PORTAL",
      navigationJson: JSON.stringify([
        { id: "home", label: "Portal Home" },
        { id: "deals", label: "Invoices" },
        { id: "tasks", label: "Deliverables" },
      ]),
      monorepoFilesJson: JSON.stringify(crmMonorepoFiles),
      currentVersion: 1,
    },
  });

  // 8. Seed Workflows & Workflow Runs
  const leadWorkflow = await prisma.ziteWorkflow.create({
    data: {
      workspaceId: crmWorkspace.id,
      appId: crmApp.id,
      name: "Qualify Inbound Lead & Notify Slack",
      filename: "createLeadFollowup.ts",
      description: "Triggered when a new lead arrives or on button click; enriches company fit with AI, creates a Today task, and posts to #revenue-alerts.",
      triggerType: "app_click",
      triggerConfigJson: JSON.stringify({ buttonLabel: "Qualify & Enrich Lead", authenticated: true }),
      stepsJson: JSON.stringify([
        { id: "step_1", title: "Validate Input Schema (Zod)", kind: "trigger", detail: "z.object({ leadName, company, email })" },
        { id: "step_2", title: "Enrich Lead via Zite AI Engine", kind: "ai", detail: "Synthesize executive readiness score & talking points" },
        { id: "step_3", title: "Insert Follow-up Task in Zite Database", kind: "database", detail: "zite.tasks.create({ bucket: 'Today' })" },
        { id: "step_4", title: "Post Block Kit Alert to Slack #revenue-alerts", kind: "integration", detail: "slack.chat.postMessage({ channel: '#revenue-alerts' })" },
      ]),
      code: crmMonorepoFiles["apps/ashgrove-crm/src/api/createLeadFollowup.ts"],
      enabled: true,
    },
  });

  const pdfWorkflow = await prisma.ziteWorkflow.create({
    data: {
      workspaceId: crmWorkspace.id,
      appId: crmApp.id,
      name: "Generate Executive Order Form PDF",
      filename: "generateDealQuotePdf.ts",
      description: "Renders a branded HTML order form and invoice PDF via ZitePdf.renderHtml and attaches it to the Deal record.",
      triggerType: "on_demand",
      triggerConfigJson: JSON.stringify({ authenticated: true, pdfOutput: true }),
      stepsJson: JSON.stringify([
        { id: "step_1", title: "Load Deal & Company Record", kind: "database", detail: "zite.deals.findOne({ id: input.dealId })" },
        { id: "step_2", title: "Calculate Weighted Discount & Tax", kind: "code", detail: "Compute subtotal, annual credits, and net terms" },
        { id: "step_3", title: "Render Branded PDF via ZitePdf.renderHtml", kind: "pdf", detail: "Generates downloadable Order Form artifact" },
      ]),
      code: crmMonorepoFiles["apps/ashgrove-crm/src/api/generateDealQuotePdf.ts"],
      enabled: true,
    },
  });

  await prisma.ziteWorkflow.create({
    data: {
      workspaceId: crmWorkspace.id,
      appId: crmApp.id,
      name: "Nightly Stalled Pipeline Digest",
      filename: "stalledPipelineDigestCron.ts",
      description: "Runs every weekday at 08:00 UTC to flag open deals with no next step scheduled.",
      triggerType: "schedule",
      triggerConfigJson: JSON.stringify({ cron: "0 8 * * 1-5", timezone: "UTC" }),
      stepsJson: JSON.stringify([
        { id: "step_1", title: "Schedule Trigger (Weekdays 08:00 UTC)", kind: "trigger", detail: "cron: 0 8 * * 1-5" },
        { id: "step_2", title: "Query Stalled Deals via zite.sql()", kind: "database", detail: "SELECT * FROM \"Deals\" WHERE \"nextStep\" = ''" },
        { id: "step_3", title: "Send Digest Email via Resend", kind: "integration", detail: "resend.emails.send({ to: 'sales@ashgrovesoftware.com' })" },
      ]),
      code: `import { createEndpoint } from 'zitejs/backend';\nimport { zite } from 'zitejs/db';\nexport default createEndpoint({ schedule: { cron: '0 8 * * 1-5' }, execute: async () => zite.deals.findAll() });`,
      enabled: true,
    },
  });

  await prisma.ziteWorkflow.create({
    data: {
      workspaceId: crmWorkspace.id,
      appId: crmApp.id,
      name: "Inbound Stripe Subscription Webhook",
      filename: "stripeInvoiceWebhook.ts",
      description: "Receives Stripe invoice.paid webhooks, updates Company Won Revenue, and logs audit trail.",
      triggerType: "webhook",
      triggerConfigJson: JSON.stringify({ path: "/public/rnc1vjxbjr/api/stripeInvoiceWebhook", method: "POST" }),
      stepsJson: JSON.stringify([
        { id: "step_1", title: "Verify Stripe Signature Header", kind: "trigger", detail: "POST /public/rnc1vjxbjr/api/stripeInvoiceWebhook" },
        { id: "step_2", title: "Upsert Company Won Revenue", kind: "database", detail: "zite.companies.update({ wonRevenue })" },
      ]),
      code: `import { createEndpoint } from 'zitejs/backend';\nexport default createEndpoint({ webhook: { verifySignature: true }, execute: async ({ input }) => ({ received: true, input }) });`,
      enabled: true,
    },
  });

  // Seed Workflow Runs
  await prisma.workflowRun.createMany({
    data: [
      {
        workflowId: leadWorkflow.id,
        workspaceId: crmWorkspace.id,
        triggerSource: "app_click",
        status: "SUCCESS",
        durationMs: 184,
        inputJson: JSON.stringify({ leadName: "Elena Rostova", company: "Vanguard Logistics", email: "elena@vanguardlogistics.io" }),
        outputJson: JSON.stringify({ taskId: "tsk_901", slackChannel: "#revenue-alerts", status: "scheduled" }),
        stepsLogJson: JSON.stringify([
          { step: "Validate Input Schema (Zod)", status: "SUCCESS", durationMs: 8, output: "Valid lead payload" },
          { step: "Enrich Lead via Zite AI Engine", status: "SUCCESS", durationMs: 92, output: "Fit score 5/5 — replacing 14 Airtable bases" },
          { step: "Insert Follow-up Task in Zite Database", status: "SUCCESS", durationMs: 41, output: "Created Task tsk_901 in bucket 'Today'" },
          { step: "Post Block Kit Alert to Slack #revenue-alerts", status: "SUCCESS", durationMs: 43, output: "Message ts=1760928102.0012" },
        ]),
        triggeredByEmail: "dominic@ashgrovesoftware.com",
      },
      {
        workflowId: pdfWorkflow.id,
        workspaceId: crmWorkspace.id,
        triggerSource: "on_demand",
        status: "SUCCESS",
        durationMs: 265,
        inputJson: JSON.stringify({ dealName: "Signal Advisors — Enterprise Wealth OS", company: "Signal Advisors", amount: 245400 }),
        outputJson: JSON.stringify({ filename: "Signal-Advisors-Order-Form.pdf", pages: 2, status: "rendered" }),
        stepsLogJson: JSON.stringify([
          { step: "Load Deal & Company Record", status: "SUCCESS", durationMs: 24, output: "Loaded Signal Advisors ($245,400)" },
          { step: "Calculate Weighted Discount & Tax", status: "SUCCESS", durationMs: 19, output: "Annual Business Plan + 10,000 AI Credits" },
          { step: "Render Branded PDF via ZitePdf.renderHtml", status: "SUCCESS", durationMs: 222, output: "Generated Signal-Advisors-Order-Form.pdf" },
        ]),
        pdfArtifactHtml: `<div style="font-family: Georgia, serif; padding: 32px; color: #141413; background: #FAF9F5; border: 1px solid #E6E4DD; border-radius: 8px;">
  <div style="display:flex; justify-content:space-between; border-bottom: 2px solid #141413; padding-bottom: 16px;">
    <div>
      <h2 style="margin:0; font-size: 22px;">ASHGROVE SOFTWARE — ENTERPRISE ORDER FORM</h2>
      <p style="margin:4px 0 0; font-family: Inter, sans-serif; font-size: 12px; color: #5E5D59;">Generated by ZitePdf.renderHtml · Reference #Q-2026-884</p>
    </div>
    <div style="text-align:right; font-family: Inter, sans-serif; font-size: 12px;">
      <strong>Prepared For:</strong> Signal Advisors<br/>
      <strong>Valid Until:</strong> Nov 15, 2026
    </div>
  </div>
  <table style="width:100%; margin-top: 20px; border-collapse: collapse; font-family: Inter, sans-serif; font-size: 13px;">
    <thead>
      <tr style="border-bottom: 1px solid #D4D2C8; text-align:left;">
        <th style="padding: 8px 0;">Line Item</th>
        <th style="padding: 8px 0;">Tier</th>
        <th style="padding: 8px 0; text-align:right;">Annual Total</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #E6E4DD;">
        <td style="padding: 10px 0;">Ashgrove Wealth OS Platform License (Unlimited Users)</td>
        <td style="padding: 10px 0;">Enterprise Isolated DB</td>
        <td style="padding: 10px 0; text-align:right;">$195,400.00</td>
      </tr>
      <tr style="border-bottom: 1px solid #E6E4DD;">
        <td style="padding: 10px 0;">Dedicated Zite AI Credits & Automated Workflows Pool</td>
        <td style="padding: 10px 0;">50,000 runs / mo</td>
        <td style="padding: 10px 0; text-align:right;">$50,000.00</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top: 20px; text-align:right; font-family: Inter, sans-serif;">
    <p style="font-size: 16px; font-weight: 700;">Total Annual Contract Value: $245,400.00 USD</p>
  </div>
</div>`,
        triggeredByEmail: "dominic@ashgrovesoftware.com",
      },
    ],
  });

  // 9. Seed Connected Workspace Integrations
  await prisma.workspaceIntegration.createMany({
    data: [
      { workspaceId: crmWorkspace.id, providerId: "slack", name: "Slack", category: "Communication", status: "CONNECTED", secretMasked: "xoxb-8921-••••••••••••", configJson: JSON.stringify({ channel: "#revenue-alerts" }) },
      { workspaceId: crmWorkspace.id, providerId: "stripe", name: "Stripe", category: "Payments & Billing", status: "CONNECTED", secretMasked: "sk_live_51P••••••••••••", configJson: JSON.stringify({ webhookEnabled: true }) },
      { workspaceId: crmWorkspace.id, providerId: "hubspot", name: "HubSpot", category: "CRM", status: "CONNECTED", secretMasked: "pat-na1-••••••••••••", configJson: JSON.stringify({ syncDirection: "two-way" }) },
      { workspaceId: crmWorkspace.id, providerId: "airtable", name: "Airtable", category: "Databases", status: "CONNECTED", secretMasked: "pat7x9••••••••••••", configJson: JSON.stringify({ importedBases: 3 }) },
      { workspaceId: crmWorkspace.id, providerId: "resend", name: "Resend", category: "Email", status: "CONNECTED", secretMasked: "re_992••••••••••••", configJson: JSON.stringify({ domain: "mail.ashgrovesoftware.com" }) },
    ],
  });

  // 10. Seed Organization Settings
  await prisma.orgSetting.upsert({
    where: { key: "ai_provider" },
    create: {
      key: "ai_provider",
      valueJson: JSON.stringify({
        provider: "copilot-sdk",
        defaultModelTier: "zite-pro",
        copilotModel: "gpt-4.1",
        azureEndpoint: "https://your-resource.openai.azure.com",
        azureDeployment: "gpt-4o",
        orgDefaultCreditLimit: 400,
        requireMfa: true,
      }),
    },
    update: {},
  });

  // 11. Seed Security & Operational Audit Logs
  await prisma.auditLog.deleteMany();
  await prisma.auditLog.createMany({
    data: [
      {
        eventType: "auth.login.success",
        category: "auth",
        securityCritical: true,
        actorUserId: adminUser.id,
        actorEmail: "admin@zite.com",
        targetType: "user",
        targetId: adminUser.id,
        targetName: "Dominic Olsen",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ method: "password", ip: "10.24.0.12" }),
      },
      {
        eventType: "user.invite",
        category: "user",
        securityCritical: false,
        actorUserId: adminUser.id,
        actorEmail: "admin@zite.com",
        targetType: "invitation",
        targetId: "inv_seed_1",
        targetName: "aisha.karim@ashgrovesoftware.com",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ email: "aisha.karim@ashgrovesoftware.com", role: "EDITOR", expiresInHours: 72 }),
      },
      {
        eventType: "user.disable",
        category: "user",
        securityCritical: true,
        actorUserId: adminUser.id,
        actorEmail: "admin@zite.com",
        targetType: "user",
        targetId: "usr_revoked",
        targetName: "revoked@zite.com",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ email: "revoked@zite.com", reason: "Contractor engagement ended", sessionVersionIncremented: true }),
      },
      {
        eventType: "db.table.create",
        category: "db",
        securityCritical: false,
        actorUserId: adminUser.id,
        actorEmail: "admin@zite.com",
        targetType: "table",
        targetId: dealsTable.id,
        targetName: "Deals",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ basePublicId: "ws_ashgrove_crm", fieldsCount: 11 }),
      },
      {
        eventType: "db.field.create",
        category: "db",
        securityCritical: false,
        actorUserId: editorUser.id,
        actorEmail: "editor@zite.com",
        targetType: "field",
        targetId: "fld_deal_ai_brief",
        targetName: "AI Deal Brief",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ table: "Deals", fieldType: "ai_field" }),
      },
      {
        eventType: "org.creditLimitDefaultChange",
        category: "org",
        securityCritical: true,
        actorUserId: adminUser.id,
        actorEmail: "admin@zite.com",
        targetType: "organization",
        targetId: "org_ashgrove",
        targetName: "Ashgrove Software",
        outcome: "SUCCESS",
        payloadJson: JSON.stringify({ from: 250, to: 400 }),
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
