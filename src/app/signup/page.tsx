"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // DevRelOS uses Google-only OAuth authentication
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#161719] flex items-center justify-center text-white text-xs">
      Redirecting to Google authentication...
    </div>
  );
}
