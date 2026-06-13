import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Join Mnemo" };

export default function SignupPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="card h-[32rem] w-full max-w-md animate-pulse" />}>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
