"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDevRel, DevRelProvider } from "@/context/DevRelContext";
import { Workspace } from "@/types";
import {
  Building,
  ArrowLeft,
  Plus,
  Check,
  Globe,
  BookOpen,
  Users,
  Shield,
  Trash2,
  ExternalLink,
  Layers,
} from "lucide-react";

function WorkspaceSettingsContent() {
  const {
    user,
    workspaces,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    showToast,
  } = useDevRel();

  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsType, setNewWsType] = useState<"personal" | "organization">("organization");
  const [newWsWebsite, setNewWsWebsite] = useState("");
  const [newWsDocs, setNewWsDocs] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    await createWorkspace({
      name: newWsName.trim(),
      type: newWsType,
      websiteUrl: newWsWebsite.trim(),
      docUrl: newWsDocs.trim(),
      description: newWsDesc.trim() || "Developer Relations Workspace",
    });

    setIsCreating(false);
    setNewWsName("");
    setNewWsWebsite("");
    setNewWsDocs("");
    setNewWsDesc("");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      <div className="max-w-4xl mx-auto space-y-6">
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
            Workspaces
          </span>
        </div>

        {/* Active Workspace Overview */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E8E8E5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E8E5]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0EB] border border-[#FFD4C2] flex items-center justify-center text-[#FF6B35] font-bold text-lg shrink-0">
                <Building className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#202124]">
                    {activeWorkspace?.name || "Active Workspace"}
                  </h1>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeWorkspace?.isDemo
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {activeWorkspace?.isDemo ? "Sample Demo Workspace" : "Production Workspace"}
                  </span>
                </div>
                <p className="text-xs text-[#747474] mt-0.5">
                  {activeWorkspace?.description || "Developer relations workspace for advocacy and campaigns."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-95 rounded-xl shadow-xs transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Workspace</span>
            </button>
          </div>

          {/* Workspace Switcher Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124] mb-3">
              Available Workspaces ({workspaces.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspace?.id;
                return (
                  <div
                    key={ws.id}
                    onClick={() => switchWorkspace(ws.id)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? "bg-[#FFF0EB]/50 border-[#FF6B35] shadow-xs"
                        : "bg-[#F7F7F5] border-[#E8E8E5] hover:bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[#202124] truncate">{ws.name}</span>
                        {ws.isDemo && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#747474] truncate">
                        {ws.type === "personal" ? "Personal Developer Workspace" : "Organization Workspace"}
                      </p>
                    </div>

                    {isActive && (
                      <span className="w-6 h-6 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Organization URLs & Documentation */}
          <div className="pt-4 border-t border-[#E8E8E5] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
              Developer Resources & Documentation Links
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5]">
                <span className="text-[10px] text-[#747474] uppercase font-bold block mb-1">Organization Website</span>
                <span className="font-semibold text-[#202124] truncate block">
                  {activeWorkspace?.websiteUrl || "https://example.com"}
                </span>
              </div>
              <div className="p-3 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5]">
                <span className="text-[10px] text-[#747474] uppercase font-bold block mb-1">Developer Documentation</span>
                <span className="font-semibold text-[#202124] truncate block">
                  {activeWorkspace?.docUrl || "https://docs.example.com"}
                </span>
              </div>
            </div>
          </div>

          {/* Members & Access */}
          <div className="pt-4 border-t border-[#E8E8E5] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202124]">
                Workspace Members & Role Permissions
              </h3>
              <span className="text-[11px] text-[#747474]">Multi-seat invite invitations coming in Pro</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F5] border border-[#E8E8E5] text-xs">
                <div>
                  <p className="font-bold text-[#202124]">{user?.profile?.name || "Alex Rivera"}</p>
                  <p className="text-[11px] text-[#747474]">{user?.email || "alex@devrelos.com"}</p>
                </div>
                <span className="text-[10px] font-bold bg-white text-[#202124] px-2.5 py-1 rounded-lg border border-[#E8E8E5]">
                  Workspace Owner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Create Workspace Modal */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-xl border border-[#E8E8E5] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F7F7F5]">
                <h3 className="text-sm font-bold text-[#202124]">Create New Workspace</h3>
                <button onClick={() => setIsCreating(false)} className="text-[#747474] hover:text-[#202124]">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    placeholder="e.g. Acme VectorDB DevRel"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Workspace Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewWsType("organization")}
                      className={`p-2.5 rounded-xl border text-xs text-center transition ${
                        newWsType === "organization"
                          ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-bold"
                          : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474]"
                      }`}
                    >
                      Organization
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewWsType("personal")}
                      className={`p-2.5 rounded-xl border text-xs text-center transition ${
                        newWsType === "personal"
                          ? "bg-[#FFF0EB] border-[#FF6B35] text-[#FF6B35] font-bold"
                          : "bg-[#F7F7F5] border-[#E8E8E5] text-[#747474]"
                      }`}
                    >
                      Personal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={newWsWebsite}
                    onChange={(e) => setNewWsWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Developer Documentation URL
                  </label>
                  <input
                    type="url"
                    value={newWsDocs}
                    onChange={(e) => setNewWsDocs(e.target.value)}
                    placeholder="https://docs.company.com"
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3 py-2 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={newWsDesc}
                    onChange={(e) => setNewWsDesc(e.target.value)}
                    placeholder="Purpose and developer goals of this workspace..."
                    className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl p-2.5 text-[#202124] focus:outline-none focus:border-[#FF6B35]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E8E5]">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-3 py-1.5 text-xs text-[#747474] hover:text-[#202124]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] rounded-xl transition"
                  >
                    Create Workspace
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspaceSettingsPage() {
  return (
    <DevRelProvider>
      <WorkspaceSettingsContent />
    </DevRelProvider>
  );
}
