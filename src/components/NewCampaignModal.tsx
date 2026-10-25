"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { generateAICampaign } from "@/lib/aiService";
import { Campaign } from "@/types";
import {
  X,
  Sparkles,
  Rocket,
  Loader2,
  Check,
  DollarSign,
  Calendar,
  Layers,
  Users,
  Target,
} from "lucide-react";

const AUDIENCE_PRESETS = [
  "AI & RAG Engineers",
  "Fullstack TypeScript & Next.js Developers",
  "Rust & Systems Engineers",
  "DevOps & Platform Architects",
  "Open Source Contributors",
];

const OBJECTIVE_PRESETS = [
  "Launch Major Version v2.0 & Drive GitHub Stars",
  "Accelerate SDK Adoption & Active API Keys",
  "Onboard 200+ Contributors for Hackathon Sprint",
  "Establish Thought Leadership on Edge Computing",
];

const CHANNEL_OPTIONS = [
  "X (Twitter)",
  "Hacker News",
  "Dev.to",
  "GitHub",
  "Discord",
  "YouTube",
  "LinkedIn",
  "Reddit",
];

export const NewCampaignModal: React.FC = () => {
  const { isNewCampaignOpen, setIsNewCampaignOpen, addCampaign, setActiveTab, showToast } = useDevRel();

  const [name, setName] = useState("");
  const [toolOrProject, setToolOrProject] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [duration, setDuration] = useState("4 Weeks");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "X (Twitter)",
    "Hacker News",
    "Dev.to",
    "GitHub",
  ]);
  const [budget, setBudget] = useState("$6,000");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState("");
  const [githubRepoInput, setGithubRepoInput] = useState("");
  const [isAnalyzingGithub, setIsAnalyzingGithub] = useState(false);
  const [githubMetadata, setGithubMetadata] = useState<{
    stars: number;
    description: string;
    language: string;
    topics: string[];
    fullName: string;
  } | null>(null);

  const handleAnalyzeGithub = async () => {
    if (!githubRepoInput.trim()) return;
    setIsAnalyzingGithub(true);
    try {
      const res = await fetch("/api/github/repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: githubRepoInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.repository) {
        const repo = data.repository;
        setGithubMetadata({
          stars: repo.stars,
          description: repo.description,
          language: repo.language,
          topics: repo.topics,
          fullName: repo.fullName,
        });
        setToolOrProject(repo.fullName);
        if (repo.description) {
          setName(`${repo.name} Developer Activation`);
        }
        if (repo.language) {
          setTargetAudience(`${repo.language} Engineers & Systems Architects`);
        }
        setObjective(`Grow ${repo.name} adoption from ${repo.stars.toLocaleString()} stars and onboard community contributors.`);
        showToast(`Analyzed GitHub repo: ${repo.fullName} (${repo.stars.toLocaleString()} stars)!`, "success");
      } else {
        showToast(data.error || "Failed to analyze GitHub repo", "error");
      }
    } catch {
      showToast("Could not reach GitHub API", "error");
    } finally {
      setIsAnalyzingGithub(false);
    }
  };

  if (!isNewCampaignOpen) return null;

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolOrProject.trim()) return;

    setIsGenerating(true);
    setProgressStep("Analyzing developer personas & pain points...");

    setTimeout(() => {
      setProgressStep("Synthesizing narrative pillars & benchmark angles...");
    }, 600);

    setTimeout(() => {
      setProgressStep("Drafting tutorial curricula & social launch threads...");
    }, 1200);

    try {
      const generated = await generateAICampaign({
        name: name.trim() || `${toolOrProject} Developer Activation`,
        toolOrProject: toolOrProject.trim(),
        targetAudience: targetAudience.trim() || "Fullstack Software Engineers",
        objective: objective.trim() || "Drive open-source adoption and developer signups.",
        duration,
        channels: selectedChannels,
        budget,
        onAlert: (msg, type) => showToast(msg, type),
      });

      if (!generated || !generated.strategy) {
        throw new Error("Invalid campaign response received from Groq.");
      }

      const fullCampaign: Campaign = {
        id: `camp-${Date.now()}`,
        name: generated.name || `${toolOrProject} Launch Campaign`,
        toolOrProject: generated.toolOrProject || toolOrProject,
        targetAudience: generated.targetAudience || targetAudience,
        objective: generated.objective || objective,
        duration: generated.duration || duration,
        channels: generated.channels || selectedChannels,
        budget: generated.budget || budget,
        status: "Active",
        strategy: generated.strategy!,
        audienceProfile: generated.audienceProfile!,
        keyMessaging: generated.keyMessaging!,
        contentCalendar: generated.contentCalendar || [],
        tutorials: generated.tutorials || [],
        socialDrafts: generated.socialDrafts || [],
        eventSuggestions: generated.eventSuggestions || [],
        outreachDrafts: generated.outreachDrafts || [],
        kpis: generated.kpis || [],
        tasks: generated.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addCampaign(fullCampaign);
      setIsGenerating(false);
      setIsNewCampaignOpen(false);
      setActiveTab("campaigns");
      // Reset form
      setName("");
      setToolOrProject("");
      setTargetAudience("");
      setObjective("");
    } catch (err: any) {
      setIsGenerating(false);
      showToast(err?.message || "Groq campaign generation failed.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E8E5] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35]">
              <Rocket className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124]">New AI Developer Campaign</h2>
              <p className="text-xs text-[#747474]">
                Generate an end-to-end technical strategy, calendar, tutorials, and outreach.
              </p>
            </div>
          </div>
          <button
            onClick={() => !isGenerating && setIsNewCampaignOpen(false)}
            className="p-1.5 rounded-lg text-[#747474] hover:text-[#202124] hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Optional GitHub Repo Live Sync Bar */}
          <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5]">
            <span className="text-[11px] font-semibold text-[#202124] block mb-1">
              ⚡ Ground Campaign in Real GitHub Repository
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubRepoInput}
                onChange={(e) => setGithubRepoInput(e.target.value)}
                placeholder="e.g. vercel/next.js or owner/repo"
                className="flex-1 text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              />
              <button
                type="button"
                disabled={isAnalyzingGithub || !githubRepoInput.trim()}
                onClick={handleAnalyzeGithub}
                className="px-3 py-1.5 text-xs font-semibold text-[#202124] bg-white hover:bg-[#ECECE9] rounded-lg border border-[#E8E8E5] transition disabled:opacity-50"
              >
                {isAnalyzingGithub ? "Analyzing..." : "Fetch Stats"}
              </button>
            </div>
            {githubMetadata && (
              <div className="mt-2 text-[11px] text-[#202124] bg-white p-2 rounded-lg border border-[#E8E8E5]">
                <span className="font-bold text-[#FF6B35]">⭐ {githubMetadata.stars.toLocaleString()} stars</span> • Language: {githubMetadata.language || "Multi"} • {githubMetadata.description || "No description"}
              </div>
            )}
          </div>
          {/* Tool / Technology (Required) */}
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF6B35]" />
              Developer Tool, Technology, or Project *
            </label>
            <input
              type="text"
              required
              value={toolOrProject}
              onChange={(e) => setToolOrProject(e.target.value)}
              placeholder="e.g. VectorSearch WASM Engine, Postgres Edge Extension, Realtime SDK"
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
            />
          </div>

          {/* Campaign Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1.5">
              Campaign Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Edge WASM Launch & Contributor Sprint"
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
            />
          </div>

          {/* Target Audience with Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#FF6B35]" />
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. AI Engineers, Rust Systems Developers, Fullstack TypeScript Leads"
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetAudience(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    targetAudience === preset
                      ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                      : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:text-[#202124] hover:bg-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign Objective with Presets */}
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#FF6B35]" />
              Campaign Objective
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Drive 5k GitHub stars, 1,000 active API keys, and 50 production tutorials"
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {OBJECTIVE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setObjective(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    objective === preset
                      ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                      : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:text-[#202124] hover:bg-white"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              >
                <option value="2 Weeks">2 Weeks Sprint</option>
                <option value="4 Weeks">4 Weeks (Standard Launch)</option>
                <option value="6 Weeks">6 Weeks (Extended Hackathon)</option>
                <option value="1 Quarter">1 Quarter (Ecosystem Milestone)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#FF6B35]" />
                Budget (Optional)
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $5,000 for swag & bounties"
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
              >
              </input>
            </div>
          </div>

          {/* Preferred Channels */}
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-2">
              Preferred Developer Channels
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHANNEL_OPTIONS.map((channel) => {
                const isSelected = selectedChannels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35]"
                        : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                    }`}
                  >
                    <span>{channel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6B35]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading Indicator */}
          {isGenerating && (
            <div className="p-4 bg-[#FFF0EB] border border-[#FFD4C2] rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
              <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#FF6B35]">DevRel Copilot Generating Campaign</p>
                <p className="text-[11px] text-[#747474] truncate">{progressStep}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E8E8E5]">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsNewCampaignOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#747474] hover:text-[#202124] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || !toolOrProject.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs shadow-[#FF6B35]/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Strategy...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
