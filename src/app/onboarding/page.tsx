"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, Check, Loader2, Sparkles, Building, Target, Users } from "lucide-react";

const SUGGESTED_ROLES = [
  "Developer Advocate",
  "Head of Developer Relations",
  "Community Manager",
  "Open-Source Maintainer",
  "Developer Marketing Lead",
  "Independent Developer",
];

const SUGGESTED_GOALS = [
  "Launch Developer Tool & Grow GitHub Stars",
  "Onboard & Mentor Open Source Contributors",
  "Accelerate SDK Adoption & Production Integrations",
  "Host Technical Meetups, Hackathons & Conferences",
];

const TEAM_SIZES = ["Just me (Solo)", "2 - 5 people", "6 - 20 people", "20+ people"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Developer Advocate");
  const [organization, setOrganization] = useState("");
  const [goal, setGoal] = useState("Launch Developer Tool & Grow GitHub Stars");
  const [teamSize, setTeamSize] = useState("2 - 5 people");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          role,
          organization: organization.trim(),
          goal,
          teamSize,
          workspaceName: workspaceName.trim() || (organization ? `${organization} DevRel` : "My Workspace"),
        }),
      });

      if (res.ok) {
        router.push("/app");
      } else {
        router.push("/app");
      }
    } catch {
      router.push("/app");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold shadow-xs">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-bold text-lg text-[#202124]">DevRelOS Setup</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
          {step === 1 ? "Tell us about your developer role" : "Configure your primary workspace"}
        </h2>
        <p className="mt-1 text-xs text-[#747474]">
          Step {step} of 2 • Customize your AI strategy templates and workflows.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-[#E8E8E5]">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-2">
                  Select Your Primary Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition ${
                        role === r
                          ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                          : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Organization, Project, or Community Name
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. VectorSearch, Supabase, LangChain"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-[#747474] hover:text-[#202124]"
                >
                  Skip this step
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition"
                >
                  <span>Next: Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleComplete} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-2">
                  Primary Developer Relations Objective
                </label>
                <div className="space-y-2">
                  {SUGGESTED_GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                        goal === g
                          ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                          : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                      }`}
                    >
                      <span>{g}</span>
                      {goal === g && <Check className="w-4 h-4 text-[#FF6B35]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder={organization ? `${organization} DevRel` : "My DevRel Workspace"}
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Team Size
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEAM_SIZES.map((ts) => (
                    <button
                      key={ts}
                      type="button"
                      onClick={() => setTeamSize(ts)}
                      className={`p-2 rounded-xl border text-xs transition text-center ${
                        teamSize === ts
                          ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-semibold"
                          : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474] hover:bg-white"
                      }`}
                    >
                      {ts}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-[#E8E8E5]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-[#747474] hover:text-[#202124]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Launching Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete & Enter Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
