"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Newspaper, Bot } from "lucide-react";

const upcoming = [
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
  {
    title: "Assistants",
    description:
      "Un assistant par domaine, chacun ancré sur sa propre base de connaissance (Vertex AI Search).",
    icon: Bot,
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
          Les fondations (compte et connexion) sont en place. Les modules
          ci-dessous arrivent dans les prochaines itérations du POC.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {upcoming.map(({ title, description, icon: Icon }) => (
          <div
            key={title}
            className="rounded-lg border border-line bg-surface p-6"
          >
            <Icon size={20} strokeWidth={1.75} className="text-teal" />
            <h2 className="mt-4 font-sans text-sm font-semibold text-ink">
              {title}
            </h2>
            <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted">
              {description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
