"use client";

import { useState } from "react";
import { signOut } from "@/app/actions";
import { Icon } from "./Icons";
import { OutOfScope } from "./Tooltip";

export function Header({ email }: { email?: string }) {
  const [menu, setMenu] = useState(false);
  const initial = (email?.[0] ?? "?").toUpperCase();

  return (
    <header className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 32 32" className="size-8" fill="none" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
          <path d="M5 26V16a11 11 0 0122 0v10" stroke="#4285f4" />
          <path d="M11 26V16a5 5 0 0110 0v10" stroke="#a78bfa" />
        </svg>
        <span className="text-[22px]">Untitled notebook</span>
      </div>
      <div className="flex items-center gap-1">
        <OutOfScope className="border border-foreground/15" align="right">
          <Icon name="plus" className="size-4" /> Create notebook
        </OutOfScope>
        <OutOfScope align="right">
          <Icon name="share" className="size-4" /> Share
        </OutOfScope>
        <OutOfScope align="right" label="More">
          <Icon name="more" />
        </OutOfScope>
        <OutOfScope align="right" label="Settings">
          <Icon name="gear" />
        </OutOfScope>
        <OutOfScope align="right" label="Apps">
          <Icon name="apps" />
        </OutOfScope>
        <div className="relative ml-1">
          <button
            onClick={() => setMenu(!menu)}
            aria-label="Account"
            className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white"
          >
            {initial}
          </button>
          {menu && (
            <>
              <button aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-foreground/10 bg-panel p-2 shadow-lg">
                <p className="truncate px-3 py-2 text-sm text-foreground/70">{email}</p>
                <form action={signOut}>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/5">Sign out</button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
