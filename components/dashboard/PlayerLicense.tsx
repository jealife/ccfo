import { Shield, MapPin, Calendar, Award } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlayerLicenseProps {
  player: {
    name: string;
    team: string;
    number: string;
    position: string;
    village: string;
    photoUrl?: string;
    idNumber: string;
  };
}

export function PlayerLicense({ player }: PlayerLicenseProps) {
  return (
    <div className="w-[400px] h-[250px] relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 shadow-2xl group flex">
      {/* Design Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] group-hover:bg-primary/30 transition-all" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-[50px]" />
      
      {/* Left Strip */}
      <div className="w-4 bg-primary h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 flex flex-col items-center py-4 gap-4">
          <Shield className="w-2 h-2 text-background fill-current" />
          <Shield className="w-2 h-2 text-background fill-current" />
          <Shield className="w-2 h-2 text-background fill-current" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
              <TrophyIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-black font-outfit uppercase tracking-tighter leading-none">CCFO 2026</h3>
              <p className="text-[8px] font-bold text-muted uppercase tracking-widest mt-1">Licence Officielle</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black uppercase tracking-widest text-muted">ID: {player.idNumber}</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary border border-white/10 relative">
            {player.photoUrl ? (
              <Image src={player.photoUrl} alt={player.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UsersIcon className="w-10 h-10 text-muted/30" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-background text-[10px] font-black text-center py-0.5">
              N° {player.number}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-black font-outfit uppercase leading-tight">{player.name}</h2>
            <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-wider">
              <Award className="w-3 h-3" />
              {player.position}
            </div>
            <div className="space-y-0.5 pt-1">
              <div className="flex items-center gap-1.5 text-muted">
                <Shield className="w-3 h-3" />
                <span className="text-[10px] font-bold">{player.team}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted">
                <MapPin className="w-3 h-3" />
                <span className="text-[10px] font-bold">{player.village}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
          <div className="flex gap-4">
            <div className="space-y-0.5">
              <p className="text-[6px] font-black text-muted uppercase tracking-widest">Expiration</p>
              <p className="text-[8px] font-bold">DEC 2026</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center p-1">
            {/* Mock QR Code */}
            <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0.5 opacity-40">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className={cn("bg-white", Math.random() > 0.5 ? "opacity-100" : "opacity-0")} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function UsersIcon({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
