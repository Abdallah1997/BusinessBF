import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/ui/auth-card";
import { enabledSocialProviders } from "@/lib/auth";
import { getUser } from "@/lib/session";

export const metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4 dark:from-neutral-950 dark:to-neutral-900">
      <Suspense>
        <AuthCard mode="signup" socialProviders={enabledSocialProviders()} />
      </Suspense>
    </div>
  );
}
