import { Suspense } from "react";
import type { Metadata } from "next";
import AuthForm from "@/components/auth/AuthForm";
import AuthShell from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Sign in — Mnemo" };

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="card h-96 w-full max-w-md animate-pulse" />}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
