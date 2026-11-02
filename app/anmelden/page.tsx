import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Anmelden" };

export default async function SignInPage({ searchParams }: PageProps<"/anmelden">) {
  const { next } = await searchParams;
  const session = await getSession();
  if (session) redirect(`/u/${session.user.username}`);
  return <SignInForm next={typeof next === "string" ? next : undefined} />;
}
