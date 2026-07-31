import type { Metadata } from "next";
import type { ElementType } from "react";
import Link from "next/link";
import { Shield, ChevronRight, Lock, Database, Eye, UserCheck, Cookie, Mail, Phone, Scale } from "lucide-react";

type ContentBlock =
  | { type: "text"; value: string }
  | { type: "list"; items: string[] }
  | { type: "categories"; items: { label: string; items: string[] }[] }
  | { type: "dl"; items: { label: string; value: string }[] }
  | { type: "contact" };

type Section = {
  id: string;
  title: string;
  icon: ElementType;
  content: ContentBlock[];
};

export const metadata: Metadata = {
  title: "Politique de Confidentialité | CCFO26",
  description: "Politique de confidentialité et protection des données personnelles de la plateforme CCFO26.",
  robots: { index: false },
};

const SECTIONS: Section[] = [
  {
    id: "collecte",
    title: "1. Données collectées",
    icon: Database,
    content: [
      {
        type: "text",
        value:
          "Dans le cadre du fonctionnement de la plateforme CCFO26, nous collectons les données personnelles suivantes :",
      },
      {
        type: "categories",
        items: [
          {
            label: "Données d'inscription d'équipe",
            items: [
              "Nom de l'équipe et village d'origine",
              "Nom et téléphone du président",
              "Adresse email et numéro WhatsApp du manager",
              "Documents d'identité et attestation de village (fichiers uploadés)",
              "Reçu de paiement des frais d'inscription",
            ],
          },
          {
            label: "Données des joueurs",
            items: [
              "Nom complet, date de naissance, village d'origine",
              "Numéro de maillot et poste",
              "Photo de profil (optionnelle)",
            ],
          },
          {
            label: "Données de compte manager/admin",
            items: [
              "Adresse email et mot de passe (chiffré)",
              "Nom complet",
              "Rôle dans l'application (manager ou administrateur)",
            ],
          },
          {
            label: "Données techniques",
            items: [
              "Adresse IP et données de navigation (logs serveur)",
              "Informations sur le navigateur et l'appareil utilisé",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "finalites",
    title: "2. Finalités du traitement",
    icon: Eye,
    content: [
      {
        type: "text",
        value: "Les données personnelles collectées sont utilisées exclusivement pour :",
      },
      {
        type: "list",
        items: [
          "Gérer les inscriptions des équipes et valider leur participation au tournoi",
          "Afficher les profils des joueurs sur la plateforme publique",
          "Permettre aux managers de gérer leur équipe en ligne",
          "Permettre aux administrateurs de superviser la compétition",
          "Assurer la sécurité et le bon fonctionnement de l'application",
          "Générer les statistiques du tournoi (buts, classements)",
        ],
      },
    ],
  },
  {
    id: "base-legale",
    title: "3. Base légale du traitement",
    icon: Scale,
    content: [
      {
        type: "text",
        value:
          "Le traitement de vos données repose sur votre consentement explicite lors de l'inscription, ainsi que sur l'intérêt légitime de l'organisation à gérer la compétition sportive. Les documents sensibles (pièces d'identité, reçus) sont traités dans le cadre de la procédure d'inscription réglementaire au tournoi.",
      },
    ],
  },
  {
    id: "conservation",
    title: "4. Durée de conservation",
    icon: Lock,
    content: [
      {
        type: "dl",
        items: [
          { label: "Données d'équipe et joueurs", value: "Durée du tournoi + 1 an après clôture" },
          { label: "Documents d'identité uploadés", value: "Durée du tournoi + 3 mois" },
          { label: "Comptes manager", value: "Jusqu'à suppression du compte par le manager" },
          { label: "Logs techniques", value: "30 jours glissants" },
        ],
      },
    ],
  },
  {
    id: "partage",
    title: "5. Partage des données",
    icon: UserCheck,
    content: [
      {
        type: "text",
        value:
          "Vos données personnelles ne sont <strong>jamais vendues</strong> à des tiers. Elles peuvent être partagées avec :",
      },
      {
        type: "list",
        items: [
          "<strong>Supabase Inc.</strong> — hébergeur de la base de données (serveurs en Europe)",
          "<strong>Vercel Inc.</strong> — hébergeur de l'application web",
          "Les administrateurs officiels de la CCFO26 (accès restreint)",
        ],
      },
      {
        type: "text",
        value:
          "Les données publiques (noms d'équipes, scores, statistiques de buts) sont visibles par tous les visiteurs du site dans le cadre du suivi de la compétition.",
      },
    ],
  },
  {
    id: "securite",
    title: "6. Sécurité des données",
    icon: Shield,
    content: [
      {
        type: "text",
        value:
          "Nous mettons en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :",
      },
      {
        type: "list",
        items: [
          "Chiffrement des mots de passe (bcrypt via Supabase Auth)",
          "Connexions sécurisées HTTPS/TLS sur l'ensemble du site",
          "Contrôle d'accès par rôle (Row Level Security activé sur la base de données)",
          "Documents sensibles stockés dans des buckets privés (accès restreint aux administrateurs)",
          "Aucun rôle administrateur ne peut être auto-attribué lors de l'inscription",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies et traceurs",
    icon: Cookie,
    content: [
      {
        type: "text",
        value:
          "Ce site utilise uniquement des cookies <strong>strictement nécessaires</strong> au fonctionnement de l'application :",
      },
      {
        type: "dl",
        items: [
          { label: "Cookie de session", value: "Maintient la connexion des managers et administrateurs (Supabase Auth)" },
          { label: "Préférence de thème", value: "Mémorise votre choix clair/sombre (stocké localement)" },
        ],
      },
      {
        type: "text",
        value:
          "Aucun cookie publicitaire ou de tracking tiers (Google Analytics, Meta Pixel, etc.) n'est utilisé sur ce site.",
      },
    ],
  },
  {
    id: "droits",
    title: "8. Vos droits",
    icon: UserCheck,
    content: [
      {
        type: "text",
        value:
          "Conformément aux réglementations applicables en matière de protection des données, vous disposez des droits suivants sur vos données personnelles :",
      },
      {
        type: "list",
        items: [
          "<strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles",
          "<strong>Droit de rectification</strong> — corriger des données inexactes",
          "<strong>Droit à l'effacement</strong> — demander la suppression de vos données",
          "<strong>Droit d'opposition</strong> — vous opposer au traitement de vos données",
          "<strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré",
        ],
      },
      {
        type: "text",
        value:
          "Pour exercer ces droits, contactez-nous par email ou téléphone. Nous répondrons dans un délai de 30 jours.",
      },
    ],
  },
  {
    id: "contact",
    title: "9. Contact — Délégué aux données",
    icon: Mail,
    content: [
      {
        type: "text",
        value:
          "Pour toute question ou demande relative à vos données personnelles, contactez l'organisation CCFO26 :",
      },
      {
        type: "contact",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="bg-background pt-16 pb-24 lg:pb-16 min-h-dvh">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-surface-inverse">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #E8A52A 0%, transparent 50%), radial-gradient(circle at 80% 50%, #CC1F2B 0%, transparent 50%)" }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

        <div className="container mx-auto px-4 py-14 lg:py-20 relative z-10">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary">Confidentialité</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-white font-outfit">
                Politique de Confidentialité
              </h1>
              <p className="text-white/40 text-sm mt-1">Dernière mise à jour : juillet 2026</p>
            </div>
          </div>

          <p className="text-white/60 text-sm max-w-2xl leading-relaxed mt-4">
            La protection de vos données personnelles est une priorité pour l'organisation CCFO26. Cette politique explique quelles données nous collectons, pourquoi, et comment vous pouvez exercer vos droits.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Table of contents */}
        <div className="glass-card p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-black uppercase tracking-widest text-primary">Sommaire</span>
          </div>
          <ol className="space-y-2">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1 h-1 rounded-full bg-primary/30 group-hover:bg-primary transition-colors shrink-0" />
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-lg font-black text-foreground mb-5 pb-3 border-b border-border flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {section.title}
                </h2>

                <div className="space-y-4">
                  {section.content.map((block, i) => {
                    if (block.type === "text") {
                      return (
                        <p
                          key={i}
                          className="text-muted text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: block.value ?? "" }}
                        />
                      );
                    }
                    if (block.type === "list" && block.items) {
                      return (
                        <ul key={i} className="space-y-2.5">
                          {block.items.map((item, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-3 text-sm text-muted"
                              dangerouslySetInnerHTML={{
                                __html: `<span class="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 inline-block"></span><span>${item}</span>`,
                              }}
                            />
                          ))}
                        </ul>
                      );
                    }
                    if (block.type === "categories" && block.items) {
                      return (
                        <div key={i} className="space-y-4">
                          {block.items.map((cat, j) => (
                            <div key={j} className="glass-card p-5">
                              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">
                                {cat.label}
                              </div>
                              <ul className="space-y-1.5">
                                {cat.items.map((item, k) => (
                                  <li key={k} className="flex items-start gap-2 text-sm text-muted">
                                    <span className="w-1 h-1 rounded-full bg-primary/50 mt-2 shrink-0" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    if (block.type === "dl" && block.items) {
                      return (
                        <dl key={i} className="glass-card divide-y divide-border overflow-hidden">
                          {block.items.map((item, j) => (
                            <div key={j} className="flex flex-col sm:flex-row sm:items-start px-5 py-3.5 gap-1 sm:gap-4">
                              <dt className="text-[10px] font-black uppercase tracking-widest text-primary sm:w-44 shrink-0 pt-0.5">
                                {item.label}
                              </dt>
                              <dd className="text-sm text-foreground font-medium">{item.value}</dd>
                            </div>
                          ))}
                        </dl>
                      );
                    }
                    if (block.type === "contact") {
                      return (
                        <div key={i} className="glass-card p-5 space-y-3">
                          <a
                            href="mailto:contact@ccfo-gabon.com"
                            className="flex items-center gap-3 text-sm text-muted hover:text-primary transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Mail className="w-4 h-4 text-primary" />
                            </div>
                            contact@ccfo-gabon.com
                          </a>
                          <a
                            href="tel:+24100000000"
                            className="flex items-center gap-3 text-sm text-muted hover:text-primary transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                              <Phone className="w-4 h-4 text-primary" />
                            </div>
                            +241 00 00 00 00
                          </a>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/terms"
            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Scale className="w-4 h-4" />
            Mentions Légales
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Retour à l'accueil
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
