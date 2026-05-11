import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const authConfigured = isAuthConfigured();
  const defaultEmail = process.env.AUTH_LOGIN_EMAIL || "";

  return (
    <Suspense>
      <LoginForm authConfigured={authConfigured} defaultEmail={defaultEmail} />
    </Suspense>
  );
}
