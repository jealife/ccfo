import type { Metadata } from "next";
import type { ElementType } from "react";
import Link from "next/link";
import { Scale, ChevronRight, Shield, FileText, Mail, Phone } from "lucide-react";

type ContentBlock =
  | { type: "text"; value: string }
  | { type: "list"; items: string[] }
  | { type: "dl"; items: { label: string; value: string }[] }
  | { type: "contact" };

type Section = {
  id: string;
  title: string;
  content: ContentBlock[];
  icon?: ElementType;
};

export const metadata: Metadata = {
  title: "Mentions Légales | CCFO26",
  description: "Mentions légales de la plateforme officielle de la Coupe Cantonale Fieng Okano 2026.",
  robots: { index: false },
};

const SECTIONS: Section[] = [
  {
    id: "editeur",
    title: "1. Éditeur du site",
    content: [
      {
        type: "text",
        value:
          "Le site web <strong>www.coupecantonalefiengokano.ga</strong> est édité par l'organisation de la Coupe Cantonale Fieng Okano (CCFO), association sportive non-commerciale basée au Gabon.",
      },
      {
        type: "dl",
        items: [
          { label: "Dénomination", value: "Coupe Cantonale Fieng Okano — CCFO26" },
          { label: "Adresse", value: "Stade Central, Fieng Okano, Gabon" },
          { label: "Téléphone", value: "+241 66 75 03 29" },
          { label: "Email", value: "contact@ccfo-gabon.com" },
          { label: "Directeur de la publication", value: "Organisateur de la CCFO26" },
        ],
      },
    ],
  },
  {
    id: "hebergeur",
    title: "2. Hébergement",
    content: [
      {
        type: "text",
        value:
          "Le site est hébergé par <strong>Vercel Inc.</strong>, société américaine dont le siège social est situé au 340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis. La base de données est gérée par <strong>Supabase Inc.</strong>",
      },
    ],
  },
  {
    id: "objet",
    title: "3. Objet du site",
    content: [
      {
        type: "text",
        value:
          "Ce site a pour objectif de fournir des informations relatives à la Coupe Cantonale Fieng Okano 2026, notamment : les résultats des matchs en temps réel, le classement officiel des équipes, le calendrier de la compétition, les inscriptions des équipes et joueurs, ainsi que les actualités du tournoi.",
      },
    ],
  },
  {
    id: "propriete",
    title: "4. Propriété intellectuelle",
    content: [
      {
        type: "text",
        value:
          "L'ensemble des contenus présents sur ce site (textes, images, logos, structure, design) sont la propriété exclusive de l'organisation CCFO26 ou de leurs auteurs respectifs. Toute reproduction, distribution, modification ou utilisation à des fins commerciales est strictement interdite sans autorisation écrite préalable.",
      },
      {
        type: "text",
        value:
          "Les statistiques, scores et résultats publiés sont le fruit du travail de l'organisation et des arbitres officiels du tournoi.",
      },
    ],
  },
  {
    id: "responsabilite",
    title: "5. Limitation de responsabilité",
    content: [
      {
        type: "text",
        value:
          "L'organisation CCFO26 s'efforce de maintenir les informations à jour et exactes. Cependant, elle ne saurait être tenue responsable des éventuelles erreurs, omissions ou inexactitudes présentes sur le site, ni des dommages directs ou indirects résultant de l'utilisation de ces informations.",
      },
      {
        type: "text",
        value:
          "L'organisation se réserve le droit de modifier, corriger ou supprimer tout contenu à tout moment et sans préavis.",
      },
    ],
  },
  {
    id: "liens",
    title: "6. Liens hypertextes",
    content: [
      {
        type: "text",
        value:
          "Le site peut contenir des liens vers des sites tiers. L'organisation CCFO26 n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leurs pratiques en matière de confidentialité, ou leur disponibilité.",
      },
    ],
  },
  {
    id: "droit",
    title: "7. Droit applicable",
    content: [
      {
        type: "text",
        value:
          "Le présent site et ses mentions légales sont soumis au droit gabonais. En cas de litige, et à défaut d'accord amiable, les tribunaux compétents de la République Gabonaise seront seuls compétents.",
      },
    ],
  },
  {
    id: "contact",
    title: "8. Contact",
    content: [
      {
        type: "text",
        value:
          "Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :",
      },
      {
        type: "contact",
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="bg-background pt-16 pb-24 lg:pb-16 min-h-dvh">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-surface-inverse">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #CC1F2B 0%, transparent 50%), radial-gradient(circle at 80% 50%, #E8A52A 0%, transparent 50%)" }}
        />
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

        <div className="container mx-auto px-4 py-14 lg:py-20 relative z-10">
          <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-widest mb-6">
            <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary">Mentions Légales</span>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-white font-outfit">
                Mentions Légales
              </h1>
              <p className="text-white/40 text-sm mt-1">Dernière mise à jour : juillet 2026</p>
            </div>
          </div>

          <p className="text-white/60 text-sm max-w-2xl leading-relaxed mt-4">
            Conformément aux dispositions légales en vigueur, voici les informations relatives à l'éditeur et à l'hébergement de ce site.
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Table of contents */}
        <div className="glass-card p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-primary" />
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
        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-lg font-black text-foreground mb-4 pb-3 border-b border-border flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shrink-0" />
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
                  if (block.type === "dl" && block.items) {
                    return (
                      <dl key={i} className="glass-card divide-y divide-border overflow-hidden">
                        {block.items.map((item, j) => (
                          <div key={j} className="flex flex-col sm:flex-row sm:items-center px-5 py-3 gap-1 sm:gap-4">
                            <dt className="text-[10px] font-black uppercase tracking-widest text-primary w-40 shrink-0">
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
          ))}
        </div>

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/privacy"
            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Politique de confidentialité
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
