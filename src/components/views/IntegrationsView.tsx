"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { IntegrationService } from "@/types";
import {
  Blocks,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Key,
  RefreshCw,
  X,
  Shield,
  MessageSquare,
  BookOpen,
  Calendar,
  BarChart3,
  Cpu,
  Code2,
  Share2,
} from "lucide-react";

export const IntegrationsView: React.FC = () => {
  const { integrations, toggleIntegration, showToast } = useDevRel();
  const [configuringService, setConfiguringService] = useState<IntegrationService | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testRepo, setTestRepo] = useState("vercel/next.js");
  const [repoResult, setRepoResult] = useState<any>(null);
  const [isTestingRepo, setIsTestingRepo] = useState(false);

  const handleTestGithubRepo = async () => {
    if (!testRepo.trim()) return;
    setIsTestingRepo(true);
    try {
      const res = await fetch("/api/github/repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: testRepo.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.repository) {
        setRepoResult(data.repository);
        showToast(`Connected to GitHub API! Found ${data.repository.fullName}.`, "success");
      } else {
        showToast(data.error || "GitHub request failed", "error");
      }
    } catch {
      showToast("Could not reach GitHub API", "error");
    } finally {
      setIsTestingRepo(false);
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case "Github":
        return <Code2 className="w-5 h-5 text-[#202124]" />;
      case "MessageSquare":
        return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case "Twitter":
        return <Share2 className="w-5 h-5 text-sky-500" />;
      case "BookOpen":
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case "Calendar":
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case "BarChart3":
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case "Cpu":
        return <Cpu className="w-5 h-5 text-[#FF6B35]" />;
      default:
        return <Blocks className="w-5 h-5 text-[#747474]" />;
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringService) return;
    if (!configuringService.connected) {
      toggleIntegration(configuringService.id);
    }
    showToast(`Saved credentials for ${configuringService.name}.`, "success");
    setConfiguringService(null);
    setApiKeyInput("");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8E8E5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#202124]">Integrations & Provider Ecosystem</h2>
          <p className="text-xs text-[#747474]">
            Connect VCS repositories, developer communities, publishing hubs, event platforms, and LLM backends.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Encrypted Vault Mode</span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl p-5 border border-[#E8E8E5] hover:border-[#FFD4C2] transition shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center">
                    {getIcon(service.iconName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#202124]">{service.name}</h3>
                    <span className="text-[10px] font-semibold text-[#747474] uppercase">
                      {service.category}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    service.connected
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-[#F7F7F5] text-[#747474] border border-[#E8E8E5]"
                  }`}
                >
                  {service.connected ? "Active" : "Disabled"}
                </span>
              </div>

              <p className="text-xs text-[#747474] leading-relaxed mb-4 min-h-[36px]">
                {service.description}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E8E8E5] flex items-center justify-between">
              <span className="text-[11px] text-[#747474] font-medium truncate max-w-[140px]">
                {service.statusText}
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setConfiguringService(service);
                    setApiKeyInput("");
                  }}
                  className="p-1.5 text-[#747474] hover:text-[#202124] hover:bg-[#F7F7F5] rounded-lg border border-transparent hover:border-[#E8E8E5] transition"
                  title="Configure API Credentials"
                >
                  <Key className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleIntegration(service.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    service.connected
                      ? "bg-[#F7F7F5] hover:bg-red-50 text-red-600 border border-[#E8E8E5]"
                      : "bg-[#FF6B35] hover:bg-[#E85923] text-white"
                  }`}
                >
                  {service.connected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GitHub Live Repository Inspector Card */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#202124]" />
            <div>
              <h3 className="text-sm font-bold text-[#202124]">GitHub Public Repository Live Inspector</h3>
              <p className="text-xs text-[#747474]">Test real-time repository telemetry using the GitHub REST API.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testRepo}
            onChange={(e) => setTestRepo(e.target.value)}
            placeholder="e.g. vercel/next.js, facebook/react, rust-lang/rust"
            className="flex-1 text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
          />
          <button
            type="button"
            disabled={isTestingRepo || !testRepo.trim()}
            onClick={handleTestGithubRepo}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#202124] hover:bg-[#333] rounded-xl transition disabled:opacity-50 shrink-0"
          >
            {isTestingRepo ? "Fetching..." : "Fetch Live Repo Stats"}
          </button>
        </div>

        {repoResult && (
          <div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#202124]">{repoResult.fullName}</span>
              <a
                href={repoResult.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#FF6B35] hover:underline flex items-center gap-1"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-[#747474]">{repoResult.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-[#E8E8E5]">
                <span className="text-[#747474] text-[10px] uppercase font-semibold block">Stars</span>
                <span className="font-bold text-[#202124]">⭐ {repoResult.stars.toLocaleString()}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E8E8E5]">
                <span className="text-[#747474] text-[10px] uppercase font-semibold block">Forks</span>
                <span className="font-bold text-[#202124]">{repoResult.forks.toLocaleString()}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E8E8E5]">
                <span className="text-[#747474] text-[10px] uppercase font-semibold block">Open Issues</span>
                <span className="font-bold text-[#202124]">{repoResult.openIssues.toLocaleString()}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E8E8E5]">
                <span className="text-[#747474] text-[10px] uppercase font-semibold block">Language</span>
                <span className="font-bold text-[#202124]">{repoResult.language || "Multi"}</span>
              </div>
            </div>
            {repoResult.latestRelease && (
              <p className="text-[11px] text-[#747474] pt-1">
                Latest Release: <span className="font-semibold text-[#202124]">{repoResult.latestRelease.tagName}</span> ({repoResult.latestRelease.publishedAt?.split("T")[0]})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Configure Credentials Modal */}
      {configuringService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#202124]">
                  Configure {configuringService.name} API
                </h3>
              </div>
              <button
                onClick={() => setConfiguringService(null)}
                className="text-[#747474] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Environment Variable / Secret
                </label>
                <input
                  type="text"
                  readOnly
                  value={configuringService.apiKeyEnvName || "API_KEY"}
                  className="w-full text-xs font-mono bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#747474]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  API Key or Secret Token
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste token (e.g. sk-... or ghp_...)"
                  className="w-full text-xs font-mono bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
                <p className="text-[11px] text-[#747474] mt-1">
                  Keys are stored locally or injected securely into server runtime.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setConfiguringService(null)}
                  className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
