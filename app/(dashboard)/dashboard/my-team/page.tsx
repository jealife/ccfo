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
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function MyTeamPage() {
  const [team, setTeam] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
      setPlayers(players.map(p => p.id === id ? { ...p, ...updates } : p));
      setEditingPlayerId(null);
    }
  };

  const handlePhotoUpload = async (id: string, file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Math.random()}.${fileExt}`;
    const filePath = `player-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('team-docs')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('team-docs').getPublicUrl(filePath);
      await handleUpdatePlayer(id, { photo_url: publicUrl });
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Chargement de votre équipe...</div>;
  if (!team) return <div className="p-20 text-center">Aucune équipe trouvée. Veuillez d'abord compléter l'inscription.</div>;

  return (
    <div className="space-y-12 animate-fade-in pb-24">
      {/* Team Header */}
      <div className="relative p-8 lg:p-12 rounded-xl bg-linear-to-br from-primary/20 to-accent/5 border border-primary/20 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-xl bg-background border-4 border-primary/20 flex items-center justify-center text-5xl font-black text-primary shadow-2xl">
            {team.name[0]}
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <h1 className="text-4xl lg:text-5xl font-black font-outfit uppercase tracking-tighter">{team.name}</h1>
              <span className="px-4 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                {team.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted font-bold text-sm">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {team.village}</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-accent" /> Président: {team.president_name}</span>
            </div>
          </div>
        </div>
        <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
      </div>

      {/* Staff Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/5">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter">Staff Technique</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="sports-card p-5 flex items-center gap-4 bg-card/30 hover:border-primary/20 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-muted group-hover:text-primary transition-colors">
                {member.first_name[0]}
              </div>
              <div>
                <div className="font-bold text-sm tracking-tight">{member.first_name} {member.last_name}</div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Players Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent border border-white/5">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black font-outfit uppercase tracking-tighter">Effectif Joueurs</h2>
          </div>
          <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
            <UserPlus className="w-3 h-3" /> Ajouter un joueur
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {players.map((player) => (
            <PlayerCard 
              key={player.id} 
              player={player} 
              isEditing={editingPlayerId === player.id}
              onEdit={() => setEditingPlayerId(player.id)}
              onCancel={() => setEditingPlayerId(null)}
              onSave={(updates) => handleUpdatePlayer(player.id, updates)}
              onPhotoUpload={(file) => handlePhotoUpload(player.id, file)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PlayerCard({ player, isEditing, onEdit, onCancel, onSave, onPhotoUpload }: any) {
  const [editedPlayer, setEditedPlayer] = useState(player);

  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl transition-all duration-500",
      "bg-card/40 border border-white/5 backdrop-blur-xl",
      isEditing ? "ring-2 ring-primary border-transparent" : "hover:border-primary/30"
    )}>
      {/* Header Info */}
      <div className="p-6 pb-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-black text-xl text-white shadow-xl shadow-primary/20">
            {isEditing ? (
              <input 
                type="text" 
                value={editedPlayer.jersey_number} 
                className="w-full bg-transparent text-center outline-none"
                onChange={(e) => setEditedPlayer({...editedPlayer, jersey_number: e.target.value})}
              />
            ) : player.jersey_number}
          </div>
          <div>
            {isEditing ? (
              <input 
                type="text" 
                value={editedPlayer.full_name} 
                className="bg-white/5 border border-white/10 rounded px-2 py-1 font-bold text-sm outline-none focus:border-primary"
                onChange={(e) => setEditedPlayer({...editedPlayer, full_name: e.target.value})}
              />
            ) : (
              <h3 className="font-black font-outfit uppercase tracking-tight text-lg">{player.full_name}</h3>
            )}
            <div className="flex items-center gap-2">
               {isEditing ? (
                 <select 
                   value={editedPlayer.position}
                   className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase outline-none"
                   onChange={(e) => setEditedPlayer({...editedPlayer, position: e.target.value})}
                 >
                   <option value="GK">GK</option>
                   <option value="DEF">DEF</option>
                   <option value="MID">MID</option>
                   <option value="FWD">FWD</option>
                 </select>
               ) : (
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">{player.position}</span>
               )}
               <span className="text-[10px] text-muted">•</span>
               {isEditing ? (
                 <input 
                  type="text" 
                  value={editedPlayer.origin_village} 
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-black uppercase outline-none"
                  onChange={(e) => setEditedPlayer({...editedPlayer, origin_village: e.target.value})}
                 />
               ) : (
                 <span className="text-[10px] text-muted font-bold uppercase tracking-widest">{player.origin_village}</span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button onClick={() => onSave(editedPlayer)} className="p-2 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:scale-110 transition-transform">
              <Save className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onEdit} className="p-2 bg-white/5 text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {isEditing && (
            <button onClick={onCancel} className="p-2 bg-white/5 text-muted hover:text-white rounded-xl transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Photo Section */}
      <div className="px-6 pb-6 pt-2">
        <div className="relative aspect-square w-full rounded-xl bg-secondary/50 overflow-hidden group/photo">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted/20">
              <Users className="w-24 h-24 stroke-[1px]" />
            </div>
          )}
          
          <label className="absolute inset-0 bg-primary/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPhotoUpload(file);
              }}
            />
            <div className="flex flex-col items-center gap-2 text-white">
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Changer Photo</span>
            </div>
          </label>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12" />
    </div>
  );
}
