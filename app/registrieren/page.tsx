import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Registrieren" };

export default async function SignUpPage({ searchParams }: PageProps<"/registrieren">) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect(`/u/${session.user.username}`);
  return <SignUpForm next={typeof next === "string" ? next : undefined} />;
}
