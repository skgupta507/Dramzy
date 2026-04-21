"use client";

import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "@/components/icons";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export function SignOutButtons() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={async () => { setLoading(true); await signOut({ callbackUrl: "/" }); }}
        disabled={loading}
        size="lg"
        className="w-full gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {loading ? "Signing out…" : "Sign Out"}
      </Button>
      <Link href="/home">
        <Button variant="outline" size="lg" className="w-full">Stay</Button>
      </Link>
    </div>
  );
}

export default SignOutButtons;
