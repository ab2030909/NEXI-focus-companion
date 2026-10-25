"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDevRel } from "@/context/DevRelContext";
import { NavigationTab, Workspace } from "@/types";
import {
  LayoutDashboard,
  Rocket,
  Compass,
  FileCode2,
  CalendarDays,
  Send,
  BarChart3,
  Blocks,
  Settings,
  Plus,
  ChevronDown,
  Sparkles,
  Bell,
  Check,
  Zap,
  LogOut,
  User,
  Building,
} from "lucide-react";

export const Sidebar: React.FC<{ isOpenMobile?: boolean; onCloseMobile?: () => void }> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const router = useRouter();
  const {
    user,
    logout,
    activeWorkspace,
    workspaces,
    switchWorkspace,
    activeTab,
    setActiveTab,
    campaigns,
    contentDrafts,
    events,
    contacts,
    setIsNewCampaignOpen,
  } = useDevRel();

  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  const navItems: {
    id: NavigationTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
  }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "campaigns", label: "AI Campaigns", icon: Rocket, badge: campaigns.length },
    { id: "research", label: "Research Lab", icon: Compass },
    { id: "content", label: "Content Studio", icon: FileCode2, badge: contentDrafts.length },
    { id: "events", label: "Events & Community", icon: CalendarDays, badge: events.length },
    { id: "outreach", label: "Outreach", icon: Send, badge: contacts.length },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "integrations", label: "Integrations", icon: Blocks },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  const currentWsName = activeWorkspace?.name || "DevRel Workspace";
  const userInitials = user?.profile?.name
    ? user.profile.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AR";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-[#E8E8E5] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand & Workspace Switcher */}
        <div className="p-4 border-b border-[#E8E8E5]">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#FF6B35] flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-[#E85923] transition">
                <Zap className="w-4 h-4 fill-white text-white" />
              </div>
              <div>
                <span className="font-bold text-[#202124] tracking-tight text-base flex items-center gap-1.5">
                  DevRelOS
                  <span className="text-[10px] font-semibold bg-[#FFF0EB] text-[#FF6B35] px-1.5 py-0.5 rounded-full border border-[#FFD4C2]">
                    SaaS
                  </span>
                </span>
                <p className="text-[11px] text-[#747474]">Developer Relations OS</p>
              </div>
            </Link>

            <button
              onClick={() => setHasUnreadNotifications(false)}
              className="relative p-1.5 rounded-lg text-[#747474] hover:text-[#202124] hover:bg-[#F7F7F5] transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasUnreadNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6B35] ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Workspace Switcher dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium text-[#202124] bg-[#F7F7F5] hover:bg-[#ECECE9] rounded-lg border border-[#E8E8E5] transition"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full ${activeWorkspace?.isDemo ? "bg-amber-500" : "bg-emerald-500"}`} />
                <span className="truncate">{currentWsName}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#747474] shrink-0" />
            </button>

            {isWorkspaceMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-lg shadow-lg border border-[#E8E8E5] py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#747474]">
                  Workspaces
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between text-[#202124] hover:bg-[#F7F7F5] transition"
                  >
                    <div className="truncate flex items-center gap-1.5">
                      <span className="truncate">{ws.name}</span>
                      {ws.isDemo && (
                        <span className="text-[9px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded border border-amber-200">
                          Demo
                        </span>
                      )}
                    </div>
                    {ws.id === activeWorkspace?.id && <Check className="w-3.5 h-3.5 text-[#FF6B35]" />}
                  </button>
                ))}
                <div className="border-t border-[#E8E8E5] mt-1 pt-1">
                  <Link
                    href="/settings/workspace"
                    onClick={() => setIsWorkspaceMenuOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-[#FF6B35] font-semibold hover:bg-[#FFF0EB] flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Workspaces</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button: New Campaign */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setIsNewCampaignOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-[0.98] rounded-lg shadow-xs shadow-[#FF6B35]/25 transition duration-150"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New AI Campaign</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 ${
                  isActive
                    ? "bg-[#FFF0EB] text-[#FF6B35] font-semibold"
                    : "text-[#202124] hover:bg-[#F7F7F5] hover:text-[#202124]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? "text-[#FF6B35]" : "text-[#747474]"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? "bg-[#FFD4C2] text-[#FF6B35]"
                        : "bg-[#F0F0EE] text-[#747474]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Agent Status Pill */}
        <div className="p-3 mx-3 mb-3 bg-[#F7F7F5] rounded-xl border border-[#E8E8E5]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#202124] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
              DevRel Copilot
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[11px] text-[#747474] leading-relaxed">
            Multi-modal developer engine online. Groq GPT-OSS active.
          </p>
        </div>

        {/* User Profile Footer */}
        <div className="relative p-3 border-t border-[#E8E8E5]">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="w-full flex items-center justify-between p-1 rounded-xl hover:bg-[#F7F7F5] transition text-left"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#202124] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-2 ring-[#FF6B35]/20">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#202124] truncate">
                  {user?.profile?.name || "Alex Rivera"}
                </p>
                <p className="text-[11px] text-[#747474] truncate">
                  {user?.profile?.role || "Head of DevRel"}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#747474] shrink-0" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white rounded-xl shadow-xl border border-[#E8E8E5] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
              <Link
                href="/settings/profile"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F7F7F5] transition"
              >
                <User className="w-3.5 h-3.5 text-[#747474]" />
                <span>Profile Settings</span>
              </Link>
              <Link
                href="/settings/workspace"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#202124] hover:bg-[#F7F7F5] transition"
              >
                <Building className="w-3.5 h-3.5 text-[#747474]" />
                <span>Workspace Settings</span>
              </Link>
              <div className="border-t border-[#E8E8E5] my-1" />
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
