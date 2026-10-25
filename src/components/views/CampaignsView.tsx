"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { Campaign, CampaignTask } from "@/types";
import {
  Rocket,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  Users,
  Target,
  FileText,
  Share2,
  Mail,
  Check,
  BarChart,
  BookOpen,
} from "lucide-react";

export const CampaignsView: React.FC = () => {
  const {
    campaigns,
    selectedCampaign,
    selectedCampaignId,
    setSelectedCampaignId,
    setIsNewCampaignOpen,
    duplicateCampaign,
    deleteCampaign,
    toggleCampaignTask,
    updateCampaign,
    showToast,
  } = useDevRel();

  const [activeTab, setActiveTab] = useState<
    "overview" | "strategy" | "content" | "tasks" | "results"
  >("overview");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<CampaignTask["category"]>("Content");

  if (campaigns.length === 0 || !selectedCampaign) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] mx-auto shadow-xs">
          <Rocket className="w-6 h-6 text-[#FF6B35]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#202124]">No campaigns yet.</h3>
          <p className="text-xs text-[#747474] mt-1">
            Create your first campaign or ask AI to plan one for you.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
          >
            Create Your First Campaign
          </button>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: CampaignTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
      completed: false,
      assignedTo: "Alex Rivera",
    };

    updateCampaign({
      ...selectedCampaign,
      tasks: [...selectedCampaign.tasks, newTask],
    });
    setNewTaskTitle("");
    showToast("Task added to checklist.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Campaign Selector & Toolbar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E8E8E5] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Campaign dropdown selector */}
          <div className="relative">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="text-sm font-bold text-[#202124] bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2 pr-8 focus:outline-none focus:border-[#FF6B35] transition cursor-pointer appearance-none"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold bg-[#FFF0EB] text-[#FF6B35] px-2.5 py-1 rounded-full border border-[#FFD4C2]">
              {selectedCampaign.status}
            </span>
            <span className="text-xs text-[#747474] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {selectedCampaign.duration}
            </span>
            {selectedCampaign.budget && (
              <span className="text-xs text-[#747474] font-medium">
                • Budget: {selectedCampaign.budget}
              </span>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => duplicateCampaign(selectedCampaign.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-xl border border-[#E8E8E5] transition"
            title="Duplicate campaign"
          >
            <Copy className="w-3.5 h-3.5 text-[#747474]" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
          <button
            onClick={() => deleteCampaign(selectedCampaign.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition"
            title="Delete campaign"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-[#E8E8E5] gap-2 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "strategy", label: "Strategy & Audience", icon: Users },
          { id: "content", label: "Content & Drafts", icon: FileText },
          { id: "tasks", label: "Task Checklist", icon: CheckCircle2, badge: selectedCampaign.tasks.filter((t) => !t.completed).length },
          { id: "results", label: "KPIs & Results", icon: BarChart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? "border-[#FF6B35] text-[#FF6B35]"
                  : "border-transparent text-[#747474] hover:text-[#202124]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#FFF0EB] text-[#FF6B35]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Executive Strategy Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
                Campaign Strategy & Narrative
              </span>
              <span className="text-xs text-[#747474]">Target: {selectedCampaign.toolOrProject}</span>
            </div>
            <p className="text-sm text-[#202124] leading-relaxed mb-6 font-medium">
              {selectedCampaign.strategy.summary}
            </p>

            {/* Narrative Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCampaign.strategy.narrativePillars.map((pillar, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]">
                  <span className="text-[11px] font-bold text-[#FF6B35] block mb-1">
                    Pillar 0{i + 1}
                  </span>
                  <p className="text-xs text-[#202124] font-medium leading-relaxed">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Differentiators & Target Audience Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" />
                Key Technical Differentiators
              </h3>
              <ul className="space-y-2.5">
                {selectedCampaign.strategy.differentiators.map((diff, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-[#202124]">
                    <Check className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FF6B35]" />
                Target Audience & Objective
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] text-[#747474] font-semibold uppercase">Audience</span>
                  <p className="text-xs font-semibold text-[#202124]">{selectedCampaign.targetAudience}</p>
                </div>
                <div>
                  <span className="text-[11px] text-[#747474] font-semibold uppercase">Primary Goal</span>
                  <p className="text-xs font-semibold text-[#202124]">{selectedCampaign.objective}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Channels Used */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8E8E5] shadow-xs flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs font-semibold text-[#747474]">Active Developer Channels:</span>
            <div className="flex flex-wrap gap-2">
              {selectedCampaign.channels.map((ch) => (
                <span
                  key={ch}
                  className="text-xs font-medium bg-[#F7F7F5] text-[#202124] px-3 py-1 rounded-lg border border-[#E8E8E5]"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRATEGY & AUDIENCE */}
      {activeTab === "strategy" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personas */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6B35]" />
                Developer Personas
              </h3>
              <div className="space-y-2.5">
                {selectedCampaign.audienceProfile.personas.map((persona, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[#F7F7F5] text-xs font-medium text-[#202124] border border-[#E8E8E5]">
                    {persona}
                  </div>
                ))}
              </div>
            </div>

            {/* Pain Points */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-500" />
                Key Developer Pain Points
              </h3>
              <div className="space-y-2.5">
                {selectedCampaign.audienceProfile.painPoints.map((pain, i) => (
                  <div key={i} className="p-3 rounded-xl bg-red-50/50 text-xs font-medium text-[#202124] border border-red-100">
                    {pain}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Watering Holes & Formats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FF6B35]" />
                Community Watering Holes
              </h3>
              <ul className="space-y-2">
                {selectedCampaign.audienceProfile.wateringHoles.map((wh, i) => (
                  <li key={i} className="text-xs text-[#202124] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                    {wh}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
              <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                Preferred Content Formats
              </h3>
              <ul className="space-y-2">
                {selectedCampaign.audienceProfile.preferredFormats.map((fmt, i) => (
                  <li key={i} className="text-xs text-[#202124] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#202124]" />
                    {fmt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Key Messaging */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#202124] mb-3">Core Narrative & Messaging Pillars</h3>
            <div className="p-4 bg-[#FFF0EB] rounded-xl border border-[#FFD4C2] mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF6B35]">
                Primary Launch Headline
              </span>
              <p className="text-base font-bold text-[#202124] mt-1">
                {selectedCampaign.keyMessaging.primaryHeadline}
              </p>
            </div>
            <p className="text-xs text-[#747474] leading-relaxed mb-4">
              <span className="font-semibold text-[#202124]">Elevator Pitch: </span>
              {selectedCampaign.keyMessaging.elevatorPitch}
            </p>
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#747474] uppercase">Proof Points:</span>
              {selectedCampaign.keyMessaging.proofPoints.map((pp, i) => (
                <div key={i} className="text-xs text-[#202124] flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B35]" />
                  {pp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT & DRAFTS */}
      {activeTab === "content" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Content Calendar */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B35]" />
              Campaign Content Schedule
            </h3>
            <div className="space-y-3">
              {selectedCampaign.contentCalendar.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#FF6B35] bg-[#FFF0EB] px-2.5 py-1 rounded-lg border border-[#FFD4C2]">
                      {item.day}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#202124]">{item.title}</p>
                      <p className="text-[11px] text-[#747474]">
                        {item.channel} • {item.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-[#747474] bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] self-start sm:self-auto">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Drafts */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#FF6B35]" />
              AI Social Media Drafts
            </h3>
            <div className="space-y-4">
              {selectedCampaign.socialDrafts.map((draft, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#202124]">{draft.platform}</span>
                    <button
                      onClick={() => handleCopy(draft.content, `social-${i}`)}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#FF6B35] hover:text-[#E85923] bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] transition"
                    >
                      {copiedIndex === `social-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === `social-${i}` ? "Copied" : "Copy Draft"}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-[#202124] font-sans whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-[#E8E8E5]">
                    {draft.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Outreach Pitch Drafts */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#202124] mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FF6B35]" />
              Ecosystem Outreach Pitch
            </h3>
            <div className="space-y-4">
              {selectedCampaign.outreachDrafts.map((od, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#E8E8E5] bg-[#F7F7F5]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#202124]">
                      Target: {od.recipientType}
                    </span>
                    <button
                      onClick={() => handleCopy(`Subject: ${od.subject}\n\n${od.body}`, `outreach-${i}`)}
                      className="flex items-center gap-1 text-[11px] font-medium text-[#FF6B35] bg-white px-2.5 py-1 rounded-lg border border-[#E8E8E5] transition"
                    >
                      {copiedIndex === `outreach-${i}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedIndex === `outreach-${i}` ? "Copied" : "Copy Email"}</span>
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#202124] mb-2">
                    Subject: {od.subject}
                  </p>
                  <pre className="text-xs text-[#202124] font-sans whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-[#E8E8E5]">
                    {od.body}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TASKS CHECKLIST */}
      {activeTab === "tasks" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#202124]">Campaign Execution Checklist</h3>
                <p className="text-xs text-[#747474]">
                  Track required deliverables for this developer initiative.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#FF6B35]">
                {selectedCampaign.tasks.filter((t) => t.completed).length} / {selectedCampaign.tasks.length} Completed
              </span>
            </div>

            {/* Task list */}
            <div className="space-y-2.5 mb-6">
              {selectedCampaign.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleCampaignTask(selectedCampaign.id, task.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                    task.completed
                      ? "bg-[#F7F7F5] border-[#E8E8E5] opacity-75"
                      : "bg-white border-[#E8E8E5] hover:border-[#FF6B35]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#747474] shrink-0" />
                    )}
                    <span
                      className={`text-xs font-medium truncate ${
                        task.completed ? "line-through text-[#747474]" : "text-[#202124]"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold bg-[#F7F7F5] text-[#747474] px-2 py-0.5 rounded-md border border-[#E8E8E5]">
                      {task.category}
                    </span>
                    <span className="text-[11px] text-[#747474]">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-[#E8E8E5]">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new deliverable or task..."
                className="flex-1 text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              />
              <select
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value as CampaignTask["category"])}
                className="text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              >
                <option value="Strategy">Strategy</option>
                <option value="Content">Content</option>
                <option value="Outreach">Outreach</option>
                <option value="Event">Event</option>
                <option value="Community">Community</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition shrink-0"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: KPIS & RESULTS */}
      {activeTab === "results" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedCampaign.kpis.map((kpi, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
                <span className="text-xs font-semibold text-[#747474] block mb-2">{kpi.name}</span>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xl font-bold text-[#202124]">{kpi.current}</span>
                  <span className="text-xs text-[#747474]">Target: {kpi.target}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-[#F7F7F5] h-2 rounded-full overflow-hidden border border-[#E8E8E5]">
                  <div
                    className="bg-[#FF6B35] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi.progressPercent, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#747474] mt-2 block font-medium">
                  {kpi.progressPercent}% of goal reached
                </span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
            <h3 className="text-sm font-bold text-[#202124] mb-2">Campaign Impact Analysis</h3>
            <p className="text-xs text-[#747474] leading-relaxed">
              Early telemetry signals show high conversion from the Show HN submission and the Cloudflare Workers tutorial.
              Key recommended follow-up action: publish a short 2-minute video walkthrough of the edge WASM index setup to capture
              remaining top-of-funnel developers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
