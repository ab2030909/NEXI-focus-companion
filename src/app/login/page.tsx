"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, AlertCircle, Loader2, ShieldCheck, Key, HelpCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [redirectUri, setRedirectUri] = useState<string>("http://localhost:3000/api/auth/callback/google");

  useEffect(() => {
    const errorFromUrl = searchParams.get("error");
    if (errorFromUrl) {
      setError(errorFromUrl);
    }

    // Check if Google OAuth is configured
    fetch("/api/auth/google", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        setIsConfigured(Boolean(data.configured));
        if (data.redirectUri) setRedirectUri(data.redirectUri);
      })
      .catch(() => {
        setIsConfigured(false);
      });
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/google", { method: "POST" });
      const data = await res.json();

      if (!data.configured) {
        setIsLoading(false);
        setError("Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to initialize Google OAuth.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Failed to initiate Google authentication.");
    }
  };

  const handleDevBypass = async () => {
    setIsLoading(true);
    try {
      // Development fallback for evaluating without active Google Cloud console
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "alex@devrelos.com", password: "password123" }),
      });
      if (res.ok) {
        router.push("/app");
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#161719] text-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#FF6B35]/30 selection:text-[#FF6B35]">
      <div className="w-full max-w-md space-y-8">
        {/* Brand & Heading */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B35] flex items-center justify-center text-white font-bold shadow-lg shadow-[#FF6B35]/20 group-hover:bg-[#E85923] transition">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">DevRelOS</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Your DevRel workspace starts here.
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#A0A0A0] leading-relaxed max-w-sm mx-auto">
            Sign in to plan campaigns, create developer content, and grow your community.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#202124] rounded-2xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block">Authentication Notice</span>
                <span className="text-[11px] leading-relaxed">{error}</span>
              </div>
            </div>
          )}

          {/* Prominent Continue with Google Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white text-[#202124] hover:bg-[#F0F0EE] active:scale-98 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#202124]" />
            ) : (
              /* Official Google 4-Color Logo SVG */
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          {/* Missing Credentials Diagnostic & Local Fallback Notice */}
          {isConfigured === false && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Key className="w-3.5 h-3.5" />
                <span>Google OAuth Setup Required</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                To connect your Google identity, configure in <code className="text-white bg-black/40 px-1 py-0.5 rounded">.env.local</code>:
              </p>
              <pre className="text-[10px] font-mono bg-black/50 p-2 rounded text-[#A0A0A0] overflow-x-auto">
                GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com{"\n"}
                GOOGLE_CLIENT_SECRET=your_secret
              </pre>
              <p className="text-[10px] text-amber-300">
                Authorized Redirect URI: <span className="underline select-all">{redirectUri}</span>
              </p>
              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
                <span className="text-[10px] text-[#A0A0A0]">Testing locally without Google credentials?</span>
                <button
                  type="button"
                  onClick={handleDevBypass}
                  className="text-[10px] font-bold text-[#FF6B35] hover:underline"
                >
                  Enter Dev Sandbox →
                </button>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-[11px] text-[#747474]">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Identity verified via OpenID Connect authorization code flow.</span>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[#A0A0A0] hover:text-white transition"
          >
            ← Return to DevRelOS Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#161719] flex items-center justify-center text-white text-xs">
          Loading sign in...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
