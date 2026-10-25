"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  NavigationTab,
  Campaign,
  ResearchReport,
  ContentDraft,
  DevRelEvent,
  OutreachContact,
  IntegrationService,
  AgentActivity,
  AuthUser,
  UserProfile,
  Workspace,
} from "@/types";
import {
  INITIAL_CAMPAIGNS,
  INITIAL_RESEARCH_REPORTS,
  INITIAL_CONTENT_DRAFTS,
  INITIAL_EVENTS,
  INITIAL_CONTACTS,
  INITIAL_INTEGRATIONS,
  INITIAL_AGENT_ACTIVITIES,
} from "@/lib/mockData";

interface ToastInfo {
  id: string;
  message: string;
  type: "success" | "info" | "error";
}

interface DevRelContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  createWorkspace: (data: Partial<Workspace>) => Promise<boolean>;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  currentWorkspace: string;
  setCurrentWorkspace: (ws: string) => void;
  campaigns: Campaign[];
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  selectedCampaign: Campaign | null;
  addCampaign: (campaign: Campaign) => void;
  updateCampaign: (campaign: Campaign) => void;
  deleteCampaign: (id: string) => void;
  duplicateCampaign: (id: string) => void;
  toggleCampaignTask: (campaignId: string, taskId: string) => void;
  researchReports: ResearchReport[];
  addResearchReport: (report: ResearchReport) => void;
  deleteResearchReport: (id: string) => void;
  linkResearchToCampaign: (reportId: string, campaignId: string) => void;
  contentDrafts: ContentDraft[];
  addContentDraft: (draft: ContentDraft) => void;
  updateContentDraft: (draft: ContentDraft) => void;
  deleteContentDraft: (id: string) => void;
  events: DevRelEvent[];
  addEvent: (event: DevRelEvent) => void;
  updateEvent: (event: DevRelEvent) => void;
  deleteEvent: (id: string) => void;
  toggleEventTask: (eventId: string, taskId: string) => void;
  contacts: OutreachContact[];
  addContact: (contact: OutreachContact) => void;
  updateContact: (contact: OutreachContact) => void;
  deleteContact: (id: string) => void;
  integrations: IntegrationService[];
  toggleIntegration: (id: string) => void;
  agentActivities: AgentActivity[];
  addAgentActivity: (activity: Omit<AgentActivity, "id">) => void;
  isNewCampaignOpen: boolean;
  setIsNewCampaignOpen: (open: boolean) => void;
  toast: ToastInfo | null;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  resetToDefaults: () => void;
}

const DevRelContext = createContext<DevRelContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CAMPAIGNS: "devrelos_campaigns_v1",
  RESEARCH: "devrelos_research_v1",
  CONTENT: "devrelos_content_v1",
  EVENTS: "devrelos_events_v1",
  CONTACTS: "devrelos_contacts_v1",
  INTEGRATIONS: "devrelos_integrations_v1",
  ACTIVITIES: "devrelos_activities_v1",
  WORKSPACE: "devrelos_workspace_v1",
};

export const DevRelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [currentWorkspace, setCurrentWorkspace] = useState<string>("VectorSearch DevRel");
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(INITIAL_CAMPAIGNS[0]?.id || "");
  const [researchReports, setResearchReports] = useState<ResearchReport[]>(INITIAL_RESEARCH_REPORTS);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>(INITIAL_CONTENT_DRAFTS);
  const [events, setEvents] = useState<DevRelEvent[]>(INITIAL_EVENTS);
  const [contacts, setContacts] = useState<OutreachContact[]>(INITIAL_CONTACTS);
  const [integrations, setIntegrations] = useState<IntegrationService[]>(INITIAL_INTEGRATIONS);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>(INITIAL_AGENT_ACTIVITIES);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Hydrate from server database on mount, strictly isolated by active workspace
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      let currentWsId = "ws-vectorsearch";

      // 1. Check user session
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (mounted && sessionData.authenticated && sessionData.user) {
            setUser(sessionData.user);
            currentWsId = sessionData.user.activeWorkspaceId || currentWsId;
            const activeWs = sessionData.user.workspaces?.find((w: Workspace) => w.id === currentWsId) || sessionData.user.workspaces?.[0];
            if (activeWs) setCurrentWorkspace(activeWs.name);
          }
        }
      } catch {
        // Ignore session check errors
      } finally {
        if (mounted) setIsLoadingAuth(false);
      }

      // 2. Load database records strictly for this workspace
      try {
        const res = await fetch(`/api/storage?workspaceId=${encodeURIComponent(currentWsId)}`);
        if (res.ok) {
          const data = await res.json();
          if (mounted && data) {
            setCampaigns(data.campaigns || []);
            setSelectedCampaignId(data.campaigns?.[0]?.id || "");
            setResearchReports(data.researchReports || []);
            setContentDrafts(data.contentDrafts || []);
            setEvents(data.events || []);
            setContacts(data.contacts || []);
            return;
          }
        }
      } catch {
        // Fall back to empty or demo
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login failed", "error");
        return false;
      }
      setUser(data.user);
      const activeWs = data.user.workspaces?.find((w: Workspace) => w.id === data.user.activeWorkspaceId) || data.user.workspaces?.[0];
      if (activeWs) setCurrentWorkspace(activeWs.name);
      showToast(`Welcome back, ${data.user.profile.name}!`, "success");
      return true;
    } catch {
      showToast("Network error during login", "error");
      return false;
    }
  };

  const signup = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Registration failed", "error");
        return false;
      }
      setUser(data.user);
      const activeWs = data.user.workspaces?.find((w: Workspace) => w.id === data.user.activeWorkspaceId) || data.user.workspaces?.[0];
      if (activeWs) setCurrentWorkspace(activeWs.name);
      showToast("Account created successfully!", "success");
      return true;
    } catch {
      showToast("Network error during registration", "error");
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("Signed out successfully", "info");
      window.location.href = "/login";
    } catch {
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update profile", "error");
        return false;
      }
      setUser(data.user);
      showToast("Profile updated successfully!", "success");
      return true;
    } catch {
      showToast("Network error updating profile", "error");
      return false;
    }
  };

  const createWorkspace = async (wsData: Partial<Workspace>): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", workspaceData: wsData }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create workspace", "error");
        return false;
      }
      setUser(data.user);
      const newWs = data.user.workspaces?.find((w: Workspace) => w.id === data.user.activeWorkspaceId);
      if (newWs) setCurrentWorkspace(newWs.name);
      showToast(`Workspace "${wsData.name}" created!`, "success");
      return true;
    } catch {
      showToast("Network error creating workspace", "error");
      return false;
    }
  };

  const switchWorkspace = async (workspaceId: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch", workspaceId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to switch workspace", "error");
        return false;
      }
      setUser(data.user);
      const activeWs = data.user.workspaces?.find((w: Workspace) => w.id === data.user.activeWorkspaceId);
      if (activeWs) setCurrentWorkspace(activeWs.name);

      // Hydrate records for newly selected workspace
      const storeRes = await fetch(`/api/storage?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        setCampaigns(storeData.campaigns || []);
        setSelectedCampaignId(storeData.campaigns?.[0]?.id || "");
        setResearchReports(storeData.researchReports || []);
        setContentDrafts(storeData.contentDrafts || []);
        setEvents(storeData.events || []);
        setContacts(storeData.contacts || []);
      }

      showToast(`Switched to ${activeWs?.name || "workspace"}`, "info");
      return true;
    } catch {
      showToast("Network error switching workspace", "error");
      return false;
    }
  };

  // Sync state changes with both server database and localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
      fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaigns }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESEARCH, JSON.stringify(researchReports));
      fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchReports }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [researchReports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTENT, JSON.stringify(contentDrafts));
      fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentDrafts }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [contentDrafts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
      fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTEGRATIONS, JSON.stringify(integrations));
    } catch {
      // Ignore
    }
  }, [integrations]);

  const showToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Math.random().toString();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3500);
  };

  const addAgentActivity = (activity: Omit<AgentActivity, "id">) => {
    const newAct: AgentActivity = {
      ...activity,
      id: `act-${Date.now()}`,
    };
    setAgentActivities((prev) => [newAct, ...prev]);
  };

  const addCampaign = (campaign: Campaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
    setSelectedCampaignId(campaign.id);
    addAgentActivity({
      timestamp: "Just now",
      action: "Created new AI campaign",
      target: campaign.name,
      category: "campaign",
      status: "Completed",
    });
    showToast(`Campaign "${campaign.name}" created successfully!`, "success");
  };

  const updateCampaign = (updated: Campaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Campaign "${updated.name}" updated.`, "info");
  };

  const deleteCampaign = (id: string) => {
    const toDelete = campaigns.find((c) => c.id === id);
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (selectedCampaignId === id) {
      const remaining = campaigns.filter((c) => c.id !== id);
      setSelectedCampaignId(remaining[0]?.id || "");
    }
    showToast(`Campaign "${toDelete?.name || id}" removed.`, "info");
  };

  const duplicateCampaign = (id: string) => {
    const target = campaigns.find((c) => c.id === id);
    if (!target) return;
    const duplicated: Campaign = {
      ...target,
      id: `camp-${Date.now()}`,
      name: `${target.name} (Copy)`,
      status: "Planning",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addCampaign(duplicated);
  };

  const toggleCampaignTask = (campaignId: string, taskId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        const updatedTasks = c.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        return { ...c, tasks: updatedTasks };
      })
    );
  };

  const addResearchReport = (report: ResearchReport) => {
    setResearchReports((prev) => [report, ...prev]);
    addAgentActivity({
      timestamp: "Just now",
      action: "Synthesized technical research report",
      target: report.topic,
      category: "research",
      status: "Completed",
    });
    showToast("Research synthesis added to library.", "success");
  };

  const deleteResearchReport = (id: string) => {
    setResearchReports((prev) => prev.filter((r) => r.id !== id));
    showToast("Research report removed.", "info");
  };

  const linkResearchToCampaign = (reportId: string, campaignId: string) => {
    setResearchReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, linkedCampaignId: campaignId } : r))
    );
    showToast("Research successfully linked to campaign.", "success");
  };

  const addContentDraft = (draft: ContentDraft) => {
    setContentDrafts((prev) => [draft, ...prev]);
    addAgentActivity({
      timestamp: "Just now",
      action: `Generated ${draft.type.replace("-", " ")}`,
      target: draft.title,
      category: "content",
      status: "Completed",
    });
    showToast(`Content draft "${draft.title}" saved.`, "success");
  };

  const updateContentDraft = (updated: ContentDraft) => {
    setContentDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    showToast("Content draft updated.", "info");
  };

  const deleteContentDraft = (id: string) => {
    setContentDrafts((prev) => prev.filter((d) => d.id !== id));
    showToast("Draft deleted.", "info");
  };

  const addEvent = (event: DevRelEvent) => {
    setEvents((prev) => [event, ...prev]);
    addAgentActivity({
      timestamp: "Just now",
      action: "Created new event",
      target: event.title,
      category: "event",
      status: "Completed",
    });
    showToast(`Event "${event.title}" planned.`, "success");
  };

  const updateEvent = (updated: DevRelEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    showToast(`Event updated.`, "info");
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast("Event removed.", "info");
  };

  const toggleEventTask = (eventId: string, taskId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return {
          ...e,
          tasks: e.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      })
    );
  };

  const addContact = (contact: OutreachContact) => {
    setContacts((prev) => [contact, ...prev]);
    addAgentActivity({
      timestamp: "Just now",
      action: "Added outreach contact",
      target: contact.name,
      category: "outreach",
      status: "Completed",
    });
    showToast(`Contact "${contact.name}" added to pipeline.`, "success");
  };

  const updateContact = (updated: OutreachContact) => {
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast("Contact record updated.", "info");
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    showToast("Contact removed from pipeline.", "info");
  };

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextState = !item.connected;
        return {
          ...item,
          connected: nextState,
          statusText: nextState ? "Connected (Live Sync)" : "Not connected",
          lastSync: nextState ? "Just now" : undefined,
        };
      })
    );
    showToast("Integration state updated.", "info");
  };

  const resetToDefaults = () => {
    setCampaigns(INITIAL_CAMPAIGNS);
    setResearchReports(INITIAL_RESEARCH_REPORTS);
    setContentDrafts(INITIAL_CONTENT_DRAFTS);
    setEvents(INITIAL_EVENTS);
    setContacts(INITIAL_CONTACTS);
    setIntegrations(INITIAL_INTEGRATIONS);
    setAgentActivities(INITIAL_AGENT_ACTIVITIES);
    setSelectedCampaignId(INITIAL_CAMPAIGNS[0].id);
    localStorage.clear();
    showToast("Reset all records to default sample data.", "info");
  };

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0] || null;
  const workspaces = user?.workspaces || [];
  const activeWorkspace = workspaces.find((w) => w.id === user?.activeWorkspaceId) || workspaces[0] || null;

  return (
    <DevRelContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoadingAuth,
        login,
        signup,
        logout,
        updateProfile,
        createWorkspace,
        switchWorkspace,
        activeWorkspace,
        workspaces,
        activeTab,
        setActiveTab,
        currentWorkspace,
        setCurrentWorkspace,
        campaigns,
        selectedCampaignId,
        setSelectedCampaignId,
        selectedCampaign,
        addCampaign,
        updateCampaign,
        deleteCampaign,
        duplicateCampaign,
        toggleCampaignTask,
        researchReports,
        addResearchReport,
        deleteResearchReport,
        linkResearchToCampaign,
        contentDrafts,
        addContentDraft,
        updateContentDraft,
        deleteContentDraft,
        events,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleEventTask,
        contacts,
        addContact,
        updateContact,
        deleteContact,
        integrations,
        toggleIntegration,
        agentActivities,
        addAgentActivity,
        isNewCampaignOpen,
        setIsNewCampaignOpen,
        toast,
        showToast,
        searchQuery,
        setSearchQuery,
        resetToDefaults,
      }}
    >
      {children}
    </DevRelContext.Provider>
  );
};

export const useDevRel = (): DevRelContextType => {
  const context = useContext(DevRelContext);
  if (!context) {
    throw new Error("useDevRel must be used within a DevRelProvider");
  }
  return context;
};
