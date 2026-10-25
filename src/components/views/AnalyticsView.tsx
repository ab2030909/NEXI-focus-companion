"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  Lightbulb,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const TIME_RANGES = ["Last 7 Days", "Last 30 Days", "Last Quarter", "Year to Date"];

const REACH_PERFORMANCE_30D = [
  { day: "Oct 1", impressions: 14200, signups: 320, activeKeys: 180 },
  { day: "Oct 6", impressions: 22400, signups: 540, activeKeys: 310 },
  { day: "Oct 11", impressions: 31800, signups: 820, activeKeys: 490 },
  { day: "Oct 16", impressions: 42500, signups: 1190, activeKeys: 740 },
  { day: "Oct 21", impressions: 58900, signups: 1680, activeKeys: 1120 },
  { day: "Oct 26", impressions: 76400, signups: 2240, activeKeys: 1540 },
];

const EVENT_CONVERSION_DATA = [
  { event: "AI Summit", rsvp: 842, attended: 690 },
  { event: "Rust Hack Night", rsvp: 78, attended: 72 },
  { event: "Vector Office Hrs", rsvp: 190, attended: 142 },
  { event: "Edge WASM Lab", rsvp: 310, attended: 260 },
];

const COMMUNITY_GROWTH = [
  { month: "May", stars: 3200, discord: 1400 },
  { month: "Jun", stars: 4100, discord: 1900 },
  { month: "Jul", stars: 5200, discord: 2600 },
  { month: "Aug", stars: 6100, discord: 3400 },
  { month: "Sep", stars: 7200, discord: 4100 },
  { month: "Oct", stars: 8900, discord: 5200 },
];

const CONTENT_ENGAGEMENT_PIE = [
  { name: "Technical Tutorials", value: 42, color: "#FF6B35" },
  { name: "X Threads & Posts", value: 28, color: "#202124" },
  { name: "Show HN Discussions", value: 18, color: "#10B981" },
  { name: "LinkedIn Leadership", value: 12, color: "#6366F1" },
];

export const AnalyticsView: React.FC = () => {
  const { campaigns, events, contentDrafts, showToast, setActiveTab } = useDevRel();
  const [selectedRange, setSelectedRange] = useState("Last 30 Days");

  if (campaigns.length === 0 && events.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-[#E8E8E5] text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] mx-auto shadow-xs">
          <BarChart3 className="w-6 h-6 text-[#FF6B35]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#202124]">Your analytics will appear here once you have real activity.</h3>
          <p className="text-xs text-[#747474] mt-1 max-w-sm mx-auto">
            Once you launch your first campaign or organize an event, real developer impressions and attendance metrics will display here.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setActiveTab("campaigns")}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl shadow-xs transition"
          >
            Launch Your First Campaign
          </button>
        </div>
      </div>
    );
  }
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [recommendations, setRecommendations] = useState([
    {
      category: "Conversion Opportunity",
      headline: "Technical tutorials convert 42% higher than standard blog posts.",
      detail: "Focus next sprint on 2 code-first guides: Cloudflare Workers edge caching and Bun runtime benchmarks.",
    },
    {
      category: "Event Optimization",
      headline: "In-person hack nights maintain 92% attendance vs 74% virtual webinars.",
      detail: "Expand regional SF and NYC hands-on hack nights to capitalize on higher retention.",
    },
    {
      category: "Outreach Funnel",
      headline: "Speaker acceptance rate is 80% when initial pitch includes sample abstract.",
      detail: "Keep using the AI Outreach draft generator with the customized talk angle for keynote invites.",
    },
  ]);

  const handleRefreshRecommendations = async () => {
    setIsRefreshingRecs(true);
    try {
      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeRange: selectedRange,
          impressions: "76,400",
          signups: "2,240",
          eventsCount: String(events.length),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.recommendations) {
        throw new Error(data.error || "Failed to generate recommendations with Groq.");
      }
      setRecommendations(data.recommendations);
      showToast(`Refreshed recommendations with Groq (${data.model})!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Failed to generate recommendations with Groq", "error");
    } finally {
      setIsRefreshingRecs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-[#FFF0EB] border border-[#FFD4C2] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#FF6B35] shrink-0" />
          <span className="text-[#202124] font-medium">
            Displaying simulated developer telemetry data. Connect GitHub, Discord, and Google Analytics in the{" "}
            <span className="font-bold">Integrations</span> tab to stream live metrics.
          </span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                selectedRange === range
                  ? "bg-[#FF6B35] text-white shadow-xs"
                  : "bg-white text-[#747474] hover:text-[#202124] border border-[#FFD4C2]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <span className="text-xs font-semibold text-[#747474]">Total Developer Impressions</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#202124]">76,400</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +34.2%
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1">Across X, HN, Dev.to & GitHub</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <span className="text-xs font-semibold text-[#747474]">SDK & Quickstart Installs</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#202124]">2,240</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +28.0%
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1">4.8% conversion from docs</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <span className="text-xs font-semibold text-[#747474]">Event Attendance Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#202124]">81.4%</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +6.2%
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1">1,164 total attendees across 4 events</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <span className="text-xs font-semibold text-[#747474]">Active Community Devs</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-[#202124]">5,200</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +1,100 MoM
            </span>
          </div>
          <p className="text-[11px] text-[#747474] mt-1">Discord stage & GitHub contributors</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Area Chart: Performance Over Time */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-xs lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Developer Engagement Velocity</h3>
              <p className="text-xs text-[#747474]">
                Impressions, Signups, and Active API Keys over time
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                <span className="text-[#747474]">Impressions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#202124]" />
                <span className="text-[#747474]">Signups</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REACH_PERFORMANCE_30D}>
                <defs>
                  <linearGradient id="areaImpressions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#747474" fontSize={11} tickLine={false} />
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
                  dataKey="impressions"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#areaImpressions)"
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#202124"
                  strokeWidth={2}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Content Engagement Share */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#202124] mb-1">Content Resonance</h3>
            <p className="text-xs text-[#747474] mb-4">Traffic by format & channel</p>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CONTENT_ENGAGEMENT_PIE}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {CONTENT_ENGAGEMENT_PIE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#202124",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                      border: "none",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-[#E8E8E5]">
            {CONTENT_ENGAGEMENT_PIE.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[#747474]">{item.name}</span>
                </div>
                <span className="font-bold text-[#202124]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Charts Row: Event Conversion & Community Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Registrations vs Attendance */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Event Registrations vs Turnout</h3>
              <p className="text-xs text-[#747474]">RSVP drop-off and attendance comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E8E8E5]" />
                <span className="text-[#747474]">RSVP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" />
                <span className="text-[#747474]">Attended</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={EVENT_CONVERSION_DATA}>
                <XAxis dataKey="event" stroke="#747474" fontSize={11} tickLine={false} />
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
                <Bar dataKey="rsvp" fill="#E8E8E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="attended" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Community Growth (Stars & Discord) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#202124]">Community Ecosystem Growth</h3>
              <p className="text-xs text-[#747474]">GitHub Stars vs Discord Members (6 Months)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#202124]" />
                <span className="text-[#747474]">GitHub Stars</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                <span className="text-[#747474]">Discord</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={COMMUNITY_GROWTH}>
                <XAxis dataKey="month" stroke="#747474" fontSize={11} tickLine={false} />
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
                  dataKey="stars"
                  stroke="#202124"
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#202124"
                />
                <Area
                  type="monotone"
                  dataKey="discord"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={0.1}
                  fill="#6366F1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic AI Recommendations Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-[#202124]">
              AI Strategic Recommendations for DevRel Team
            </h3>
          </div>

          <button
            onClick={handleRefreshRecommendations}
            disabled={isRefreshingRecs}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRefreshingRecs ? "Generating..." : "Refresh with Groq"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <span className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider block mb-1">
                {rec.category}
              </span>
              <p className="text-xs font-semibold text-[#202124] mb-1">
                {rec.headline}
              </p>
              <p className="text-[11px] text-[#747474] leading-relaxed">
                {rec.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
