export type NavigationTab =
  | "overview"
  | "campaigns"
  | "research"
  | "content"
  | "events"
  | "outreach"
  | "analytics"
  | "integrations"
  | "settings";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  bio: string;
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  timezone: string;
  avatarUrl?: string;
  notificationPreferences: {
    emailAlerts: boolean;
    discordAlerts: boolean;
    weeklyDigest: boolean;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: "personal" | "organization";
  logoUrl?: string;
  websiteUrl?: string;
  docUrl?: string;
  isDemo?: boolean;
  createdAt: string;
  ownerId?: string;
  members?: Array<{ name: string; email: string; role: string }>;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  onboardingCompleted: boolean;
  isFirstTimeUser?: boolean;
  createdAt: string;
}

export interface CampaignTask {
  id: string;
  title: string;
  category: "Strategy" | "Content" | "Outreach" | "Event" | "Community";
  dueDate: string;
  completed: boolean;
  assignedTo?: string;
}

export interface ContentCalendarItem {
  id: string;
  day: string;
  date: string;
  channel: "X (Twitter)" | "LinkedIn" | "Dev.to" | "Hacker News" | "YouTube" | "GitHub" | "Discord";
  type: string;
  title: string;
  status: "Idea" | "Drafted" | "Scheduled" | "Published";
}

export interface TutorialIdea {
  title: string;
  targetAudience: string;
  estimatedReadTime: string;
  summary: string;
  keyTakeaway: string;
}

export interface SocialDraft {
  platform: "X / Twitter" | "LinkedIn" | "Reddit" | "Discord";
  hook: string;
  content: string;
  suggestedAssets?: string;
}

export interface EventSuggestion {
  title: string;
  format: "Virtual Workshop" | "Twitter Space" | "Hackathon" | "Conference Talk" | "In-Person" | "In-Person Meetup";
  description: string;
  targetAttendees: number;
}

export interface OutreachDraft {
  recipientType: string;
  subject: string;
  body: string;
}

export interface CampaignKPI {
  name: string;
  target: string;
  current: string;
  unit: string;
  progressPercent: number;
}

export interface Campaign {
  id: string;
  name: string;
  toolOrProject: string;
  targetAudience: string;
  objective: string;
  duration: string;
  channels: string[];
  budget?: string;
  status: "Planning" | "Active" | "Completed" | "Paused";
  strategy: {
    summary: string;
    narrativePillars: string[];
    valueProposition: string;
    differentiators: string[];
  };
  audienceProfile: {
    personas: string[];
    painPoints: string[];
    wateringHoles: string[];
    preferredFormats: string[];
  };
  keyMessaging: {
    primaryHeadline: string;
    elevatorPitch: string;
    proofPoints: string[];
  };
  contentCalendar: ContentCalendarItem[];
  tutorials: TutorialIdea[];
  socialDrafts: SocialDraft[];
  eventSuggestions: EventSuggestion[];
  outreachDrafts: OutreachDraft[];
  kpis: CampaignKPI[];
  tasks: CampaignTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  type: "Official Doc" | "GitHub Discussion" | "Tech Survey" | "Benchmark" | "Blog Post";
  verified: boolean;
}

export interface ResearchFinding {
  theme: string;
  summary: string;
  details: string;
  sources: ResearchSource[];
}

export interface ResearchReport {
  id: string;
  topic: string;
  objective: string;
  depth: "Quick Brief" | "Deep Ecosystem Analysis" | "Competitive Landscape" | "Technical Benchmark";
  targetEcosystem: string;
  findings: ResearchFinding[];
  keyInsights: string[];
  recommendedActions: string[];
  linkedCampaignId?: string;
  isDemo: boolean;
  createdAt: string;
}

export type ContentFormat =
  | "linkedin-post"
  | "technical-tutorial"
  | "blog-article"
  | "x-post"
  | "event-description"
  | "workshop-outline"
  | "product-launch"
  | "developer-docs";

export interface ContentDraft {
  id: string;
  title: string;
  type: ContentFormat;
  topic: string;
  audience: string;
  tone: string;
  length: "Short" | "Medium" | "Comprehensive";
  codeLanguage?: string;
  content: string;
  status: "Draft" | "Review" | "Ready" | "Published";
  tags: string[];
  linkedCampaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAgendaItem {
  id: string;
  time: string;
  title: string;
  speaker: string;
  duration: string;
}

export interface EventSpeaker {
  id: string;
  name: string;
  role: string;
  company: string;
  confirmed: boolean;
  avatarUrl?: string;
}

export interface EventSponsor {
  id: string;
  name: string;
  tier: "Platinum" | "Gold" | "Community";
  confirmed: boolean;
}

export interface EventTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface PromoDraft {
  platform: string;
  text: string;
}

export interface DevRelEvent {
  id: string;
  title: string;
  type: "Meetup" | "Workshop" | "Hackathon" | "Conference" | "Twitter Space";
  format: "Virtual" | "In-Person" | "Hybrid";
  date: string;
  time: string;
  venueOrLink: string;
  description: string;
  status: "Upcoming" | "Active" | "Past";
  registeredCount: number;
  registrationCap: number;
  actualAttendees?: number;
  agenda: EventAgendaItem[];
  speakers: EventSpeaker[];
  sponsors: EventSponsor[];
  tasks: EventTask[];
  promotions: PromoDraft[];
  recapSummary?: string;
  linkedCampaignId?: string;
  createdAt: string;
}

export interface OutreachContact {
  id: string;
  name: string;
  organization: string;
  role: string;
  email: string;
  category: "Speaker" | "Sponsor" | "Community Champion" | "OSS Maintainer" | "Tech Influencer";
  status: "Lead" | "Contacted" | "In Discussion" | "Confirmed" | "Declined";
  followUpDate: string;
  notes: string;
  aiEmailDraft: string;
  lastContacted?: string;
  linkedCampaignId?: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  description: string;
  category: "Code & VCS" | "Community" | "Publishing" | "Events" | "Analytics" | "AI Engine";
  connected: boolean;
  statusText: string;
  iconName: string;
  apiKeyEnvName?: string;
  lastSync?: string;
}

export interface AgentActivity {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  category: "campaign" | "content" | "research" | "event" | "outreach";
  status: "Completed" | "In Progress" | "Queued";
}
