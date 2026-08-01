"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  Trash2,
  AlertTriangle,
  Lock
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { updatePlayerPhoto, updateStaffPhoto } from "@/app/api/players/actions";
import { addPlayer, addStaff, deletePlayer, deleteStaff, updatePlayer, updateStaff } from "@/app/api/team/actions";
import { formatFrenchDate } from "@/lib/helpers";

const ROSTER_LOCKED_MSG =
  "Votre équipe est validée : l'effectif est figé. Contactez l'administration pour rouvrir l'accès.";

/** Chemin de photo (hors composant : Date.now() ne doit pas être appelé au rendu) */
function makePhotoPath(folder: "player-photos" | "staff-photos", id: string, ext: string | undefined) {
  return `${folder}/${id}-${Date.now()}.${ext}`;
}

type TeamRow = {
  id: string;
  name: string;
  village: string | null;
  status: string;
  president_name: string | null;
  registration_unlocked?: boolean | null;
};

type StaffRow = {
  id: string;
  team_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  origin_village: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
};

type PlayerRow = {
  id: string;
  team_id: string;
  full_name: string;
  jersey_number: string | number;
  position: string | null;
  origin_village: string | null;
  date_of_birth: string | null;
  photo_url: string | null;
};

export default function MyTeamPage() {
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersLimit, setPlayersLimit] = useState(24);
  const [staffLimit, setStaffLimit] = useState(6);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirm, setConfirm] = useState<{ type: "player" | "staff"; id: string; name: string } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchTeamData() {
    const { data: { user } } = await supabase.auth.getUser();

    const [teamRes, configRes] = await Promise.all([
      supabase.from('teams').select('*').eq('manager_id', user?.id).single(),
      supabase.from('tournament_config').select('players_per_team, staff_per_team').single(),
    ]);

    if (teamRes.data) {
      setTeam(teamRes.data);
      const [staffRes, playersRes] = await Promise.all([
        supabase.from('staff').select('*').eq('team_id', teamRes.data.id),
        supabase.from('players').select('*').eq('team_id', teamRes.data.id).order('jersey_number', { ascending: true }),
      ]);
      setStaff(staffRes.data || []);
      setPlayers(playersRes.data || []);
    }

    if (configRes.data) {
      setPlayersLimit(configRes.data.players_per_team || 24);
      setStaffLimit(configRes.data.staff_per_team || 6);
    }

    setLoading(false);
  }

  useEffect(() => {
    const kickoff = setTimeout(fetchTeamData, 0);
    return () => clearTimeout(kickoff);
    // chargement initial uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Id local d'une fiche en cours de création (non encore persistée)
  const DRAFT_ID = "__draft__";

  /**
   * Effectif figé : une fois l'équipe validée, le manager ne peut plus ajouter
   * ni retirer de joueurs / membres du staff. Corriger une fiche existante
   * reste possible. L'admin peut rouvrir l'accès (registration_unlocked).
   */
  const rosterLocked =
    !!team && ['validated', 'locked'].includes(team.status) && !team.registration_unlocked;

  /** Envoie un fichier dans le bucket et retourne son URL publique. */
  const uploadPhoto = async (
    folder: "player-photos" | "staff-photos",
    id: string,
    file: File
  ): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      showToast("Format non supporté. Utilisez JPG ou PNG.", "error");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Photo trop lourde (max 5 Mo)", "error");
      return null;
    }

    const filePath = makePhotoPath(folder, id, file.name.split('.').pop());
    const { error: uploadError } = await supabase.storage
      .from('team-docs')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showToast("Erreur upload : " + uploadError.message, "error");
      return null;
    }

    return supabase.storage.from('team-docs').getPublicUrl(filePath).data.publicUrl;
  };

  const handleUpdatePlayer = async (id: string, updates: PlayerRow) => {
    if (!team) return;

    // Brouillon : première sauvegarde → création côté serveur
    if (id === DRAFT_ID) {
      const result = await addPlayer({
        team_id: team.id,
        full_name: updates.full_name,
        jersey_number: updates.jersey_number,
        position: updates.position || "MIL",
        origin_village: updates.origin_village || "",
        date_of_birth: updates.date_of_birth || "",
      });
      if (result.success) {
        setPlayers(prev => prev.map(p => p.id === DRAFT_ID ? result.data : p));
        setEditingPlayerId(null);
        showToast("Joueur ajouté", "success");
      } else {
        showToast(result.error || "Erreur lors de l'ajout", "error");
      }
      return;
    }

    const result = await updatePlayer(id, team.id, {
      full_name: updates.full_name,
      jersey_number: updates.jersey_number,
      position: updates.position ?? undefined,
      origin_village: updates.origin_village ?? undefined,
      date_of_birth: updates.date_of_birth ?? undefined,
    });
    if (result.success) {
      setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPlayerId(null);
      showToast("Joueur mis à jour", "success");
    } else {
      showToast(result.error || "Erreur lors de la mise à jour", "error");
    }
  };

  const handleAddPlayer = () => {
    if (players.length >= playersLimit) {
      showToast(`Limite de ${playersLimit} joueurs atteinte`, "error");
      return;
    }
    if (rosterLocked) {
      showToast(ROSTER_LOCKED_MSG, "error");
      return;
    }
    // Un seul brouillon à la fois
    if (players.some(p => p.id === DRAFT_ID)) {
      setEditingPlayerId(DRAFT_ID);
      return;
    }

    // Pick next available jersey number
    const usedNumbers = new Set(players.map(p => parseInt(String(p.jersey_number))));
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) nextNumber++;

    if (!team) return;
    const draft: PlayerRow = {
      id: DRAFT_ID,
      team_id: team.id,
      full_name: "",
      jersey_number: nextNumber.toString(),
      position: "MIL",
      origin_village: team.village || "",
      date_of_birth: "",
      photo_url: null,
    };

    setPlayers(prev => [...prev, draft]);
    setEditingPlayerId(DRAFT_ID);
  };

  const handleCancelEdit = (playerId: string) => {
    if (playerId === DRAFT_ID) {
      setPlayers(prev => prev.filter(p => p.id !== DRAFT_ID));
    }
    setEditingPlayerId(null);
  };

  const handleDeletePlayer = async (playerId: string) => {
    setConfirm(null);
    if (!team) return;
    const result = await deletePlayer(playerId, team.id);
    if (result.success) {
      setPlayers(prev => prev.filter(p => p.id !== playerId));
      if (editingPlayerId === playerId) setEditingPlayerId(null);
      showToast("Joueur supprimé", "success");
    } else {
      showToast(result.error || "Erreur lors de la suppression", "error");
    }
  };

  const handleAddStaff = () => {
    if (staff.length >= staffLimit) {
      showToast(`Limite de ${staffLimit} membres atteinte`, "error");
      return;
    }
    if (rosterLocked) {
      showToast(ROSTER_LOCKED_MSG, "error");
      return;
    }
    if (!team) return;
    // Un seul brouillon à la fois — rien n'est écrit en base tant que le
    // membre n'a pas été renseigné et enregistré.
    if (staff.some(s => s.id === DRAFT_ID)) {
      setEditingStaffId(DRAFT_ID);
      return;
    }

    setStaff(prev => [...prev, {
      id: DRAFT_ID,
      team_id: team.id,
      first_name: "",
      last_name: "",
      role: "Assistant",
      origin_village: team.village || "",
      date_of_birth: "",
      photo_url: null,
    }]);
    setEditingStaffId(DRAFT_ID);
  };

  const handleUpdateStaff = async (id: string, updates: StaffRow) => {
    if (!team) return;

    if (id === DRAFT_ID) {
      const result = await addStaff({
        team_id: team.id,
        first_name: updates.first_name || "",
        last_name: updates.last_name || "",
        role: updates.role || "",
        origin_village: updates.origin_village || "",
        date_of_birth: updates.date_of_birth || "",
        photo_url: updates.photo_url,
      });
      if (result.success) {
        setStaff(prev => prev.map(s => s.id === DRAFT_ID ? result.data : s));
        setEditingStaffId(null);
        showToast("Membre ajouté", "success");
      } else {
        showToast(result.error || "Erreur lors de l'ajout", "error");
      }
      return;
    }

    const result = await updateStaff(id, team.id, {
      first_name: updates.first_name || "",
      last_name: updates.last_name || "",
      role: updates.role || "",
      origin_village: updates.origin_village || "",
      date_of_birth: updates.date_of_birth || "",
    });
    if (result.success) {
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      setEditingStaffId(null);
      showToast("Membre mis à jour", "success");
    } else {
      showToast(result.error || "Erreur lors de la mise à jour", "error");
    }
  };

  const handleCancelStaffEdit = (staffId: string) => {
    if (staffId === DRAFT_ID) {
      setStaff(prev => prev.filter(s => s.id !== DRAFT_ID));
    }
    setEditingStaffId(null);
  };

  const handleStaffPhotoUpload = async (id: string, file: File): Promise<boolean> => {
    if (id === DRAFT_ID) {
      showToast("Enregistrez d'abord le membre avant d'ajouter une photo", "error");
      return false;
    }
    const url = await uploadPhoto("staff-photos", id, file);
    if (!url) return false;

    const result = await updateStaffPhoto(id, url);
    if (!result.success) {
      showToast(`Erreur : ${result.error}`, "error");
      return false;
    }

    setStaff(prev => prev.map(s => s.id === id ? { ...s, photo_url: url } : s));
    showToast("Photo mise à jour", "success");
    return true;
  };

  const handleDeleteStaff = async (staffId: string) => {
    setConfirm(null);
    if (!team) return;
    const result = await deleteStaff(staffId, team.id);
    if (result.success) {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      showToast("Membre supprimé", "success");
    } else {
      showToast(result.error || "Erreur lors de la suppression", "error");
    }
  };

  const handlePhotoUpload = async (id: string, file: File): Promise<boolean> => {
    if (id === DRAFT_ID) {
      showToast("Enregistrez d'abord le joueur avant d'ajouter une photo", "error");
      return false;
    }
    const url = await uploadPhoto("player-photos", id, file);
    if (!url) return false;

    const result = await updatePlayerPhoto(id, url);
    if (!result.success) {
      showToast(`Erreur : ${result.error}`, "error");
      return false;
    }

    setPlayers(prev => prev.map(p => p.id === id ? { ...p, photo_url: url } : p));
    showToast("Photo mise à jour", "success");
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
      <p className="text-muted">Aucune équipe trouvée. Veuillez d’abord compléter l’inscription.</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-24 relative">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold transition-all animate-fade-in",
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 space-y-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-black text-lg">Supprimer ?</h3>
                <p className="text-sm text-muted">{confirm.name}</p>
              </div>
            </div>
            <p className="text-sm text-muted">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => confirm.type === "player" ? handleDeletePlayer(confirm.id) : handleDeleteStaff(confirm.id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-black hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
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
              <h1 className="text-xl md:text-4xl lg:text-5xl font-black font-outfit uppercase tracking-tighter">{team.name}</h1>
              {(() => {
                const statusMap: Record<string, { label: string; cls: string }> = {
                  validated: { label: "Validé", cls: "bg-green-500/10 text-green-500 border-green-500/20" },
                  pending:   { label: "En attente", cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
                  incomplete: { label: "Incomplet", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
                  rejected:  { label: "Rejeté", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
                  locked:    { label: "Verrouillé", cls: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
                };
                const s = statusMap[team.status] ?? { label: team.status, cls: "bg-white/5 text-muted border-white/10" };
                return (
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${s.cls}`}>
                    {s.label}
                  </span>
                );
              })()}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted font-bold text-sm">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {team.village}</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-accent" /> {team.president_name}</span>
            </div>
          </div>
        </div>
        <Users className="absolute -bottom-10 -right-10 w-48 md:w-64 h-48 md:h-64 text-white/5 rotate-12" />
      </div>

      {/* Effectif figé après validation */}
      {rosterLocked && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-500">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-black uppercase tracking-widest">Effectif figé</span>
            <p className="opacity-80 mt-0.5 font-medium">
              Votre équipe est validée : vous ne pouvez plus ajouter ni retirer de joueurs
              ou de membres du staff. Vous pouvez toujours corriger les fiches existantes.
              Contactez l&apos;administration pour rouvrir l&apos;accès.
            </p>
          </div>
        </div>
      )}

      {/* Staff Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className="text-lg md:text-2xl font-black font-outfit uppercase tracking-tighter">
              Staff Technique <span className="text-primary text-[10px] md:text-sm ml-2">({staff.length}/{staffLimit})</span>
            </h2>
          </div>
          <button
            onClick={handleAddStaff}
            disabled={staff.length >= staffLimit || rosterLocked}
            title={rosterLocked ? ROSTER_LOCKED_MSG : undefined}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
              staff.length >= staffLimit || rosterLocked
                ? "bg-white/5 border-white/5 text-muted cursor-not-allowed opacity-50"
                : "text-primary bg-primary/5 border-primary/10 hover:bg-primary/10"
            )}
          >
            {rosterLocked ? <Lock className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {rosterLocked ? "Figé" : staff.length >= staffLimit ? "Quota Atteint" : "Ajouter"}
          </button>
        </div>
        {staff.length === 0 ? (
          <p className="text-muted text-sm italic px-1">Aucun membre du staff enregistré.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                member={member}
                isEditing={editingStaffId === member.id}
                canDelete={!rosterLocked}
                onEdit={() => setEditingStaffId(member.id)}
                onCancel={() => handleCancelStaffEdit(member.id)}
                onSave={(updates) => handleUpdateStaff(member.id, updates)}
                onPhotoUpload={(file) => handleStaffPhotoUpload(member.id, file)}
                onDelete={() => setConfirm({ type: "staff", id: member.id, name: `${member.first_name} ${member.last_name}` })}
              />
            ))}
          </div>
        )}
      </section>

      {/* Players Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-white/5 flex items-center justify-center text-accent border border-white/5">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className="text-lg md:text-2xl font-black font-outfit uppercase tracking-tighter">
              Effectif <span className="text-primary text-[10px] md:text-sm ml-2">{players.length}/{playersLimit}</span>
            </h2>
          </div>
          <button
            onClick={handleAddPlayer}
            disabled={players.length >= playersLimit || rosterLocked}
            title={rosterLocked ? ROSTER_LOCKED_MSG : undefined}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
              players.length >= playersLimit || rosterLocked
                ? "bg-white/5 border-white/5 text-muted cursor-not-allowed opacity-50"
                : "text-primary bg-primary/5 border-primary/10 hover:bg-primary/10"
            )}
          >
            {rosterLocked ? <Lock className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {rosterLocked ? "Figé" : players.length >= playersLimit ? "Quota Atteint" : "Ajouter"}
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
                canDelete={!rosterLocked}
                onEdit={() => setEditingPlayerId(player.id)}
                onCancel={() => handleCancelEdit(player.id)}
                onSave={(updates) => handleUpdatePlayer(player.id, updates)}
                onPhotoUpload={(file) => handlePhotoUpload(player.id, file)}
                onDelete={() => setConfirm({ type: "player", id: player.id, name: player.full_name })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


/** Petit champ étiqueté, partagé par les cartes joueur et staff. */
function Field({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-muted">{label}</label>
      {children}
      {error && <p className="text-[9px] text-red-400">{error}</p>}
    </div>
  );
}

const inputCls = (hasError?: boolean) => cn(
  "w-full bg-white/5 border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-primary transition-colors",
  hasError ? "border-red-500" : "border-white/10"
);

/** Vignette photo cliquable (upload). */
function PhotoThumb({ url, alt, uploading, onFile, className }: {
  url: string | null;
  alt: string;
  uploading: boolean;
  onFile: (file: File) => void;
  className?: string;
}) {
  return (
    <label className={cn(
      "relative shrink-0 rounded-xl overflow-hidden bg-secondary/60 border border-white/10 cursor-pointer group/photo",
      className
    )}>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {url ? (
        <Image src={url} alt={alt} fill sizes="80px" className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted/40">
          <User className="w-6 h-6 stroke-[1.5px]" />
        </div>
      )}
      {uploading ? (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
      )}
    </label>
  );
}

function PlayerCard({ player, isEditing, canDelete, onEdit, onCancel, onSave, onPhotoUpload, onDelete }: {
  player: PlayerRow;
  isEditing: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: PlayerRow) => void;
  onPhotoUpload: (file: File) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [edited, setEdited] = useState(player);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resynchronise l'état local quand le joueur change
  const [prev, setPrev] = useState(player);
  if (prev !== player) {
    setPrev(player);
    setEdited(player);
    setErrors({});
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!edited.full_name.trim() || edited.full_name === "Nouveau Joueur") errs.full_name = "Nom requis";
    const num = parseInt(String(edited.jersey_number));
    if (isNaN(num) || num < 1 || num > 99) errs.jersey_number = "1–99";
    if (!edited.date_of_birth) errs.date_of_birth = "Requise";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    await onPhotoUpload(file);
    setUploading(false);
  };

  return (
    <div className={cn(
      "rounded-xl bg-card/40 border backdrop-blur-xl transition-all group",
      isEditing ? "ring-2 ring-primary border-transparent" : "border-white/5 hover:border-primary/30"
    )}>
      {/* Ligne compacte */}
      <div className="p-3 flex items-center gap-3">
        <PhotoThumb
          url={player.photo_url}
          alt={player.full_name || "Joueur"}
          uploading={uploading}
          onFile={handleFile}
          className="w-14 h-16"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">
              {player.jersey_number || "?"}
            </span>
            <h3 className="font-black font-outfit uppercase tracking-tight text-sm truncate">
              {player.full_name || <span className="text-muted italic normal-case">Nouveau joueur</span>}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-black uppercase tracking-widest">
            <span className="text-primary">{player.position || "—"}</span>
            <span className="text-muted/40">•</span>
            <span className="text-muted">{player.origin_village || "—"}</span>
            {player.date_of_birth ? (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-muted">{formatFrenchDate(player.date_of_birth, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </>
            ) : (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-red-400/70">Date manquante</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button onClick={() => { if (validate()) onSave(edited); }} className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform" title="Enregistrer">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onCancel} className="p-2 bg-white/5 text-muted hover:text-white rounded-lg transition-all" title="Annuler">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="p-2 bg-white/5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Modifier">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {canDelete && (
                <button onClick={onDelete} className="p-2 bg-white/5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100" title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulaire complet, uniquement en édition */}
      {isEditing && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <Field label="Nom complet" error={errors.full_name}>
              <input
                type="text"
                value={edited.full_name}
                className={inputCls(!!errors.full_name)}
                onChange={(e) => setEdited({ ...edited, full_name: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Numéro" error={errors.jersey_number}>
            <input
              type="number"
              min="1"
              max="99"
              value={edited.jersey_number}
              className={inputCls(!!errors.jersey_number)}
              onChange={(e) => setEdited({ ...edited, jersey_number: e.target.value })}
            />
          </Field>
          <Field label="Poste">
            <select
              value={edited.position ?? ""}
              className={inputCls()}
              onChange={(e) => setEdited({ ...edited, position: e.target.value })}
            >
              <option value="GB">GB (Gardien)</option>
              <option value="DEF">DEF (Défenseur)</option>
              <option value="MIL">MIL (Milieu)</option>
              <option value="ATT">ATT (Attaquant)</option>
            </select>
          </Field>
          <Field label="Village">
            <input
              type="text"
              value={edited.origin_village ?? ""}
              className={inputCls()}
              onChange={(e) => setEdited({ ...edited, origin_village: e.target.value })}
            />
          </Field>
          <Field label="Date de naissance" error={errors.date_of_birth}>
            <input
              type="date"
              value={edited.date_of_birth ?? ""}
              className={inputCls(!!errors.date_of_birth)}
              onChange={(e) => setEdited({ ...edited, date_of_birth: e.target.value })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function StaffCard({ member, isEditing, canDelete, onEdit, onCancel, onSave, onPhotoUpload, onDelete }: {
  member: StaffRow;
  isEditing: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (updates: StaffRow) => void;
  onPhotoUpload: (file: File) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [edited, setEdited] = useState(member);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prev, setPrev] = useState(member);
  if (prev !== member) {
    setPrev(member);
    setEdited(member);
    setErrors({});
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!edited.first_name?.trim()) errs.first_name = "Prénom requis";
    if (!edited.last_name?.trim()) errs.last_name = "Nom requis";
    if (!edited.role?.trim()) errs.role = "Rôle requis";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    await onPhotoUpload(file);
    setUploading(false);
  };

  const displayName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();

  return (
    <div className={cn(
      "rounded-xl bg-card/40 border backdrop-blur-xl transition-all group",
      isEditing ? "ring-2 ring-primary border-transparent" : "border-white/5 hover:border-primary/30"
    )}>
      <div className="p-3 flex items-center gap-3">
        <PhotoThumb
          url={member.photo_url}
          alt={displayName || "Membre du staff"}
          uploading={uploading}
          onFile={handleFile}
          className="w-14 h-16"
        />

        <div className="min-w-0 flex-1">
          <h3 className="font-black font-outfit uppercase tracking-tight text-sm truncate">
            {displayName || <span className="text-muted italic normal-case">Nouveau membre</span>}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-black uppercase tracking-widest">
            <span className="text-primary">{member.role || "—"}</span>
            <span className="text-muted/40">•</span>
            <span className="text-muted">{member.origin_village || "—"}</span>
            {member.date_of_birth && (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-muted">{formatFrenchDate(member.date_of_birth, { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isEditing ? (
            <>
              <button onClick={() => { if (validate()) onSave(edited); }} className="p-2 bg-green-500 text-white rounded-lg hover:scale-110 transition-transform" title="Enregistrer">
                <Save className="w-3.5 h-3.5" />
              </button>
              <button onClick={onCancel} className="p-2 bg-white/5 text-muted hover:text-white rounded-lg transition-all" title="Annuler">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={onEdit} className="p-2 bg-white/5 text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Modifier">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              {canDelete && (
                <button onClick={onDelete} className="p-2 bg-white/5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100" title="Supprimer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 grid grid-cols-2 gap-2">
          <Field label="Prénom" error={errors.first_name}>
            <input
              type="text"
              value={edited.first_name ?? ""}
              className={inputCls(!!errors.first_name)}
              onChange={(e) => setEdited({ ...edited, first_name: e.target.value })}
            />
          </Field>
          <Field label="Nom" error={errors.last_name}>
            <input
              type="text"
              value={edited.last_name ?? ""}
              className={inputCls(!!errors.last_name)}
              onChange={(e) => setEdited({ ...edited, last_name: e.target.value })}
            />
          </Field>
          <Field label="Rôle" error={errors.role}>
            <input
              type="text"
              placeholder="Coach, Assistant…"
              value={edited.role ?? ""}
              className={inputCls(!!errors.role)}
              onChange={(e) => setEdited({ ...edited, role: e.target.value })}
            />
          </Field>
          <Field label="Village">
            <input
              type="text"
              value={edited.origin_village ?? ""}
              className={inputCls()}
              onChange={(e) => setEdited({ ...edited, origin_village: e.target.value })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Date de naissance">
              <input
                type="date"
                value={edited.date_of_birth ?? ""}
                className={inputCls()}
                onChange={(e) => setEdited({ ...edited, date_of_birth: e.target.value })}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
