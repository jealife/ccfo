"use client";

import { Users, Search, Filter, Download } from "lucide-react";

export default function AdminStaffPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Staff Technique</h1>
          <p className="text-muted text-sm">Supervisez tous les membres du staff des équipes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              placeholder="Rechercher..." 
              className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-primary outline-none transition-all w-full md:w-64"
            />
          </div>
        </div>
      </div>

      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="py-20 text-center text-muted">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm italic">Liste globale du staff technique à venir.</p>
        </div>
      </div>
    </div>
  );
}
