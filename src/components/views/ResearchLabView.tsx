"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { generateAIResearch } from "@/lib/aiService";
import { ResearchReport } from "@/types";
import {
  Compass,
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Bookmark,
  Trash2,
  Layers,
  HelpCircle,
  Link,
  ShieldCheck,
} from "lucide-react";

export const ResearchLabView: React.FC = () => {
  const {
    researchReports,
    addResearchReport,
    deleteResearchReport,
    linkResearchToCampaign,
    campaigns,
    showToast,
  } = useDevRel();

  const [topic, setTopic] = useState("");
  const [objective, setObjective] = useState("");
  const [depth, setDepth] = useState<ResearchReport["depth"]>("Deep Ecosystem Analysis");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>(
    researchReports[0]?.id || ""
  );
  const [linkingCampaignId, setLinkingCampaignId] = useState<string>(
    campaigns[0]?.id || ""
  );

  const activeReport =
    researchReports.find((r) => r.id === selectedReportId) || researchReports[0] || null;

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const newReport = await generateAIResearch({
        topic: topic.trim(),
        objective: objective.trim() || `Analyze technical landscape and developer adoption for ${topic}.`,
        depth,
        onAlert: (msg, type) => showToast(msg, type),
      });

      addResearchReport(newReport);
      setSelectedReportId(newReport.id);
      setIsGenerating(false);
      setTopic("");
      setObjective("");
    } catch (err: any) {
      setIsGenerating(false);
      showToast(err?.message || "Failed to synthesize research with Groq", "error");
    }
  };

  const handleLinkToCampaign = (reportId: string) => {
    if (!linkingCampaignId) return;
    linkResearchToCampaign(reportId, linkingCampaignId);
  };

  return (
    <div className="space-y-6">
      {/* Research Query & Trigger Form */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202124]">Developer Research Lab</h2>
              <p className="text-xs text-[#747474]">
                Synthesize technical ecosystem trends, developer sentiment, benchmarks, and friction points.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#747474] bg-[#F7F7F5] px-2.5 py-1 rounded-lg border border-[#E8E8E5]">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Model Knowledge Grounding (Configure TAVILY_API_KEY in .env.local for Live Web Crawling)</span>
          </div>
        </div>

        <form onSubmit={handleStartResearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Research Topic or Ecosystem *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. WebAssembly in Serverless Runtimes, Local SLMs on WebGPU, Next.js Server Actions adoption"
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                Research Depth
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value as ResearchReport["depth"])}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35] transition"
              >
                <option value="Quick Brief">Quick Brief (Overview & Trends)</option>
                <option value="Deep Ecosystem Analysis">Deep Ecosystem Analysis</option>
                <option value="Competitive Landscape">Competitive Landscape & Alternatives</option>
                <option value="Technical Benchmark">Technical Benchmark Teardown</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1.5">
              Specific Research Objective (Optional)
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="e.g. Identify why teams reject alternative frameworks and discover top unaddressed pain points"
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#747474]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Synthesizes developer surveys, GitHub discussions, and reproducible runtime benchmarks.</span>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Ecosystem Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Research</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Two Columns: Report Library on left / Active Report on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Research Reports Library */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#202124] uppercase tracking-wider">
              Research Library ({researchReports.length})
            </span>
          </div>

          {researchReports.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-[#E8E8E5] text-center space-y-2">
              <Compass className="w-6 h-6 text-[#747474] mx-auto" />
              <p className="text-xs font-bold text-[#202124]">No research saved yet.</p>
              <p className="text-[11px] text-[#747474]">Start researching a technology or developer ecosystem above.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {researchReports.map((report) => {
              const isSelected = report.id === activeReport?.id;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-white border-[#FF6B35] shadow-xs"
                      : "bg-white border-[#E8E8E5] hover:border-[#FFD4C2]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                      {report.depth}
                    </span>
                    <span className="text-[10px] text-[#747474]">
                      {report.createdAt.split("T")[0]}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#202124] line-clamp-2 mb-1">
                    {report.topic}
                  </h4>
                  <p className="text-[11px] text-[#747474] line-clamp-2">
                    {report.objective}
                  </p>
                  {report.linkedCampaignId && (
                    <div className="mt-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      <span>Linked to Campaign</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Right Column: Deep Report Viewer */}
        <div className="lg:col-span-8">
          {activeReport ? (
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E8E8E5]">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                      {activeReport.depth}
                    </span>
                    <span className="text-xs text-[#747474]">
                      Created {activeReport.createdAt.split("T")[0]}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202124]">{activeReport.topic}</h3>
                  <p className="text-xs text-[#747474] mt-1">{activeReport.objective}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => deleteResearchReport(activeReport.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
                    title="Delete report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Link to Campaign Bar */}
              <div className="p-3.5 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-xs font-semibold text-[#202124]">
                    Link findings to campaign:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={linkingCampaignId}
                    onChange={(e) => setLinkingCampaignId(e.target.value)}
                    className="text-xs bg-white border border-[#E8E8E5] rounded-lg px-2.5 py-1.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleLinkToCampaign(activeReport.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-lg transition shrink-0"
                  >
                    Save to Campaign
                  </button>
                </div>
              </div>

              {/* Findings Organized into Themes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-3">
                  Thematic Ecosystem Findings
                </h4>
                <div className="space-y-4">
                  {activeReport.findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#FF6B35]">
                          Theme {idx + 1}: {finding.theme}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#202124] mb-1.5">
                        {finding.summary}
                      </p>
                      <p className="text-xs text-[#747474] leading-relaxed mb-3">
                        {finding.details}
                      </p>

                      {/* Sources & Citations */}
                      {finding.sources && finding.sources.length > 0 ? (
                        <div className="pt-2 border-t border-[#E8E8E5]/80 space-y-1">
                          <span className="text-[10px] font-semibold text-[#747474] uppercase block">
                            {activeReport.isDemo ? "Model-Generated References:" : "Verified Source References:"}
                          </span>
                          {finding.sources.map((src, sIdx) => (
                            <div key={sIdx} className="inline-flex items-center gap-1.5 text-[11px] text-[#FF6B35] mr-4">
                              <span>{src.title}</span>
                              <span className="text-[9px] bg-white px-1.5 py-0.2 rounded border border-[#E8E8E5] text-[#747474]">
                                {src.verified ? "Verified Link" : "Model Citation"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#E8E8E5]/80 text-[10px] text-[#747474]">
                          Synthesized from model training benchmarks and ecosystem survey data.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Insights & Recommended Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-[#E8E8E5] bg-white">
                  <h4 className="text-xs font-bold text-[#202124] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                    Key Architectural Insights
                  </h4>
                  <ul className="space-y-2">
                    {activeReport.keyInsights.map((ins, i) => (
                      <li key={i} className="text-xs text-[#202124] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] shrink-0 mt-1.5" />
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <h4 className="text-xs font-bold text-[#202124] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Recommended DevRel Actions
                  </h4>
                  <ul className="space-y-2">
                    {activeReport.recommendedActions.map((act, i) => (
                      <li key={i} className="text-xs text-[#202124] flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center space-y-3">
              <Compass className="w-8 h-8 text-[#FF6B35] mx-auto" />
              <h3 className="text-sm font-bold text-[#202124]">No research saved yet.</h3>
              <p className="text-xs text-[#747474] max-w-sm mx-auto">
                Start researching a technology or developer ecosystem using the synthesizer above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
