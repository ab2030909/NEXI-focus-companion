"use client";

import React from "react";
import { DevRelProvider } from "@/context/DevRelContext";
import { DashboardApp } from "@/components/DashboardApp";

export default function AppPage() {
  return (
    <DevRelProvider>
      <DashboardApp />
    </DevRelProvider>
  );
}
