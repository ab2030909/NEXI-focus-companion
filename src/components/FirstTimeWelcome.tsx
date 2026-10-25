"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { generateAICampaign } from "@/lib/aiService";
import { Campaign } from "@/types";
import {
  Sparkles,
  Rocket,
  Edit3,
  ArrowRight,
  Loader2,
  Check,
  X,
  Target,
  Users,
  Layers,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";

export const FirstTimeWelcome: React.FC = () => {
  const { addCampaign, setActiveTab, showToast } = useDevRel();

  // Mode: null | "manual" | "ai" | "review"
  const [activeMode, setActiveMode] = useState<null | "manual" | "ai" | "review">(null);

  // Manual Creation State
  const [manualName, setManualName] = useState("");
  const [manualTool, setManualTool] = useState("");
  const [manualAudience, setManualAudience] = useState("");
  const [manualObjective, setManualObjective] = useState("");
  const [manualDuration, setManualDuration] = useState("4 Weeks");
  const [manualBudget, setManualBudget] = useState("");
  const [manualChannels, setManualChannels] = useState<string[]>([
    "GitHub",
    "X (Twitter)",
    "Discord",
  ]);

  // AI Prompt State
  const [aiGoalDescription, setAiGoalDescription] = useState("");
  const [aiProduct, setAiProduct] = useState("");
  const [aiAudience, setAiAudience] = useState("");
  const [aiObjective, setAiObjective] = useState("");
  const [aiDuration, setAiDuration] = useState("4 Weeks");
  const [aiChannels, setAiChannels] = useState<string[]>([
    "GitHub",
    "X (Twitter)",
    "Hacker News",
    "Dev.to",
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReviewCampaign, setGeneratedReviewCampaign] = useState<Campaign | null>(null);

  const CHANNEL_CHOICES = [
    "GitHub",
    "X (Twitter)",
    "Hacker News",
    "Dev.to",
    "Discord",
    "YouTube",
    "LinkedIn",
    "Reddit",
  ];

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTool.trim()) return;

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: manualName.trim() || `${manualTool} Campaign`,
      toolOrProject: manualTool.trim(),
      targetAudience: manualAudience.trim() || "Software Engineers",
      objective: manualObjective.trim() || "Developer adoption",
      duration: manualDuration,
      channels: manualChannels,
      budget: manualBudget.trim() || undefined,
      status: "Active",
      strategy: {
        summary: `Custom developer relations campaign for ${manualTool}.`,
        narrativePillars: [
          `Frictionless developer onboarding for ${manualTool}`,
          "Active community feedback and issue triage",
          "Production architectural benchmarks",
        ],
        valueProposition: `Modern tooling built for ${manualAudience || "developers"}.`,
        differentiators: ["Open source core", "Clean developer ergonomics"],
      },
      audienceProfile: {
        personas: [manualAudience || "Software Engineers"],
        painPoints: ["Complex setups", "Slow feedback loops"],
        wateringHoles: ["GitHub", "Discord", "X / Twitter"],
        preferredFormats: ["Technical quickstarts", "Code snippets"],
      },
      keyMessaging: {
        primaryHeadline: `${manualTool}: Built for developers.`,
        elevatorPitch: manualObjective || `Grow adoption for ${manualTool}.`,
        proofPoints: ["Production-ready", "Active community support"],
      },
      contentCalendar: [
        {
          id: `cc-${Date.now()}-1`,
          day: "Day 1",
          date: new Date().toISOString().split("T")[0],
          channel: "GitHub",
          type: "Repository Launch",
          title: `Announcing ${manualTool}`,
          status: "Scheduled",
        },
      ],
      tutorials: [],
      socialDrafts: [],
      eventSuggestions: [],
      outreachDrafts: [],
      kpis: [
        { name: "Developer Signups", target: "1,000", current: "0", unit: "devs", progressPercent: 0 },
      ],
      tasks: [
        {
          id: `t-${Date.now()}-1`,
          title: "Complete quickstart README documentation",
          category: "Content",
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
          completed: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCampaign(newCampaign);
    setActiveMode(null);
    setActiveTab("campaigns");
    showToast(`Campaign "${newCampaign.name}" saved!`, "success");
  };

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoalDescription.trim() && !aiProduct.trim()) return;

    setIsGenerating(true);
    try {
      const generated = await generateAICampaign({
        name: aiProduct ? `${aiProduct} AI Campaign` : "Developer Launch Campaign",
        toolOrProject: aiProduct || "Developer Technology",
        targetAudience: aiAudience || "Fullstack & Systems Developers",
        objective: aiObjective || aiGoalDescription,
        duration: aiDuration,
        channels: aiChannels,
        onAlert: (msg, type) => showToast(msg, type),
      });

      if (!generated || !generated.strategy) {
        throw new Error("Could not parse campaign strategy from Groq.");
      }

      const campaignCandidate: Campaign = {
        id: `camp-${Date.now()}`,
        name: generated.name || "AI Developer Campaign",
        toolOrProject: generated.toolOrProject || aiProduct || "Developer Technology",
        targetAudience: generated.targetAudience || aiAudience || "Developers",
        objective: generated.objective || aiObjective || aiGoalDescription,
        duration: generated.duration || aiDuration,
        channels: generated.channels || aiChannels,
        budget: generated.budget || "$5,000",
        status: "Active",
        strategy: generated.strategy,
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

      setGeneratedReviewCampaign(campaignCandidate);
      setActiveMode("review");
    } catch (err: any) {
      showToast(err?.message || "Failed to generate campaign with Groq.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAndSaveReview = () => {
    if (!generatedReviewCampaign) return;
    addCampaign(generatedReviewCampaign);
    setGeneratedReviewCampaign(null);
    setActiveMode(null);
    setActiveTab("campaigns");
    showToast(`Campaign "${generatedReviewCampaign.name}" saved to your workspace!`, "success");
  };

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] mx-auto shadow-sm">
          <Rocket className="w-6 h-6 text-[#FF6B35]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124]">
          Welcome to DevRelOS.
        </h1>
        <p className="text-xs sm:text-sm text-[#747474] leading-relaxed">
          Your workspace is ready. Start with a campaign of your own, or let AI help you build one.
        </p>
      </div>

      {/* Two Large Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* OPTION A: Create a Campaign */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition shadow-xs flex flex-col justify-between group">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] flex items-center justify-center text-[#202124] mb-5 group-hover:scale-105 transition">
              <Edit3 className="w-6 h-6 text-[#202124]" />
            </div>
            <h3 className="text-lg font-bold text-[#202124] mb-2">Create a Campaign</h3>
            <p className="text-xs text-[#747474] leading-relaxed mb-6">
              Start from scratch and define your own developer relations campaign with custom deliverables, dates, and channels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveMode("manual")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-[#202124] hover:bg-[#333] text-white transition active:scale-98 shadow-sm cursor-pointer"
          >
            <span>Create Campaign</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* OPTION B: Build with AI */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#FF6B35]/40 hover:border-[#FF6B35] transition shadow-sm flex flex-col justify-between group relative overflow-hidden">
          <span className="absolute top-4 right-4 text-[10px] font-bold bg-[#FFF0EB] text-[#FF6B35] px-2.5 py-0.5 rounded-full border border-[#FFD4C2]">
            AI Planner
          </span>
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] mb-5 group-hover:scale-105 transition">
              <Sparkles className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <h3 className="text-lg font-bold text-[#202124] mb-2">Build with AI</h3>
            <p className="text-xs text-[#747474] leading-relaxed mb-6">
              Describe your goal and let your AI campaign planner create a tailored strategy, content calendar, and task checklist using Groq.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveMode("ai")}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold bg-[#FF6B35] hover:bg-[#E85923] text-white transition active:scale-98 shadow-sm shadow-[#FF6B35]/25 cursor-pointer"
          >
            <span>Build with AI</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL A: Manual Blank Campaign Creation Form */}
      {activeMode === "manual" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#202124]">Create Campaign From Scratch</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMode(null)}
                className="text-[#747474] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Product, Technology, or Repo Name *
                </label>
                <input
                  type="text"
                  required
                  value={manualTool}
                  onChange={(e) => setManualTool(e.target.value)}
                  placeholder="e.g. MyDatabase Engine, Edge SDK, CLI Tool"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Campaign Title (Optional)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Q4 Launch & Contributor Onboarding"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={manualAudience}
                    onChange={(e) => setManualAudience(e.target.value)}
                    placeholder="e.g. Fullstack TypeScript Engineers"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Duration
                  </label>
                  <select
                    value={manualDuration}
                    onChange={(e) => setManualDuration(e.target.value)}
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    <option value="2 Weeks">2 Weeks Sprint</option>
                    <option value="4 Weeks">4 Weeks (Standard)</option>
                    <option value="1 Quarter">1 Quarter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Campaign Objective
                </label>
                <input
                  type="text"
                  value={manualObjective}
                  onChange={(e) => setManualObjective(e.target.value)}
                  placeholder="e.g. Drive 1,000 GitHub stars and 500 active API keys"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Channels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_CHOICES.map((ch) => {
                    const sel = manualChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() =>
                          setManualChannels(
                            sel ? manualChannels.filter((c) => c !== ch) : [...manualChannels, ch]
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          sel
                            ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                            : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474]"
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setActiveMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#747474] hover:text-[#202124]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: AI Natural Language Campaign Planner Form */}
      {activeMode === "ai" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#202124]">Build Campaign with AI</h3>
              </div>
              <button
                type="button"
                onClick={() => !isGenerating && setActiveMode(null)}
                className="text-[#747474] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAIGenerate} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">
                  Describe Your DevRel Goal in Plain English *
                </label>
                <textarea
                  rows={3}
                  required
                  value={aiGoalDescription}
                  onChange={(e) => setAiGoalDescription(e.target.value)}
                  placeholder="I want to launch a developer community around our open-source AI framework and recruit our first 50 contributors..."
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-3 text-[#202124] focus:outline-none focus:border-[#FF6B35] leading-relaxed"
                />
                <p className="text-[11px] text-[#747474] mt-1">
                  You can provide just your goal description, or add optional details below for tailored precision.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Product / Technology (Optional)
                  </label>
                  <input
                    type="text"
                    value={aiProduct}
                    onChange={(e) => setAiProduct(e.target.value)}
                    placeholder="e.g. NextWasm SDK"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Target Audience (Optional)
                  </label>
                  <input
                    type="text"
                    value={aiAudience}
                    onChange={(e) => setAiAudience(e.target.value)}
                    placeholder="e.g. AI Engineers, Rust Devs"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Preferred Channels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_CHOICES.map((ch) => {
                    const sel = aiChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() =>
                          setAiChannels(
                            sel ? aiChannels.filter((c) => c !== ch) : [...aiChannels, ch]
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          sel
                            ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                            : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474]"
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isGenerating && (
                <div className="p-4 bg-[#FFF0EB] border border-[#FFD4C2] rounded-xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-[#FF6B35] animate-spin shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#FF6B35] block">
                      Groq AI Generating Strategy
                    </span>
                    <span className="text-[11px] text-[#747474]">
                      Drafting narrative pillars, tutorials, and content calendar...
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E8E5]">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setActiveMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-[#747474] hover:text-[#202124] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || (!aiGoalDescription.trim() && !aiProduct.trim())}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Plan for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL C: Review & Edit Before Saving AI-Generated Campaign */}
      {activeMode === "review" && generatedReviewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="text-sm font-bold text-[#202124]">Review Generated Campaign</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMode(null)}
                className="text-[#747474] hover:text-[#202124]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#747474] uppercase mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={generatedReviewCampaign.name}
                  onChange={(e) =>
                    setGeneratedReviewCampaign({
                      ...generatedReviewCampaign,
                      name: e.target.value,
                    })
                  }
                  className="w-full text-xs font-bold bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#747474] uppercase mb-1">
                  Strategy Narrative Summary
                </label>
                <textarea
                  rows={3}
                  value={generatedReviewCampaign.strategy.summary}
                  onChange={(e) =>
                    setGeneratedReviewCampaign({
                      ...generatedReviewCampaign,
                      strategy: {
                        ...generatedReviewCampaign.strategy,
                        summary: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-3 text-[#202124] focus:outline-none focus:border-[#FF6B35] leading-relaxed"
                />
              </div>

              <div>
                <span className="block text-xs font-bold text-[#747474] uppercase mb-2">
                  Generated Narrative Pillars
                </span>
                <div className="space-y-1.5">
                  {generatedReviewCampaign.strategy.narrativePillars.map((pillar, pIdx) => (
                    <div key={pIdx} className="p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] text-[#202124]">
                      {pillar}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#747474] uppercase mb-2">
                  Content Schedule Preview ({generatedReviewCampaign.contentCalendar.length} items)
                </span>
                <div className="space-y-1.5">
                  {generatedReviewCampaign.contentCalendar.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-2 rounded-lg bg-[#F7F7F5] border border-[#E8E8E5] flex justify-between">
                      <span className="font-semibold text-[#202124]">{item.title}</span>
                      <span className="text-[#FF6B35]">{item.channel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-[#FFF0EB] rounded-xl border border-[#FFD4C2] text-[#FF6B35] flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>Campaign is ready for review. Click Save & Launch to add it to your workspace.</span>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E8E5] flex items-center justify-end gap-3 bg-[#F7F7F5]">
              <button
                type="button"
                onClick={() => setActiveMode("ai")}
                className="px-4 py-2 text-xs font-semibold text-[#747474] hover:text-[#202124]"
              >
                Regenerate / Back
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSaveReview}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
              >
                <Check className="w-4 h-4" />
                <span>Save & Launch Campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
