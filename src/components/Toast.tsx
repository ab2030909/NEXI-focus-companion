"use client";

import React from "react";
import { useDevRel } from "@/context/DevRelContext";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

export const Toast: React.FC = () => {
  const { toast } = useDevRel();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#FF6B35] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#202124] text-white px-4 py-3 rounded-xl shadow-xl border border-white/10 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
      {icons[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
};
