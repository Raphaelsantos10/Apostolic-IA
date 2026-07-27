"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Profile = {
  learning_points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
};
type Achievement = {
  achievement_id: string;
  achievement_definitions: { title: string; description: string; icon: string } | null;
};
type Mission = {
  id: string; title: string; description: string;
  activity_kind: string; target_count: number;
};

const levelNames = [
  "Iniciante","Aprendiz","Discípulo","Servo","Evangelista",
  "Líder","Mentor","Missionário","Mestre","Embaixador"
];

export function HealthyGamificationPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!active || !authData.user) {
        setLoading(false);
        return;
      }
      setUserId(authData.user.id);
      await supabase.rpc("sync_healthy_gamification");
      const [profileResponse, achievementResponse, missionResponse, eventResponse] =
        await Promise.all([
          supabase.from("gamification_profiles")
            .select("learning_points,level,current_streak,longest_streak").maybeSingle(),
          supabase.from("user_achievements")
            .select("achievement_id,achievement_definitions(title,description,icon)")
            .order("earned_at"),
          supabase.from("mission_definitions")
            .select("id,title,description,activity_kind,target_count").order("id"),
          supabase.from("learning_point_events").select("activity_kind")
        ]);
      if (!active) return;
      setProfile(profileResponse.data as Profile | null);
      setAchievements((achievementResponse.data ?? []) as unknown as Achievement[]);
      setMissions((missionResponse.data ?? []) as Mission[]);
      const nextCounts: Record<string, number> = {};
      for (const event of eventResponse.data ?? []) {
        const kind = event.activity_kind as string;
        nextCounts[kind] = (nextCounts[kind] ?? 0) + 1;
      }
      setCounts(nextCounts);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  if (loading) return <p className="catalog-status" role="status">A calcular aprendizagem…</p>;
  if (!userId) {
    return (
      <div className="notice">
        <h2>Gamificação saudável</h2>
        <p><a href="/entrar">Entre na sua conta</a> para acompanhar pontos, níveis e missões.</p>
      </div>
    );
  }

  const points = profile?.learning_points ?? 0;
  const level = profile?.level ?? 1;
  const levelStart = (level - 1) * 100;
  const progress = level === 10 ? 100 : Math.min(100, points - levelStart);

  return (
    <section className="gamification" aria-labelledby="gamification-title">
      <div className="gamification-heading">
        <div>
          <p className="eyebrow">Aprendizagem verificável</p>
          <h2 id="gamification-title">A sua jornada</h2>
          <p>Pontos reconhecem atividades concluídas, nunca fé, chamado ou espiritualidade.</p>
        </div>
        <div className="level-emblem" aria-label={`Nível ${level}: ${levelNames[level - 1]}`}>
          <span>{level}</span><strong>{levelNames[level - 1]}</strong>
        </div>
      </div>

      <div className="gamification-metrics">
        <article><strong>{points}</strong><span>Pontos de aprendizagem</span></article>
        <article><strong>{profile?.current_streak ?? 0}</strong><span>Dias na sequência atual</span></article>
        <article><strong>{profile?.longest_streak ?? 0}</strong><span>Melhor sequência</span></article>
      </div>

      <div className="level-progress">
        <div><strong>Progresso do nível</strong><span>{progress}%</span></div>
        <progress max="100" value={progress}>{progress}%</progress>
        <small>Sem penalização espiritual. Um intervalo apenas reinicia a sequência de estudo.</small>
      </div>

      <div className="gamification-grid">
        <section aria-labelledby="missions-title">
          <h3 id="missions-title">Missões</h3>
          <div className="mission-list">
            {missions.map((mission) => {
              const current = Math.min(counts[mission.activity_kind] ?? 0, mission.target_count);
              return (
                <article key={mission.id}>
                  <div><strong>{mission.title}</strong><span>{current}/{mission.target_count}</span></div>
                  <p>{mission.description}</p>
                  <progress max={mission.target_count} value={current}>
                    {current} de {mission.target_count}
                  </progress>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="achievements-title">
          <h3 id="achievements-title">Conquistas</h3>
          {achievements.length === 0 ? (
            <p>Conclua uma atividade para desbloquear a primeira conquista.</p>
          ) : (
            <ul className="achievement-list">
              {achievements.map((item) => (
                <li key={item.achievement_id}>
                  <span aria-hidden="true">{item.achievement_definitions?.icon}</span>
                  <div><strong>{item.achievement_definitions?.title}</strong>
                    <small>{item.achievement_definitions?.description}</small></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
