"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useDevRel, DevRelProvider } from "@/context/DevRelContext";
import { UserProfile } from "@/types";
import {
  User,
  ArrowLeft,
  Save,
  Check,
  Shield,
  Bell,
  Globe,
  Code2,
  Share2,
  Clock,
  Building,
} from "lucide-react";

function ProfileSettingsContent() {
  const { user, updateProfile, showToast } = useDevRel();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [timezone, setTimezone] = useState("America/Los_Angeles (PST)");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [discordAlerts, setDiscordAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setName(user.profile.name || "");
      setEmail(user.email || user.profile.email || "");
      setRole(user.profile.role || "");
      setOrganization(user.profile.organization || "");
      setBio(user.profile.bio || "");
      setGithubUrl(user.profile.githubUrl || "");
      setTwitterUrl(user.profile.twitterUrl || "");
      setLinkedinUrl(user.profile.linkedinUrl || "");
      setTimezone(user.profile.timezone || "America/Los_Angeles (PST)");
      if (user.profile.notificationPreferences) {
        setEmailAlerts(user.profile.notificationPreferences.emailAlerts);
        setDiscordAlerts(user.profile.notificationPreferences.discordAlerts);
        setWeeklyDigest(user.profile.notificationPreferences.weeklyDigest);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile({
      name: name.trim(),
      role: role.trim(),
      organization: organization.trim(),
      bio: bio.trim(),
      githubUrl: githubUrl.trim(),
      twitterUrl: twitterUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      timezone,
      notificationPreferences: {
        emailAlerts,
        discordAlerts,
        weeklyDigest,
      },
    });
    setIsSaving(false);
  };

  const userInitials = name
    ? name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AR";

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header & Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747474] hover:text-[#202124] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to DevRelOS Dashboard</span>
          </Link>
          <span className="text-xs font-bold text-[#FF6B35] bg-[#FFF0EB] px-2.5 py-0.5 rounded-full border border-[#FFD4C2]">
            User Settings
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E5] shadow-xs space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-[#E8E8E5]">
            <div className="w-16 h-16 rounded-2xl bg-[#202124] text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-[#FF6B35]/15 shrink-0">
              {userInitials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#202124]">{name || "Developer Profile"}</h1>
              <p className="text-xs text-[#747474] mt-0.5">{email}</p>
              <span className="inline-block mt-2 text-[10px] font-semibold bg-[#F7F7F5] text-[#747474] px-2 py-0.5 rounded border border-[#E8E8E5]">
                {role || "Developer Advocate"} • {organization || "Independent"}
              </span>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#747474] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Job Title / Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Head of DevRel, Staff Advocate..."
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">Organization / Project</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="VectorSearch, Vercel..."
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">Bio & Advocacy Focus</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your technical expertise, focus areas, and community projects..."
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-3 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          {/* Social & Developer Profiles */}
          <div className="space-y-4 pt-4 border-t border-[#E8E8E5]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
              Developer & Social Profiles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">GitHub Profile</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">X / Twitter</label>
                <input
                  type="text"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://x.com/username"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1">LinkedIn Profile</label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>
          </div>

          {/* Notification Preferences & Timezone */}
          <div className="space-y-4 pt-4 border-t border-[#E8E8E5]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
              Preferences & Timezone
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#202124] mb-1">Primary Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
              >
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST / UTC-8)</option>
                <option value="America/New_York (EST)">America/New_York (EST / UTC-5)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT / UTC+0)</option>
                <option value="Europe/Berlin (CET)">Europe/Berlin (CET / UTC+1)</option>
                <option value="Asia/Tokyo (JST)">Asia/Tokyo (JST / UTC+9)</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
                <span className="text-xs font-medium text-[#202124]">Email alerts for campaign milestones</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded accent-[#FF6B35] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
                <span className="text-xs font-medium text-[#202124]">Discord community mention notifications</span>
                <input
                  type="checkbox"
                  checked={discordAlerts}
                  onChange={(e) => setDiscordAlerts(e.target.checked)}
                  className="rounded accent-[#FF6B35] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
                <span className="text-xs font-medium text-[#202124]">Weekly DevRel performance summary</span>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="rounded accent-[#FF6B35] w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#E8E8E5] flex items-center justify-end gap-3">
            <Link
              href="/app"
              className="px-4 py-2 text-xs font-semibold text-[#747474] hover:text-[#202124]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <DevRelProvider>
      <ProfileSettingsContent />
    </DevRelProvider>
  );
}
