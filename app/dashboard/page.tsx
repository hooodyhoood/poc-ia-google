"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Newspaper, Bot, ArrowRight } from "lucide-react";

const modules = [
  {
    title: "Assistants",
    description:
      "Un assistant par domaine, chacun ancré sur sa propre base de connaissance (Vertex AI Search).",
    icon: Bot,
    href: "/dashboard/assistants",
  },
  {
    title: "Rendez-vous",
    description:
      "Créneaux synchronisés avec Google Calendar, pris en langage naturel par un assistant.",
    icon: Calendar,
  },
  {
    title: "Articles",
    description:
      "Partage de contenus qui viennent nourrir automatiquement les bases de connaissance.",
    icon: Newspaper,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <div>
      <header>
        <p className="font-sans text-sm text-muted">Vue d'ensemble</p>
        <h1 className="mt-1 font-display text-3xl font-medium text-ink">
          Bonjour{firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="mt-2 max-w-lg font-sans text-sm leading-relaxed text-muted">
          Le module Assistants est actif. Les modules Rendez-vous et Articles
          arrivent dans les prochaines itérations du POC.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {modules.map(({ title, description, icon: Icon, href }) => {
          const inner = (
            <>
              <Icon size={20} strokeWidth={1.75} className="text-teal" />
              <h2 className="mt-4 flex items-center gap-1.5 font-sans text-sm font-semibold text-ink">
                {title}
                {href && <ArrowRight size={14} className="text-teal" />}
              </h2>
              <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
                {description}
              </p>
              {!href && (
                <span className="mt-3 inline-block rounded-sm bg-paper px-1.5 py-0.5 font-sans text-[10px] text-muted">
                  bientôt
                </span>
              )}
            </>
          );
          const cls =
            "rounded-lg border border-line bg-surface p-6 transition" +
            (href ? " hover:border-teal" : "");
          return href ? (
            <Link key={title} href={href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={title} className={cls}>
              {inner}
            </div>
          );
        })}
      </section>
    </div>
  );
}
