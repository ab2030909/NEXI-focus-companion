"use client";

import React from "react";
import { useDevRel } from "@/context/DevRelContext";
import {
  Menu,
  Search,
  Sparkles,
  RefreshCw,
  Plus,
} from "lucide-react";

export const Header: React.FC<{ onOpenMobileMenu: () => void }> = ({ onOpenMobileMenu }) => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    setIsNewCampaignOpen,
    resetToDefaults,
    showToast,
  } = useDevRel();

  const [aiStatus, setAiStatus] = React.useState<{
    provider: string;
    configured: boolean;
    model: string;
    mode: string;
  }>({
    provider: "Groq",
    configured: false,
    model: "openai/gpt-oss-120b",
    mode: "demo",
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = React.useState(false);
  const [selectedAiMode, setSelectedAiMode] = React.useState<"local" | "groq">("groq");
  const [apiKeyInput, setApiKeyInput] = React.useState("");
  const [modelInput, setModelInput] = React.useState("openai/gpt-oss-120b");
  const [isTesting, setIsTesting] = React.useState(false);

  const refreshStatus = () => {
    fetch("/api/ai/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setAiStatus(data);
          if (data.model) setModelInput(data.model);
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    refreshStatus();
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("devrelos_ai_mode");
      if (savedMode === "local" || savedMode === "groq") {
        setSelectedAiMode(savedMode);
      }
      const savedKey = localStorage.getItem("devrelos_groq_key");
      if (savedKey) setApiKeyInput(savedKey);
      const savedModel = localStorage.getItem("devrelos_groq_model");
      if (savedModel && !savedModel.includes("llama-3.1-8b-instant")) {
        setModelInput(savedModel);
      } else {
        localStorage.removeItem("devrelos_groq_model");
        setModelInput("openai/gpt-oss-120b");
      }
    }
  }, []);

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("devrelos_ai_mode", selectedAiMode);
      if (apiKeyInput.trim()) {
        localStorage.setItem("devrelos_groq_key", apiKeyInput.trim());
      } else {
        localStorage.removeItem("devrelos_groq_key");
      }
      localStorage.setItem("devrelos_groq_model", modelInput);
    }
    refreshStatus();
    setIsSettingsModalOpen(false);
    showToast(
      selectedAiMode === "local"
        ? "AI Engine switched to Local Mode (Unlimited & Free)."
        : `AI Engine configured to use Groq (${modelInput}).`,
      "success"
    );
  };

  const handleTestGroqKey = async () => {
    setIsTesting(true);
    try {
      const testKey = apiKeyInput.trim();
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-groq-api-key": testKey,
          "x-groq-model": modelInput,
        },
        body: JSON.stringify({
          type: "x-post",
          topic: "Hello",
          audience: "Developers",
          tone: "Concise",
          length: "Short",
        }),
      });
      const data = await res.json();
      if (data.liveProvider) {
        showToast(`Groq connection verified! Model ${data.model} active.`, "success");
      } else {
        showToast(data.error || "Groq key verification failed.", "error");
      }
    } catch {
      showToast("Could not reach Groq API.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: "DevRel Command Center",
      subtitle: "Unified overview of campaigns, developer reach, and telemetry.",
    },
    campaigns: {
      title: "AI Campaign Builder",
      subtitle: "Plan, generate, and execute high-impact developer marketing initiatives.",
    },
    research: {
      title: "Research Lab",
      subtitle: "Deep technical ecosystem research, developer sentiment, and benchmarks.",
    },
    content: {
      title: "Content Studio",
      subtitle: "Generate tutorials, X threads, LinkedIn posts, and product announcements.",
    },
    events: {
      title: "Events & Community",
      subtitle: "Organize hackathons, meetups, conferences, and office hours.",
    },
    outreach: {
      title: "Outreach & Pipeline",
      subtitle: "Manage speaker invitations, sponsor relations, and open source champions.",
    },
    analytics: {
      title: "Analytics & Telemetry",
      subtitle: "Measure developer engagement, content performance, and community growth.",
    },
    integrations: {
      title: "Integrations & APIs",
      subtitle: "Connect VCS, publishing channels, analytics providers, and LLM backends.",
    },
    settings: {
      title: "Settings & Workspace",
      subtitle: "Configure workspace parameters, team members, and data exports.",
    },
  };

  const current = titles[activeTab] || titles.overview;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E8E8E5] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-[#747474] hover:text-[#202124] hover:bg-[#F7F7F5] md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold text-[#202124] tracking-tight truncate">
              {current.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-[#FFF0EB] text-[#FF6B35] px-2 py-0.5 rounded-full border border-[#FFD4C2]">
              <Sparkles className="w-3 h-3 text-[#FF6B35]" />
              AI Enabled
            </span>
          </div>
          <p className="text-xs text-[#747474] hidden sm:block truncate">{current.subtitle}</p>
        </div>
      </div>

      {/* Right: Search, Demo Mode Badge & Quick Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search Input */}
        <div className="relative hidden md:block w-52 lg:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#747474]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns, content..."
            className="w-full bg-[#F7F7F5] text-xs text-[#202124] pl-8 pr-3 py-1.5 rounded-lg border border-[#E8E8E5] focus:outline-none focus:border-[#FF6B35] transition placeholder:text-[#747474]"
          />
        </div>

        {/* AI Engine Status Badge */}
        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          title="Click to configure AI Engine (Groq)"
          className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] border border-[#E8E8E5] px-2.5 py-1.5 rounded-lg transition"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              aiStatus.configured ? "bg-[#FF6B35]" : "bg-amber-500"
            }`}
          />
          <span className="truncate">
            Groq: {modelInput}
          </span>
        </button>

        {/* Reset Data Button */}
        <button
          onClick={resetToDefaults}
          title="Reset to fresh demo dataset"
          className="p-1.5 text-[#747474] hover:text-[#202124] hover:bg-[#F7F7F5] rounded-lg border border-transparent hover:border-[#E8E8E5] transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Contextual Action Button */}
        {activeTab !== "campaigns" && (
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 px-3 py-1.5 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Campaign</span>
          </button>
        )}
      </div>

      {/* AI Engine & Groq Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#202124]">AI Engine & Groq Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#747474] hover:text-[#202124] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAiSettings} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-2">
                  Select AI Execution Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAiMode("local")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedAiMode === "local"
                        ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35]"
                        : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                    }`}
                  >
                    <p className="text-xs font-bold">Local Engine</p>
                    <p className="text-[10px] mt-0.5 leading-tight">100% Free, zero rate limits, always works</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedAiMode("groq")}
                    className={`p-3 rounded-xl border text-left transition ${
                      selectedAiMode === "groq"
                        ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35]"
                        : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                    }`}
                  >
                    <p className="text-xs font-bold">Groq Cloud API</p>
                    <p className="text-[10px] mt-0.5 leading-tight">Fast inference using openai/gpt-oss-120b</p>
                  </button>
                </div>
              </div>

              {selectedAiMode === "groq" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Groq API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="gsk_..."
                      className="w-full text-xs font-mono bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    />
                    <p className="text-[10px] text-[#747474] mt-1">
                      Get a free key from console.groq.com. Stored securely on your device.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#202124] mb-1">
                      Groq Model
                    </label>
                    <select
                      value={modelInput}
                      onChange={(e) => setModelInput(e.target.value)}
                      className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                    >
                      <option value="openai/gpt-oss-120b">
                        openai/gpt-oss-120b (Default Primary Model)
                      </option>
                      <option value="llama-3.3-70b-versatile">
                        llama-3.3-70b-versatile
                      </option>
                      <option value="mixtral-8x7b-32768">
                        mixtral-8x7b-32768
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="button"
                      disabled={isTesting || !apiKeyInput.trim()}
                      onClick={handleTestGroqKey}
                      className="text-[11px] font-semibold text-[#FF6B35] hover:text-[#E85923] underline disabled:opacity-50"
                    >
                      {isTesting ? "Testing connection..." : "Test Groq Connection"}
                    </button>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
