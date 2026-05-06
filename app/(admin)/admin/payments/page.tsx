"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  FileText, 
  ExternalLink,
  Loader2,
  TrendingUp,
  Banknote
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { TeamDetailModal } from "@/components/admin/TeamDetailModal";
import { AlertDialog } from "@/components/ui/Modal";

export default function AdminPaymentsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alert, setAlert] = useState<{ isOpen: boolean; title: string; message: string; type: "success" | "error" | "warning" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "success"
  });
  const supabase = createClient();

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    
    // 1. Fetch teams with their associated payments
    const { data, error } = await supabase
      .from('teams')
      .select('*, payments(*)');

    if (!error && data) {
      setTeams(data);
      
      // 2. Auto-sync missing payment records for validated teams
      const missingPayments = data.filter(t => t.status === 'validated' && (!t.payments || t.payments.length === 0));
      if (missingPayments.length > 0) {
        for (const team of missingPayments) {
          await supabase.from('payments').upsert({
            team_id: team.id,
            amount: 400000,
            status: 'paid',
            created_at: team.created_at
          }, { onConflict: 'team_id' });
        }
        // Refresh after sync
        const { data: refreshedData } = await supabase.from('teams').select('*, payments(*)');
        if (refreshedData) setTeams(refreshedData);
      }
    }
    setLoading(false);
  }

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.village.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: teams.filter(t => t.status === 'pending').length,
    validated: teams.filter(t => t.status === 'validated').length,
    totalAmount: teams.filter(t => t.status === 'validated').length * 400000
  };

  const handleStatusUpdate = async (teamId: string, newStatus: string) => {
    const { error: teamError } = await supabase.from('teams').update({ status: newStatus }).eq('id', teamId);
    
    if (!teamError && newStatus === 'validated') {
      await supabase.from('payments').upsert({
        team_id: teamId,
        amount: 400000,
        status: 'paid',
        created_at: new Date().toISOString()
      }, { onConflict: 'team_id' });
    }

    if (teamError) {
      setAlert({
        isOpen: true,
        title: "Erreur",
        message: "Erreur lors de la mise à jour : " + teamError.message,
        type: "error"
      });
    } else {
      fetchPayments();
      setAlert({
        isOpen: true,
        title: "Succès",
        message: `L'équipe a été ${newStatus === 'validated' ? 'validée (Paiement 400k confirmé)' : 'rejetée'} avec succès.`,
        type: "success"
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Gestion des Paiements</h1>
          <p className="text-muted text-sm">Suivi des frais d'affiliation (400.000 FCFA / équipe).</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-primary transition-colors" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une équipe..." 
            className="w-full md:w-80 bg-white/5 border border-white/10 rounded-xl pl-12 pr-6 py-3 text-sm outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="En Attente" 
          value={stats.pending.toString()} 
          icon={<Clock className="text-yellow-500" />} 
          color="yellow" 
        />
        <StatCard 
          label="Recettes Validées" 
          value={`${stats.totalAmount.toLocaleString()} FCFA`} 
          icon={<Banknote className="text-green-500" />} 
          color="green" 
          trend="Equipes validées"
          trendValue={stats.validated.toString()}
        />
        <StatCard 
          label="Equipes Inscrites" 
          value={teams.length.toString()} 
          icon={<CreditCard className="text-primary" />} 
          color="primary" 
        />
      </div>

      <div className="sports-card bg-card/30 backdrop-blur-xl border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Équipe</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Village</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted">Reçu</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-center">Statut</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-20" />
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-muted italic text-sm">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : filteredTeams.map((team) => (
                <tr 
                  key={team.id} 
                  className="hover:bg-white/5 transition-colors group cursor-pointer"
                  onClick={() => {
                    setSelectedTeam(team);
                    setIsModalOpen(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs text-primary">
                        {team.name[0]}
                      </div>
                      <span className="font-bold text-sm uppercase tracking-tight">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-muted uppercase">{team.village}</td>
                  <td className="px-6 py-4">
                    {team.payment_receipt_url ? (
                      <a 
                        href={team.payment_receipt_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-[10px] font-black text-primary hover:underline"
                      >
                        <FileText className="w-3 h-3" /> VOIR REÇU
                      </a>
                    ) : (
                      <span className="text-[10px] font-black text-red-500/50">NON FOURNI</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                        team.status === 'validated' ? "bg-green-500/10 text-green-500" : 
                        team.status === 'rejected' ? "bg-red-500/10 text-red-500" :
                        "bg-yellow-500/10 text-yellow-500"
                      )}>
                        {team.status === 'validated' ? 'Payé' : team.status === 'rejected' ? 'Annulé' : 'Attente'}
                      </span>
                      {team.status === 'validated' && <span className="text-[8px] font-black text-green-500/60 uppercase">400.000 FCFA</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 text-muted hover:text-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(team);
                        setIsModalOpen(true);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTeam && (
        <TeamDetailModal 
          team={selectedTeam}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Alert Dialog */}
      <AlertDialog 
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type as any}
      />
    </div>
  );
}

function StatCard({ label, value, icon, color, trend, trendValue }: any) {
  return (
    <div className="sports-card p-6 bg-card/30 backdrop-blur-xl border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5", color === 'yellow' ? 'text-yellow-500' : color === 'green' ? 'text-green-500' : 'text-primary')}>
          {icon}
        </div>
        <TrendingUp className="w-4 h-4 opacity-10" />
      </div>
      <div>
        <div className="text-2xl font-black font-outfit uppercase tracking-tighter">{value}</div>
        <div className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">{label}</div>
      </div>
      {trend && (
        <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] font-bold">
          <span className="text-green-500">{trendValue}</span>
          <span className="text-muted">{trend}</span>
        </div>
      )}
    </div>
  );
}
