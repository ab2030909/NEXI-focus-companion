"use client";

import React, { useState } from "react";
import { useDevRel } from "@/context/DevRelContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { Toast } from "@/components/Toast";
import { NewCampaignModal } from "@/components/NewCampaignModal";

import { OverviewView } from "@/components/views/OverviewView";
import { CampaignsView } from "@/components/views/CampaignsView";
import { ResearchLabView } from "@/components/views/ResearchLabView";
import { ContentStudioView } from "@/components/views/ContentStudioView";
import { EventsView } from "@/components/views/EventsView";
import { OutreachView } from "@/components/views/OutreachView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { IntegrationsView } from "@/components/views/IntegrationsView";
import { SettingsView } from "@/components/views/SettingsView";

export const DashboardApp: React.FC = () => {
  const { activeTab } = useDevRel();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewView />;
      case "campaigns":
        return <CampaignsView />;
      case "research":
        return <ResearchLabView />;
      case "content":
        return <ContentStudioView />;
      case "events":
        return <EventsView />;
      case "outreach":
        return <OutreachView />;
      case "analytics":
        return <AnalyticsView />;
      case "integrations":
        return <IntegrationsView />;
      case "settings":
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F7F5] overflow-hidden">
      {/* Persistent / Responsive Left Sidebar */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Modals & Floating Components */}
      <NewCampaignModal />
      <Toast />
    </div>
  );
};
