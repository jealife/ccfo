"use client";

import Link from "next/link";
import { Trophy, Mail, Phone, MapPin, Globe, ChevronRight } from "lucide-react";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer className="bg-background border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
          
          {/* BRAND SECTION */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                <Image src="/Logo-CCFO-Blanc.png" alt="Logo" width={28} height={28} className="brightness-200" />
              </div>
              <div className="flex flex-col">
                <span className="font-outfit font-black text-3xl tracking-tighter leading-none text-white">CCFO</span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Okano 2026</span>
              </div>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              L'excellence du football au cœur du canton Fieng Okano. Un tournoi qui célèbre le talent, l'unité et la passion du sport amateur gabonais.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink icon={<Globe className="w-5 h-5" />} href="#" />
              <SocialLink icon={<Mail className="w-5 h-5" />} href="#" />
              <SocialLink icon={<Phone className="w-5 h-5" />} href="#" />
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2 inline-block">Navigation</h3>
            <ul className="space-y-4">
              <FooterLink href="/">Accueil</FooterLink>
              <FooterLink href="/matches">Matchs & Résultats</FooterLink>
              <FooterLink href="/standings">Classement Officiel</FooterLink>
              <FooterLink href="/teams">Les Équipes</FooterLink>
              <FooterLink href="/register">Inscriptions</FooterLink>
            </ul>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2 inline-block">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group text-muted hover:text-white transition-colors cursor-pointer">
                <MapPin className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">Stade Central, Fieng Okano, Gabon</span>
              </li>
              <li className="flex items-center gap-3 group text-muted hover:text-white transition-colors cursor-pointer">
                <Phone className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">+241 00 00 00 00</span>
              </li>
              <li className="flex items-center gap-3 group text-muted hover:text-white transition-colors cursor-pointer">
                <Mail className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">contact@ccfo-gabon.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted">
          <p>© 2026 COUPE CANTONALE FIENG OKANO. TOUS DROITS RÉSERVÉS.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link href="/terms" className="hover:text-primary transition-colors">Mentions Légales</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Confidentialité</Link>
            <span className="text-primary/20 hidden md:inline">•</span>
            <span className="flex items-center gap-2">
              DESIGNED BY <span className="text-white hover:text-primary transition-colors cursor-pointer">
                <Link href="https://jealife.com">
                  JEaLiFe Agency
                </Link>
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm font-medium text-muted hover:text-primary flex items-center gap-2 group transition-colors">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/20 group-hover:bg-primary group-hover:scale-150 transition-all" />
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ icon, href }: { icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 hover:-translate-y-1 shadow-lg">
      {icon}
    </Link>
  );
}
