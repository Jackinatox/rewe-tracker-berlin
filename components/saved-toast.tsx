"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Shows a confirmation after a redirect with ?gespeichert=1 and drops the param from the URL. */
export function SavedToast() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    toast.success("Besuch gespeichert");
    router.replace(pathname as never, { scroll: false });
  }, [router, pathname]);
  return null;
}
