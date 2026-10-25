"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center text-white font-bold shadow-xs group-hover:bg-[#E85923] transition">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <span className="font-bold text-xl text-[#202124]">DevRelOS</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#202124]">
          Reset your password
        </h2>
        <p className="mt-1.5 text-xs text-[#747474]">
          Enter your email and we&apos;ll send you instructions to reset your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-2xl border border-[#E8E8E5]">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#202124]">Reset instructions dispatched</h3>
              <p className="text-xs text-[#747474] leading-relaxed">
                If an account exists for <span className="font-semibold text-[#202124]">{email}</span>, a secure password reset link has been dispatched to your inbox.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#FF6B35] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#202124] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs bg-[#F7F7F5] border border-[#E8E8E5] rounded-xl px-3.5 py-2.5 text-[#202124] placeholder:text-[#747474] focus:outline-none focus:border-[#FF6B35] transition"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#FF6B35] hover:bg-[#E85923] active:scale-98 rounded-xl shadow-xs transition"
              >
                Send Reset Link
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747474] hover:text-[#202124] transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
