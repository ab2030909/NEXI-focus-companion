import fs from "fs";
import path from "path";
import {
  Campaign,
  ResearchReport,
  ContentDraft,
  DevRelEvent,
  OutreachContact,
} from "@/types";
import {
  INITIAL_CAMPAIGNS,
  INITIAL_RESEARCH_REPORTS,
  INITIAL_CONTENT_DRAFTS,
  INITIAL_EVENTS,
  INITIAL_CONTACTS,
} from "@/lib/mockData";

export interface DatabaseRecordMeta {
  workspaceId?: string;
  userId?: string;
  isDemo?: boolean;
}

export type ScopedCampaign = Campaign & DatabaseRecordMeta;
export type ScopedResearch = ResearchReport & DatabaseRecordMeta;
export type ScopedContent = ContentDraft & DatabaseRecordMeta;
export type ScopedEvent = DevRelEvent & DatabaseRecordMeta;
export type ScopedContact = OutreachContact & DatabaseRecordMeta;

export interface DatabaseData {
  campaigns: ScopedCampaign[];
  researchReports: ScopedResearch[];
  contentDrafts: ScopedContent[];
  events: ScopedEvent[];
  contacts: ScopedContact[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "devrelos_db.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getRawDatabase(): DatabaseData {
  ensureDirectory();
  if (!fs.existsSync(DB_FILE)) {
    // Tag initial mock data with ws-demo
    const initialData: DatabaseData = {
      campaigns: INITIAL_CAMPAIGNS.map((c) => ({ ...c, workspaceId: "ws-vectorsearch", isDemo: true })),
      researchReports: INITIAL_RESEARCH_REPORTS.map((r) => ({ ...r, workspaceId: "ws-vectorsearch", isDemo: true })),
      contentDrafts: INITIAL_CONTENT_DRAFTS.map((d) => ({ ...d, workspaceId: "ws-vectorsearch", isDemo: true })),
      events: INITIAL_EVENTS.map((e) => ({ ...e, workspaceId: "ws-vectorsearch", isDemo: true })),
      contacts: INITIAL_CONTACTS.map((c) => ({ ...c, workspaceId: "ws-vectorsearch", isDemo: true })),
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      campaigns: [],
      researchReports: [],
      contentDrafts: [],
      events: [],
      contacts: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function getDatabaseForWorkspace(workspaceId?: string): {
  campaigns: Campaign[];
  researchReports: ResearchReport[];
  contentDrafts: ContentDraft[];
  events: DevRelEvent[];
  contacts: OutreachContact[];
  isDemoWorkspace: boolean;
} {
  const rawDb = getRawDatabase();

  // If no workspace is specified or workspace is demo
  const isDemo = workspaceId === "ws-vectorsearch" || workspaceId === "ws-supabase";

  if (!workspaceId) {
    return {
      campaigns: [],
      researchReports: [],
      contentDrafts: [],
      events: [],
      contacts: [],
      isDemoWorkspace: false,
    };
  }

  if (isDemo) {
    return {
      campaigns: rawDb.campaigns.filter((c) => c.isDemo || c.workspaceId === workspaceId),
      researchReports: rawDb.researchReports.filter((r) => r.isDemo || r.workspaceId === workspaceId),
      contentDrafts: rawDb.contentDrafts.filter((d) => d.isDemo || d.workspaceId === workspaceId),
      events: rawDb.events.filter((e) => e.isDemo || e.workspaceId === workspaceId),
      contacts: rawDb.contacts.filter((c) => c.isDemo || c.workspaceId === workspaceId),
      isDemoWorkspace: true,
    };
  }

  // Real user workspace: only return items belonging strictly to this workspaceId
  return {
    campaigns: rawDb.campaigns.filter((c) => c.workspaceId === workspaceId && !c.isDemo),
    researchReports: rawDb.researchReports.filter((r) => r.workspaceId === workspaceId && !r.isDemo),
    contentDrafts: rawDb.contentDrafts.filter((d) => d.workspaceId === workspaceId && !d.isDemo),
    events: rawDb.events.filter((e) => e.workspaceId === workspaceId && !e.isDemo),
    contacts: rawDb.contacts.filter((c) => c.workspaceId === workspaceId && !c.isDemo),
    isDemoWorkspace: false,
  };
}

export function saveDatabaseForWorkspace(
  workspaceId: string,
  userId: string | undefined,
  data: {
    campaigns?: Campaign[];
    researchReports?: ResearchReport[];
    contentDrafts?: ContentDraft[];
    events?: DevRelEvent[];
    contacts?: OutreachContact[];
  }
) {
  ensureDirectory();
  const rawDb = getRawDatabase();

  const isDemo = workspaceId === "ws-vectorsearch" || workspaceId === "ws-supabase";

  if (data.campaigns !== undefined) {
    // Keep other workspaces' campaigns, replace this workspace's campaigns
    const otherCampaigns = rawDb.campaigns.filter((c) => c.workspaceId !== workspaceId);
    const updatedScoped = data.campaigns.map((c) => ({
      ...c,
      workspaceId,
      userId,
      isDemo,
    }));
    rawDb.campaigns = [...otherCampaigns, ...updatedScoped];
  }

  if (data.researchReports !== undefined) {
    const others = rawDb.researchReports.filter((r) => r.workspaceId !== workspaceId);
    const updated = data.researchReports.map((r) => ({
      ...r,
      workspaceId,
      userId,
      isDemo,
    }));
    rawDb.researchReports = [...others, ...updated];
  }

  if (data.contentDrafts !== undefined) {
    const others = rawDb.contentDrafts.filter((d) => d.workspaceId !== workspaceId);
    const updated = data.contentDrafts.map((d) => ({
      ...d,
      workspaceId,
      userId,
      isDemo,
    }));
    rawDb.contentDrafts = [...others, ...updated];
  }

  if (data.events !== undefined) {
    const others = rawDb.events.filter((e) => e.workspaceId !== workspaceId);
    const updated = data.events.map((e) => ({
      ...e,
      workspaceId,
      userId,
      isDemo,
    }));
    rawDb.events = [...others, ...updated];
  }

  if (data.contacts !== undefined) {
    const others = rawDb.contacts.filter((c) => c.workspaceId !== workspaceId);
    const updated = data.contacts.map((c) => ({
      ...c,
      workspaceId,
      userId,
      isDemo,
    }));
    rawDb.contacts = [...others, ...updated];
  }

  rawDb.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(rawDb, null, 2), "utf-8");
  return getDatabaseForWorkspace(workspaceId);
}
