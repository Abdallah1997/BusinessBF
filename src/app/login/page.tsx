import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getUser } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
