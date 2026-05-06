"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Camera, 
  Save, 
  X, 
  MapPin, 
  Activity,
  Award,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updatePlayerPhoto } from "@/app/api/players/actions";
import { addPlayer, addStaff } from "@/app/api/team/actions";

export default function MyTeamPage() {
  const [team, setTeam] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function fetchTeamData() {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('manager_id', user?.id)
      .single();

    if (teamData) {
      setTeam(teamData);
      const { data: staffData } = await supabase.from('staff').select('*').eq('team_id', teamData.id);
      const { data: playersData } = await supabase.from('players').select('*').eq('team_id', teamData.id).order('jersey_number', { ascending: true });
      setStaff(staffData || []);
      setPlayers(playersData || []);
    }
    setLoading(false);
  }

  const handleUpdatePlayer = async (id: string, updates: any) => {
    const { error } = await supabase.from('players').update(updates).eq('id', id);
    if (!error) {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPlayerId(null);
      showToast("Joueur mis à jour ✓", "success");
    } else {
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleAddPlayer = async () => {
    if (players.length >= 24) {
      showToast("Limite de 24 joueurs atteinte", "error");
      return;
    }

    const newPlayer = {
      team_id: team.id,
      full_name: "Nouveau Joueur",
      jersey_number: (players.length + 1).toString(),
      position: "MID",
      origin_village: team.village
    };

    const result = await addPlayer(newPlayer);
    
    if (!result.success) {
      showToast(result.error || "Erreur lors de l'ajout", "error");
    } else {
      setPlayers(prev => [...prev, result.data]);
      setEditingPlayerId(result.data.id);
      showToast("Joueur ajouté ✓", "success");
    }
  };

  const handleAddStaff = async () => {
    const { data: configData } = await supabase.from('tournament_config').select('staff_per_team').single();
    const staffLimit = configData?.staff_per_team || 6;

    if (staff.length >= staffLimit) {
      showToast(`Limite de ${staffLimit} membres atteinte`, "error");
      return;
    }

    const newMember = {
      team_id: team.id,
      first_name: "Nouveau",
      last_name: "Membre",
      role: "Assistant"
    };

    const result = await addStaff(newMember);
    
    if (!result.success) {
      showToast(result.error || "Erreur lors de l'ajout", "error");
    } else {
      setStaff(prev => [...prev, result.data]);
      showToast("Membre ajouté ✓", "success");
    }
  };

  const handlePhotoUpload = async (id: string, file: File): Promise<boolean> => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      showToast("Format non supporté. Utilisez JPG ou PNG.", "error");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Photo trop lourde (max 5 Mo)", "error");
      return false;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;
    const filePath = `player-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-docs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast("Erreur upload : " + uploadError.message, "error");
      return false;
    }

    if (!id) {
      console.error('[photo_upload] Missing player ID');
      showToast("ID joueur manquant", "error");
      return false;
    }

    const { data: { publicUrl } } = supabase.storage.from('team-docs').getPublicUrl(filePath);
    
    console.log('[photo_upload] Attempting DB update for ID:', id, 'with URL:', publicUrl);

    const result = await updatePlayerPhoto(id, publicUrl);
    
    if (!result.success) {
      console.error('[photo_upload] Server action failed:', result.error);
      showToast(`Erreur Serveur : ${result.error}`, "error");
      return false;
    }

    // Update local state immediately
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, photo_url: publicUrl } : p));
    showToast("Photo mise à jour ✓", "success");
    return true;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  
  if (!team) return (
    <div className="p-20 text-center space-y-4">
      <AlertCircle className="w-16 h-16 mx-auto text-muted/30" />
      <p className="text-muted">Aucune équipe trouvée. Veuillez d'abord compléter l'inscription.</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-24 relative">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-100 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all animate-fade-in",
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Team Header */}
      <div className="relative p-6 md:p-10 rounded-xl bg-linear-to-br from-primary/20 to-accent/5 border border-primary/20 overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-background border-4 border-primary/20 flex items-center justify-center text-4xl md:text-5xl font-black text-primary shadow-2xl shrink-0">
            {team.name[0]}
          </div>
          <div className="text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black font-outfit uppercase tracking-tighter">{team.name}</h1>
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                {team.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted font-bold text-sm">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {team.village}</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-accent" /> {team.president_name}</span>
            </div>
          </div>
        </div>
        <Users className="absolute -bottom-10 -right-10 w-48 md:w-64 h-48 md:h-64 text-white/5 rotate-12" />
      </div>

      {/* Staff Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-black font-outfit uppercase tracking-tighter">Staff Technique <span className="text-primary text-sm ml-2">({staff.length}/6)</span></h2>
          </div>
          <button 
            onClick={handleAddStaff}
            disabled={staff.length >= 6}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
              staff.length >= 6 
                ? "bg-white/5 border-white/5 text-muted cursor-not-allowed opacity-50" 
                : "text-primary bg-primary/5 border-primary/10 hover:bg-primary/10"
            )}
          >
            <UserPlus className="w-3 h-3" /> {staff.length >= 6 ? "Quota Atteint" : "Ajouter"}
          </button>
        </div>
        {staff.length === 0 ? (
          <p className="text-muted text-sm italic px-1">Aucun membre du staff enregistré.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {staff.map((member) => (
              <div key={member.id} className="sports-card p-4 flex items-center gap-4 bg-card/30 hover:border-primary/20 transition-all group">
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center font-bold text-muted group-hover:text-primary transition-colors shrink-0">
                  {member.first_name?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm tracking-tight truncate">{member.first_name} {member.last_name}</div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Players Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-accent border border-white/5">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl md:text-2xl font-black font-outfit uppercase tracking-tighter">
              Effectif <span className="text-primary">{players.length}/24</span>
            </h2>
          </div>
          <button 
            onClick={handleAddPlayer}
            disabled={players.length >= 24}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
              players.length >= 24
                ? "bg-white/5 border-white/5 text-muted cursor-not-allowed opacity-50"
                : "text-primary bg-primary/5 border-primary/10 hover:bg-primary/10"
            )}
          >
            <UserPlus className="w-3 h-3" /> {players.length >= 24 ? "Quota Atteint" : "Ajouter"}
          </button>
        </div>

        {players.length === 0 ? (
          <div className="py-16 text-center sports-card space-y-3">
            <User className="w-12 h-12 mx-auto text-muted/20" />
            <p className="text-muted text-sm">Aucun joueur enregistré.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isEditing={editingPlayerId === player.id}
                onEdit={() => setEditingPlayerId(player.id)}
                onCancel={() => setEditingPlayerId(null)}
                onSave={(updates: any) => handleUpdatePlayer(player.id, updates)}
                onPhotoUpload={(file: File) => handlePhotoUpload(player.id, file)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PlayerCard({ player, isEditing, onEdit, onCancel, onSave, onPhotoUpload }: any) {
  const [editedPlayer, setEditedPlayer] = useState(player);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when parent updates player (after photo upload)
  useEffect(() => {
    setEditedPlayer(player);
  }, [player]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onPhotoUpload(file);
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl transition-all duration-500",
      "bg-card/40 border border-white/5 backdrop-blur-xl",
      isEditing ? "ring-2 ring-primary border-transparent" : "hover:border-primary/30"
    )}>
      {/* Header Info */}
      <div className="p-4 md:p-6 pb-3 flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center font-black text-lg text-white shadow-xl shadow-primary/20 shrink-0">
            {isEditing ? (
              <input
                type="text"
                value={editedPlayer.jersey_number}
                className="w-full bg-transparent text-center outline-none font-black"
                onChange={(e) => setEditedPlayer({ ...editedPlayer, jersey_number: e.target.value })}
              />
            ) : player.jersey_number}
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editedPlayer.full_name}
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 font-bold text-sm outline-none focus:border-primary"
                onChange={(e) => setEditedPlayer({ ...editedPlayer, full_name: e.target.value })}
              />
            ) : (
              <h3 className="font-black font-outfit uppercase tracking-tight text-base truncate">{player.full_name}</h3>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {isEditing ? (
                <select
                  value={editedPlayer.position}
                  className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-black uppercase outline-none"
                  onChange={(e) => setEditedPlayer({ ...editedPlayer, position: e.target.value })}
                >
                  <option value="GB">GB (Gardien)</option>
                  <option value="DEF">DEF (Défenseur)</option>
                  <option value="MIL">MIL (Milieu)</option>
                  <option value="ATT">ATT (Attaquant)</option>
                </select>
              ) : (
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{player.position}</span>
              )}
              <span className="text-[10px] text-muted">•</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedPlayer.origin_village}
                  className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] font-black uppercase outline-none"
                  onChange={(e) => setEditedPlayer({ ...editedPlayer, origin_village: e.target.value })}
                />
              ) : (
                <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{player.origin_village}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {isEditing ? (
            <>
              <button onClick={() => onSave(editedPlayer)} className="p-2 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:scale-110 transition-transform">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={onCancel} className="p-2 bg-white/5 text-muted hover:text-white rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={onEdit} className="p-2 bg-white/5 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Photo Section */}
      <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2">
        <div className="relative aspect-4/3 w-full rounded-xl bg-secondary/50 overflow-hidden">
          {/* Photo ou placeholder */}
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted/30 gap-3">
              <User className="w-16 h-16 stroke-[1px]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted/40">Aucune photo</span>
            </div>
          )}

          {/* Upload overlay — visible sur hover (desktop) ET via bouton toujours visible en bas (mobile) */}
          {uploading ? (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          ) : (
            <>
              {/* Overlay hover desktop */}
              <label className="absolute inset-0 bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden items-center justify-center cursor-pointer backdrop-blur-sm">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <div className="flex flex-col items-center gap-2 text-white">
                  <Camera className="w-8 h-8" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Changer la photo</span>
                </div>
              </label>

              {/* Bouton caméra toujours visible sur mobile */}
              <label className="md:hidden absolute bottom-2 right-2 bg-primary text-white p-2.5 rounded-xl cursor-pointer shadow-lg shadow-primary/30 active:scale-95 transition-transform">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <Camera className="w-4 h-4" />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
    </div>
  );
}
