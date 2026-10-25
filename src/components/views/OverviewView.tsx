"use client";

import React from "react";
import { useDevRel } from "@/context/DevRelContext";
import {
  Rocket,
  Calendar,
  FileCode2,
  Users,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  Send,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { FirstTimeWelcome } from "@/components/FirstTimeWelcome";

const PERFORMANCE_DATA = [
  { date: "Oct 1", reach: 12400, clones: 420 },
  { date: "Oct 5", reach: 18900, clones: 680 },
  { date: "Oct 9", reach: 24300, clones: 890 },
  { date: "Oct 13", reach: 29800, clones: 1240 },
  { date: "Oct 17", reach: 35100, clones: 1680 },
  { date: "Oct 21", reach: 48900, clones: 2150 },
  { date: "Oct 25", reach: 64200, clones: 2840 },
];

const CHANNEL_DISTRIBUTION = [
  { channel: "GitHub", engagement: 84 },
  { channel: "X / Twitter", engagement: 68 },
  { channel: "Hacker News", engagement: 92 },
  { channel: "Dev.to", engagement: 55 },
  { channel: "Discord", engagement: 74 },
];

export const OverviewView: React.FC = () => {
  const {
    campaigns,
    events,
    contentDrafts,
    contacts,
    agentActivities,
    setActiveTab,
    setIsNewCampaignOpen,
    setSelectedCampaignId,
  } = useDevRel();

  const activeCampaigns = campaigns.filter((c) => c.status === "Active");
  const upcomingEvents = events.filter((e) => e.status === "Upcoming");

  if (campaigns.length === 0) {
    return <FirstTimeWelcome />;
  }

  return (
    <div className="space-y-6">
      {/* Productivity Banner & Welcome */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
              Developer Relations Workspace
            </span>
            <span className="text-xs text-[#747474]">•</span>
            <span className="text-xs text-[#747474]">October 2026 Cycle</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#202124]">
            Welcome back, Alex
          </h2>
          <p className="text-xs md:text-sm text-[#747474] mt-1 max-w-2xl leading-relaxed">
            You have <span className="font-semibold text-[#202124]">{activeCampaigns.length} active campaigns</span>,{" "}
            <span className="font-semibold text-[#202124]">{upcomingEvents.length} upcoming events</span>, and{" "}
            <span className="font-semibold text-[#202124]">94 merged community PRs</span> this cycle. Overall developer engagement is up{" "}
            <span className="font-semibold text-emerald-600">+28.4%</span>.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Campaign</span>
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-xl border border-[#E8E8E5] transition"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#747474]" />
            <span>Generate Content</span>
          </button>
          <button
            onClick={() => setActiveTab("research")}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-xl border border-[#E8E8E5] transition"
          >
            <Compass className="w-3.5 h-3.5 text-[#747474]" />
            <span>Research Lab</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => setActiveTab("campaigns")}
          className="bg-white p-5 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#747474]">Active Campaigns</span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#FF6B35] flex items-center justify-center group-hover:scale-105 transition">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#202124]">{activeCampaigns.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +1 this week
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1.5">Across 8 developer channels</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => setActiveTab("events")}
          className="bg-white p-5 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#747474]">Events Organized</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#202124]">{events.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              920 RSVPs
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1.5">2 upcoming this month</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => setActiveTab("content")}
          className="bg-white p-5 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#747474]">Content Pieces</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#202124]">{contentDrafts.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +4 drafts
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1.5">Tutorials, posts & changelogs</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => setActiveTab("outreach")}
          className="bg-white p-5 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#747474]">Community Pipeline</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#202124]">{contacts.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              80% accept
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1.5">Speakers, sponsors & champions</p>
        </div>
      </div>

      {/* Performance Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart: Developer Reach & Clones */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Campaign Telemetry & Reach</h3>
              <p className="text-xs text-[#747474]">
                Total impressions vs SDK clones across 30 days (Sample Data)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                <span className="text-[#747474]">Reach</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#202124]" />
                <span className="text-[#747474]">SDK Clones</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#747474" fontSize={11} tickLine={false} />
                <YAxis stroke="#747474" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#202124",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    border: "none",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reach"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReach)"
                />
                <Area
                  type="monotone"
                  dataKey="clones"
                  stroke="#202124"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Channel Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Channel Resonance</h3>
              <p className="text-xs text-[#747474]">Engagement index by developer hub</p>
            </div>
            <span className="text-[10px] font-semibold bg-[#F7F7F5] text-[#747474] px-2 py-0.5 rounded-full border border-[#E8E8E5]">
              Realtime
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHANNEL_DISTRIBUTION} layout="vertical">
                <XAxis type="number" stroke="#747474" fontSize={11} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="channel" type="category" stroke="#747474" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#202124",
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    border: "none",
                  }}
                />
                <Bar dataKey="engagement" fill="#FF6B35" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Agent Activity & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Agent Activity */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-sm font-bold text-[#202124]">Autonomous Agent Activity</h3>
            </div>
            <span className="text-xs text-[#747474]">Last 24 hours</span>
          </div>

          <div className="space-y-3">
            {agentActivities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]/70 hover:bg-[#ECECE9] transition"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#202124] truncate">
                      {act.action}
                    </p>
                    <p className="text-[11px] text-[#747474] truncate">{act.target}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#747474] shrink-0 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {act.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events & Deadlines */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-sm font-bold text-[#202124]">Upcoming Events & Key Dates</h3>
            </div>
            <button
              onClick={() => setActiveTab("events")}
              className="text-xs font-semibold text-[#FF6B35] hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {events.slice(0, 3).map((evt) => (
              <div
                key={evt.id}
                onClick={() => setActiveTab("events")}
                className="p-3.5 rounded-xl border border-[#E8E8E5] hover:border-[#FF6B35] hover:bg-[#FFF0EB]/30 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7F7F5] text-[#202124] border border-[#E8E8E5]">
                      {evt.type}
                    </span>
                    <span className="text-xs text-[#747474]">{evt.date}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#202124] truncate">{evt.title}</p>
                  <p className="text-[11px] text-[#747474] truncate">{evt.venueOrLink}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#202124]">
                    {evt.registeredCount} / {evt.registrationCap}
                  </span>
                  <p className="text-[10px] text-[#747474]">Registered</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
