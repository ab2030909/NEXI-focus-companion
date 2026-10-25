"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import {
  Settings,
  Users,
  Download,
  RefreshCw,
  Bell,
  Building,
  ShieldCheck,
  Check,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const {
    currentWorkspace,
    setCurrentWorkspace,
    campaigns,
    researchReports,
    contentDrafts,
    events,
    contacts,
    resetToDefaults,
    showToast,
  } = useDevRel();

  const [workspaceName, setWorkspaceName] = useState(currentWorkspace);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [discordBotAlerts, setDiscordBotAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    setCurrentWorkspace(workspaceName.trim());
    showToast("Workspace settings saved.", "success");
  };

  const handleExportData = () => {
    const backupData = {
      workspace: currentWorkspace,
      exportedAt: new Date().toISOString(),
      campaigns,
      researchReports,
      contentDrafts,
      events,
      contacts,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devrelos-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("DevRelOS dataset exported as JSON.", "success");
  };

  const TEAM_MEMBERS = [
    { name: "Alex Rivera", role: "Head of Developer Relations", email: "alex@devrelos.com", permission: "Workspace Owner" },
    { name: "Sarah Chen", role: "Staff Systems Advocate", email: "sarah@devrelos.com", permission: "Admin" },
    { name: "Jordan Reed", role: "Senior Technical Writer", email: "jordan@devrelos.com", permission: "Editor" },
    { name: "Elena Rostova", role: "Community & Events Lead", email: "elena@devrelos.com", permission: "Editor" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Workspace Profile */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-4 h-4 text-[#FF6B35]" />
          <h3 className="text-sm font-bold text-[#202124]">Workspace Profile</h3>
        </div>

        <form onSubmit={handleSaveWorkspace} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#202124] mb-1">
              Workspace Display Name
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition"
            >
              Save Workspace
            </button>
          </div>
        </form>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-[#202124]">Team Members & Access</h3>
          </div>
          <span className="text-xs text-[#747474]">4 Active DevRel Seats</span>
        </div>

        <div className="space-y-2.5">
          {TEAM_MEMBERS.map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-xs"
            >
              <div>
                <p className="font-bold text-[#202124]">{member.name}</p>
                <p className="text-[11px] text-[#747474]">
                  {member.role} • {member.email}
                </p>
              </div>
              <span className="text-[10px] font-semibold bg-white text-[#202124] px-2.5 py-1 rounded-lg border border-[#E8E8E5]">
                {member.permission}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#FF6B35]" />
          <h3 className="text-sm font-bold text-[#202124]">Alerts & Notifications</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#202124]">Campaign Deliverable Deadlines</p>
              <p className="text-[11px] text-[#747474]">Receive alerts when scheduled posts or tasks are due</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded accent-[#FF6B35] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#202124]">Community Discord Activity Alerts</p>
              <p className="text-[11px] text-[#747474]">Notify when spikes in community questions or mentions occur</p>
            </div>
            <input
              type="checkbox"
              checked={discordBotAlerts}
              onChange={(e) => setDiscordBotAlerts(e.target.checked)}
              className="rounded accent-[#FF6B35] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#202124]">Weekly DevRel Digest</p>
              <p className="text-[11px] text-[#747474]">Executive email summary sent every Monday morning</p>
            </div>
            <input
              type="checkbox"
              checked={weeklyDigest}
              onChange={(e) => setWeeklyDigest(e.target.checked)}
              className="rounded accent-[#FF6B35] w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Data Export & Backup */}
      <div className="bg-white rounded-2xl p-6 border border-[#E8E8E5] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#202124] flex items-center gap-2">
              <Download className="w-4 h-4 text-[#FF6B35]" />
              Export DevRelOS Workspace Data
            </h3>
            <p className="text-xs text-[#747474] mt-1">
              Download complete JSON records of all campaigns, tutorials, events, research, and outreach.
            </p>
          </div>

          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-xl border border-[#E8E8E5] transition shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#747474]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset to Defaults */}
      <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-red-600" />
              Reset All Records to Factory Sample Data
            </h3>
            <p className="text-xs text-[#747474] mt-1">
              Clears browser local storage and restores all original campaigns, research, and events.
            </p>
          </div>

          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition shrink-0"
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};
