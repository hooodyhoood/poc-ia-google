import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Panneau éditorial */}
      <div className="relative hidden overflow-hidden bg-night px-16 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <GraphMotif />

        <div className="relative z-10">
          <span className="font-sans text-sm font-medium tracking-wide text-white/60">
            Atelier
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-medium leading-[1.15] text-white">
            Un espace de travail où chaque assistant connaît vraiment votre
            sujet.
          </h1>
          <p className="mt-6 font-sans text-[15px] leading-relaxed text-white/70">
            Rendez-vous, articles et assistants IA spécialisés, chacun
            alimenté par sa propre base de connaissance.
          </p>
        </div>

        <div className="relative z-10 font-sans text-xs text-white/40">
          Preuve de concept interne
        </div>
      </div>

      {/* Panneau d'authentification */}
      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <span className="font-sans text-sm font-medium tracking-wide text-muted">
              Atelier
            </span>
          </div>

          <h2 className="font-display text-2xl font-medium text-ink">
            Se connecter
          </h2>
          <p className="mt-2 font-sans text-sm text-muted">
            Accède à ton espace avec ton compte Google professionnel.
          </p>

          <div className="mt-8">
            <GoogleSignInButton />
          </div>

          <p className="mt-8 font-sans text-xs leading-relaxed text-muted">
            En continuant, tu acceptes que ton profil (nom, e-mail, photo)
            soit enregistré pour cette preuve de concept.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Motif de fond évoquant un graphe de connaissances, en lignes fines. */
function GraphMotif() {
  const nodes = [
    [40, 60], [140, 40], [230, 110], [90, 160],
    [200, 210], [40, 240], [270, 260], [160, 300],
  ];
  const edges = [
    [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 6], [3, 6], [5, 7], [6, 7],
  ];

  return (
    <svg
      className="pointer-events-none absolute -right-24 -top-10 h-[520px] w-[420px] opacity-[0.18]"
      viewBox="0 0 300 340"
      aria-hidden="true"
    >
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="white"
          strokeWidth="1"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4 : 2.5} fill="white" />
      ))}
    </svg>
  );
}
