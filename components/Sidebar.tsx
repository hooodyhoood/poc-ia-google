"use client";

import type { User } from "firebase/auth";
import { LayoutGrid, Calendar, Newspaper, Bot, LogOut } from "lucide-react";
import { signOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const modules = [
  { label: "Vue d'ensemble", icon: LayoutGrid, active: true },
  { label: "Rendez-vous", icon: Calendar, active: false },
  { label: "Articles", icon: Newspaper, active: false },
  { label: "Assistants", icon: Bot, active: false },
];

export default function Sidebar({ user }: { user: User }) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-line bg-surface px-6 py-8">
      <div>
        <span className="font-display text-xl font-medium text-ink">
          Atelier
        </span>

        <nav className="mt-10 flex flex-col gap-1">
          {modules.map(({ label, icon: Icon, active }) => (
            <div
              key={label}
              className={`flex items-center gap-3 rounded-md px-3 py-2 font-sans text-sm ${
                active
                  ? "bg-teal-light font-medium text-teal-dark"
                  : "text-muted"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
              {!active && (
                <span className="ml-auto rounded-sm bg-paper px-1.5 py-0.5 font-sans text-[10px] text-muted">
                  bientôt
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3 border-t border-line pt-5">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt=""
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-light font-sans text-xs font-medium text-teal-dark">
            {(user.displayName ?? user.email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-medium text-ink">
            {user.displayName ?? "Utilisateur"}
          </p>
          <p className="truncate font-sans text-xs text-muted">
            {user.email}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          aria-label="Se déconnecter"
          className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-ink"
        >
          <LogOut size={16} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
}
