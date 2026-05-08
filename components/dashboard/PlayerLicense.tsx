import Image from "next/image";
import { cn } from "@/lib/utils";

interface PlayerLicenseProps {
  player: {
    firstName: string;
    lastName: string;
    team: string;
    number: string;
    position: string;
    village: string;
    nationality: string;
    photoUrl?: string;
  };
}

export function PlayerLicense({ player }: PlayerLicenseProps) {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  const villageCode = player.village.substring(0, 3).toUpperCase();
  const licenseNumber = `CCFO${yearSuffix}${villageCode}${player.number.padStart(2, '0')}`;

  return (
    <div className="w-[800px] h-[500px] relative rounded-4xl overflow-hidden shadow-2xl bg-black flex font-outfit text-white border-4 border-yellow-400/20">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image 
          src="/bg-licence-joueurs.png" 
          alt="Background" 
          fill 
          className="object-cover opacity-90"
          priority
        />
        {/* Subtle overlay for better readability if needed */}
        <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/20" />
      </div>

      {/* Top Header */}
      <div className="absolute top-8 left-0 right-0 px-12 flex justify-between items-start z-10">
        <div className="w-20 h-20 relative">
          <Image src="/Logo-CCFO-Blanc.png" alt="Logo CCFO" fill className="object-contain" priority />
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold uppercase tracking-tight text-white/80 leading-tight">
            BUREAU DIRECTEUR COUPE CANTONALE<br />
            FIENG OKANO - LASSIO {currentYear}
          </h3>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-yellow-400 mt-1 leading-none drop-shadow-lg">
            LICENCE JOUEUR
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 flex justify-evenly items-center px-12 pt-24 pb-20 gap-12 z-10">
        {/* Photo Container */}
        <div className="w-48 h-56 rounded-4xl overflow-hidden border-[6px] border-yellow-400 bg-zinc-800 shadow-2xl relative shrink-0">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt={`${player.firstName} ${player.lastName}`} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
               <UsersIcon className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Data Fields */}
        <div className="flex-1 space-y-2">
          <DataField label="ÉQUIPE" value={player.team} />
          <DataField label="NOM" value={player.lastName} />
          <DataField label="PRÉNOM" value={player.firstName} />
          <DataField label="NATIONALITÉ" value={player.nationality} />
          <DataField label="VILLAGE" value={player.village} />
          <DataField label="POSTE" value={player.position} />
          <DataField label="DOSSARD" value={player.number} />
        </div>
      </div>

      {/* License Number Footer - Centered */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-yellow-400 text-black px-8 py-2 rounded-xl shadow-2xl flex flex-col items-center min-w-[220px]">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1 text-black/60">NUMERO DE LICENCE</span>
          <span className="text-xl font-black font-mono tracking-tight">{licenseNumber}</span>
        </div>
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-base font-black uppercase text-white/40 min-w-[140px] tracking-widest">{label} :</span>
      <span className="text-lg font-black uppercase text-white tracking-normal drop-shadow-sm truncate max-w-[320px]">{value}</span>
    </div>
  );
}

function UsersIcon({ className }: any) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
