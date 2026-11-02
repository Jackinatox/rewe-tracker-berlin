import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Konto" };

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/anmelden?next=/einstellungen");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Konto</h1>
      <AccountSettings name={session.user.name} username={session.user.username ?? ""} email={session.user.email} />
    </div>
  );
}
