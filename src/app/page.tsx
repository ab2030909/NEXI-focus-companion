"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Rocket,
  Compass,
  FileCode2,
  CalendarDays,
  Send,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Users,
  Terminal,
  Code2,
  ExternalLink,
} from "lucide-react";

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const FAQS = [
    {
      q: "What is DevRelOS?",
      a: "DevRelOS is an AI-powered operating system built specifically for Developer Relations leaders, developer advocates, open-source maintainers, and developer marketing teams. It integrates ecosystem research, technical campaign planning, markdown content drafting, event operations, and community outreach in one unified workspace.",
    },
    {
      q: "Which LLM models power DevRelOS?",
      a: "DevRelOS uses Groq as its primary high-speed inference provider (configured with openai/gpt-oss-120b). It also features an autonomous intelligence mode that works out-of-the-box.",
    },
    {
      q: "Can I connect my real GitHub repositories?",
      a: "Yes! DevRelOS connects to the GitHub REST API to pull live stars, open issues, forks, watchers, releases, and repository descriptions directly into campaign planning and competitive research.",
    },
    {
      q: "How does the research grounding work?",
      a: "DevRelOS connects to live search APIs (Tavily or Serper) when configured to pull verified web citations. When search credentials are not provided, research is transparently tagged as model-generated without fabricating citations.",
    },
    {
      q: "Is there a free tier for open source maintainers?",
      a: "Yes. Our Free tier includes full campaign generation, content drafting, event management, and local database persistence at zero cost.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#202124] selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-[#E8E8E5] px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-[#E85923] transition">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#202124] text-base tracking-tight">DevRelOS</span>
              <span className="text-[10px] font-bold bg-[#FFF0EB] text-[#FF6B35] px-2 py-0.5 rounded-full border border-[#FFD4C2]">
                SaaS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#747474]">
            <a href="#features" className="hover:text-[#202124] transition">
              Product & Features
            </a>
            <a href="#workflow" className="hover:text-[#202124] transition">
              Workflow
            </a>
            <a href="#use-cases" className="hover:text-[#202124] transition">
              Use Cases
            </a>
            <a href="#pricing" className="hover:text-[#202124] transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#202124] transition">
              FAQ
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#202124] hover:text-[#FF6B35] px-3 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 px-4 py-2 rounded-xl shadow-xs shadow-[#FF6B35]/25 transition"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-20 px-6 lg:px-12 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E8E5] text-xs font-semibold text-[#747474] mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
          <span>The Modern Developer Relations Platform</span>
          <span className="text-[#FF6B35] font-bold">•</span>
          <span className="text-[#202124]">Powered by Groq GPT-OSS</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#202124] leading-[1.15] mb-6">
          Your Entire DevRel Workflow. <br className="hidden sm:inline" />
          <span className="text-[#FF6B35]">One AI-Powered Workspace.</span>
        </h1>

        <p className="text-sm sm:text-base text-[#747474] max-w-2xl mx-auto leading-relaxed mb-8">
          DevRelOS helps developer advocacy teams, open-source maintainers, and developer tools
          research ecosystems, plan campaigns, create technical tutorials, manage events, and measure
          developer impact.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 px-6 py-3 rounded-xl shadow-md shadow-[#FF6B35]/20 transition"
          >
            <span>Start Building for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/app"
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-semibold text-[#202124] bg-white hover:bg-[#ECECE9] border border-[#E8E8E5] px-6 py-3 rounded-xl shadow-xs transition"
          >
            <span>Explore Demo Workspace</span>
            <ExternalLink className="w-4 h-4 text-[#747474]" />
          </Link>
        </div>

        {/* 3. PRODUCT DASHBOARD PREVIEW MOCKUP */}
        <div className="relative rounded-2xl bg-white p-3 md:p-6 border border-[#E8E8E5] shadow-2xl text-left max-w-5xl mx-auto overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E8E5] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-[#747474] ml-2">app.devrelos.com/overview</span>
            </div>
            <span className="text-[11px] font-semibold bg-[#FFF0EB] text-[#FF6B35] px-2.5 py-0.5 rounded-full border border-[#FFD4C2]">
              Live Workspace Preview
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E8E8E5]">
              <span className="text-[10px] text-[#747474] font-bold uppercase">Active Campaigns</span>
              <p className="text-xl font-bold text-[#202124] mt-1">3 Launches</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+1 this cycle</span>
            </div>
            <div className="bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E8E8E5]">
              <span className="text-[10px] text-[#747474] font-bold uppercase">Developer Impressions</span>
              <p className="text-xl font-bold text-[#202124] mt-1">76,400</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+34.2% reach</span>
            </div>
            <div className="bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E8E8E5]">
              <span className="text-[10px] text-[#747474] font-bold uppercase">Events & Meetups</span>
              <p className="text-xl font-bold text-[#202124] mt-1">14 Organized</p>
              <span className="text-[10px] text-emerald-600 font-semibold">920 total RSVPs</span>
            </div>
            <div className="bg-[#F7F7F5] p-3.5 rounded-xl border border-[#E8E8E5]">
              <span className="text-[10px] text-[#747474] font-bold uppercase">Community PRs</span>
              <p className="text-xl font-bold text-[#202124] mt-1">94 Merged</p>
              <span className="text-[10px] text-emerald-600 font-semibold">81% contributor accept</span>
            </div>
          </div>

          <div className="bg-[#F7F7F5] p-4 rounded-xl border border-[#E8E8E5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white">
                <Rocket className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#202124]">VectorSearch v2.5 Launch & Edge SDK</p>
                <p className="text-[11px] text-[#747474]">Multi-channel campaign: X, Hacker News, Dev.to, GitHub</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#FF6B35] bg-white px-3 py-1 rounded-lg border border-[#E8E8E5]">
              78% Completed
            </span>
          </div>
        </div>
      </section>

      {/* 4. FEATURE HIGHLIGHT SECTION */}
      <section id="features" className="py-20 px-6 lg:px-12 bg-white border-y border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
              Platform Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#202124] mt-2 tracking-tight">
              Purpose-built tools for technical community builders
            </h2>
            <p className="text-xs sm:text-sm text-[#747474] mt-2">
              Everything you need to engage engineers, from deep ecosystem analysis to code-first tutorials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <Rocket className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">AI Campaign Builder</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Generate structured, multi-channel developer activation campaigns including personas, narrative pillars, content schedules, and task checklists.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">Developer Intelligence Lab</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Conduct deep ecosystem research, analyze developer sentiment, benchmark runtime competitors, and export actionable strategic recommendations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">Technical Content Studio</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Produce code tutorials, X threads, LinkedIn posts, and product release notes in clean Markdown with real code examples and live preview.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">Events & Community Ops</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Organize meetups, workshops, and hackathons with dual list/timeline roadmaps, session agendas, speaker confirmation tracking, and post-event AI recaps.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">Outreach CRM Pipeline</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Manage relationships with conference speakers, sponsors, and open-source maintainers with AI-assisted personalized pitch drafting.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#F7F7F5] p-6 rounded-2xl border border-[#E8E8E5] hover:border-[#FFD4C2] transition">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] text-[#FF6B35] flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#202124] mb-2">Impact Analytics & Insights</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                Interactive telemetry visualization for developer impressions, quickstart clones, event conversions, and AI strategic recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW SECTION */}
      <section id="workflow" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
            The DevRel Flywheel
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#202124] mt-2 tracking-tight">
            From research to measurable community impact
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: "01", title: "Research", desc: "Discover developer pain points, watering holes, and ecosystem benchmark data." },
            { step: "02", title: "Plan", desc: "Synthesize campaign strategy, narrative pillars, and multi-channel schedules." },
            { step: "03", title: "Create", desc: "Draft technical tutorials, release threads, and code-rich documentation." },
            { step: "04", title: "Execute", desc: "Host hack nights, manage speaker pipelines, and coordinate contributor PRs." },
            { step: "05", title: "Measure", desc: "Analyze SDK adoption velocity, event turnout, and strategic AI suggestions." },
          ].map((item) => (
            <div key={item.step} className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-xs relative">
              <span className="text-xs font-bold text-[#FF6B35] bg-[#FFF0EB] px-2 py-0.5 rounded-md border border-[#FFD4C2]">
                Step {item.step}
              </span>
              <h4 className="text-base font-bold text-[#202124] mt-3 mb-1">{item.title}</h4>
              <p className="text-xs text-[#747474] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TARGET PERSONAS */}
      <section id="use-cases" className="py-20 px-6 lg:px-12 bg-white border-y border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
              Tailored For You
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#202124] mt-2 tracking-tight">
              Built for every corner of developer relations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <div className="text-lg font-bold text-[#202124] mb-2">Developer Tool Companies</div>
              <p className="text-xs text-[#747474] leading-relaxed">
                Launch major versions, track SDK clones, and produce reproducible benchmarks that win developer trust.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <div className="text-lg font-bold text-[#202124] mb-2">DevRel Teams & Advocates</div>
              <p className="text-xs text-[#747474] leading-relaxed">
                Coordinate multi-author technical calendars, conference speaker tracking, and community office hours.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <div className="text-lg font-bold text-[#202124] mb-2">Open Source Maintainers</div>
              <p className="text-xs text-[#747474] leading-relaxed">
                Onboard contributors with curated issue guides, run contributor sprints, and draft transparent changelogs.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-[#E8E8E5]">
              <div className="text-lg font-bold text-[#202124] mb-2">Community Organizers</div>
              <p className="text-xs text-[#747474] leading-relaxed">
                Plan hackathons and meetups with built-in agenda builders, sponsor management, and automated attendee recaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
            Transparent Pricing
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#202124] mt-2 tracking-tight">
            Start free, scale with your ecosystem
          </h2>
          <p className="text-xs text-[#747474] mt-2">
            No credit card required. Free tier is available immediately for independent advocates and open source projects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white p-6 rounded-2xl border-2 border-[#FF6B35] shadow-lg flex flex-col justify-between relative">
            <span className="absolute -top-3 left-6 text-[10px] font-bold bg-[#FF6B35] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Available Now
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#202124]">Community & Open Source</h3>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#202124]">$0</span>
                <span className="text-xs text-[#747474]">/ forever</span>
              </div>
              <p className="text-xs text-[#747474] mb-6">
                Full access for developer advocates, open-source maintainers, and community creators.
              </p>
              <ul className="space-y-2.5 text-xs text-[#202124]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                  <span>AI Campaign Builder & Strategy Generator</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                  <span>Technical Content Studio (8 formats)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                  <span>Events & Meetup Management with Agendas</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                  <span>Speaker & Sponsor Outreach CRM</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
                  <span>Local Server Persistence & GitHub Analysis</span>
                </li>
              </ul>
            </div>
            <Link
              href="/signup"
              className="mt-8 w-full text-center py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition shadow-xs"
            >
              Start for Free
            </Link>
          </div>

          {/* Pro Tier (Placeholder) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] flex flex-col justify-between opacity-85">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#202124]">DevRel Team Pro</h3>
                <span className="text-[10px] bg-[#F7F7F5] text-[#747474] font-semibold px-2 py-0.5 rounded border border-[#E8E8E5]">
                  Coming Soon
                </span>
              </div>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#202124]">$79</span>
                <span className="text-xs text-[#747474]">/ seat / month</span>
              </div>
              <p className="text-xs text-[#747474] mb-6">
                For scaling developer tool companies with dedicated advocate teams.
              </p>
              <ul className="space-y-2.5 text-xs text-[#747474]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Multi-member shared workspaces</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Live web crawler research grounding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Discord & Slack automated telemetry hooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Priority Groq GPT-OSS inference pipeline</span>
                </li>
              </ul>
            </div>
            <button
              disabled
              className="mt-8 w-full text-center py-2.5 text-xs font-semibold text-[#747474] bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] cursor-not-allowed"
            >
              Join Waitlist
            </button>
          </div>

          {/* Enterprise Tier (Placeholder) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] flex flex-col justify-between opacity-85">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#202124]">Enterprise Ecosystem</h3>
                <span className="text-[10px] bg-[#F7F7F5] text-[#747474] font-semibold px-2 py-0.5 rounded border border-[#E8E8E5]">
                  Custom
                </span>
              </div>
              <div className="mt-4 mb-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#202124]">Custom</span>
              </div>
              <p className="text-xs text-[#747474] mb-6">
                Custom contracts, single tenant deployments, and bespoke telemetry connectors.
              </p>
              <ul className="space-y-2.5 text-xs text-[#747474]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Dedicated cloud instance / self-hosting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>Custom LLM fine-tuning & prompt governance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#747474]" />
                  <span>SAML / SSO & enterprise access policies</span>
                </li>
              </ul>
            </div>
            <button
              disabled
              className="mt-8 w-full text-center py-2.5 text-xs font-semibold text-[#747474] bg-[#F7F7F5] rounded-xl border border-[#E8E8E5] cursor-not-allowed"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 px-6 lg:px-12 bg-white border-t border-[#E8E8E5]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
              Got Questions?
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202124] mt-2">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E8E8E5] bg-[#F7F7F5] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-[#202124]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#747474] transition-transform ${
                      activeFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#747474] leading-relaxed border-t border-[#E8E8E5] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-white border-t border-[#E8E8E5] py-12 px-6 lg:px-12 text-xs text-[#747474]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold">
              <Zap className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <span className="font-bold text-[#202124]">DevRelOS</span>
            <span>• Built for developer advocates and open source teams.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-[#202124] transition">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-[#202124] transition">
              Get Started
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#202124] transition flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
