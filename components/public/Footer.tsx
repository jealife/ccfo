"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function PublicFooter({ registrationsOpen }: { registrationsOpen: boolean }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (registrationsOpen) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
  }, [registrationsOpen]);

  return (
    <footer className="hidden lg:block bg-surface-inverse text-white pt-16 pb-10 relative overflow-hidden">
      {/* Subtle top border accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

      <div className="container mx-auto px-6 relative z-10">
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16", registrationsOpen ? "lg:grid-cols-4" : "lg:grid-cols-3")}>

          {/* Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <Image src="/Logo-CCFO-Blanc.png" alt="Logo CCFO" width={24} height={24} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tight font-outfit">CCFO<span className="text-primary">26</span></span>
                <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/50">Fieng Okano</span>
              </div>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              L’excellence du football au cœur du canton Fieng Okano. Un tournoi qui célèbre le talent, l’unité et la passion du sport amateur gabonais.
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon icon={<Globe className="w-4 h-4" />}  href="#" label="Site web" />
              <SocialIcon icon={<Mail className="w-4 h-4" />}   href="#" label="Email" />
              <SocialIcon icon={<Phone className="w-4 h-4" />}  href="#" label="Téléphone" />
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Navigation</h3>
            <ul className="space-y-3">
              <li><FooterLink href="/">Accueil</FooterLink></li>
              <li><FooterLink href="/matches">Matchs &amp; Résultats</FooterLink></li>
              <li><FooterLink href="/standings">Classement Officiel</FooterLink></li>
              <li><FooterLink href="/teams">Les Équipes</FooterLink></li>
              {registrationsOpen && <li><FooterLink href="/register">Inscriptions</FooterLink></li>}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-white/50 hover:text-white transition-colors">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Stade Central, Fieng Okano, Gabon</span>
              </li>
              <li>
                <a href="tel:+24100000000" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">+241 00 00 00 00</span>
                </a>
              </li>
              <li>
                <a href="mailto:contact@ccfo-gabon.com" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm">contact@ccfo-gabon.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* CTA */}
          {registrationsOpen && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Participez</h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Inscrivez votre équipe et participez à la plus grande compétition du canton.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              >
                Inscrire mon équipe
              </Link>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">

          {/* Copyright */}
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">
            © 2026 Coupe Cantonale Fieng Okano. Tous droits réservés.
          </p>

          {/* Toggle thème + liens */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-x-6 text-[9px] font-bold uppercase tracking-widest text-white/30">
              {!registrationsOpen && !isLoggedIn && (
                <>
                  <Link href="/login" className="hover:text-primary transition-colors">Connexion</Link>
                  <span className="text-white/10 hidden md:inline">·</span>
                </>
              )}
              <Link href="/terms"   className="hover:text-primary transition-colors">Mentions Légales</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
              <span className="text-white/10 hidden md:inline">·</span>
              <Link href="https://jealife.com" className="hover:text-primary transition-colors">JEaLiFe Agency</Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/50 hover:text-white transition-colors flex items-center gap-2 group"
    >
      <span className="w-1 h-1 rounded-full bg-primary/40 group-hover:bg-primary group-hover:scale-150 transition-all shrink-0" />
      {children}
    </Link>
  );
}

function SocialIcon({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
    >
      {icon}
    </Link>
  );
}
