"use client";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createClient } from "../lib/supabase/client";
import {
  ALLIANCE_BACKGROUNDS_V62,
  allianceBackgroundById,
} from "../lib/arena-alliance-backgrounds-v62";
import {
  ALLIANCE_EMBLEMS_V63,
  allianceEmblemById,
} from "../lib/arena-alliance-emblems-v63";
import { ArenaAllianceManagementV64 } from "./arena-alliance-management-v64";
import { ArenaAllianceDiscoveryV65 } from "./arena-alliance-discovery-v65";
import { ArenaAllianceWallV67 } from "./arena-alliance-wall-v67";
import { ArenaAllianceMissionsV68 } from "./arena-alliance-missions-v68";
import { ArenaAllianceTreasuryV69 } from "./arena-alliance-treasury-v69";
import { ArenaAllianceShopV70 } from "./arena-alliance-shop-v70";
import { ArenaAllianceAdvancedV75 } from "./arena-alliance-advanced-v75";
import styles from "./arena-alliance-v61.module.css";

type Alliance = {
  id: string;
  name: string;
  tag: string;
  description: string;
  emblem: string;
  visibility: string;
  level: number;
  xp: number;
  weekly_glory: number;
  member_count: number;
  max_members: number;
  role?: string;
  contribution?: number;
  background_id?: string;
  effective_background_id?: string;
  emblem_id?: string;
  effective_emblem_id?: string;
  is_pro?: boolean;
};
type Hub = {
  alliance: Alliance;
  members: Array<{
    user_id: string;
    role: string;
    contribution: number;
    joined_at: string;
  }>;
  activities: Array<{
    id: number;
    kind: string;
    message: string;
    created_at: string;
  }>;
  missions: Array<{
    id: string;
    title: string;
    description: string;
    target: number;
    progress: number;
    reward_label: string;
    ends_at: string;
  }>;
};
type BackgroundAccess = {
  id: string;
  name: string;
  image: string;
  tier: "free" | "gems" | "level" | "pro";
  price: number | null;
  required_level: number | null;
  unlocked: boolean;
};
type Gallery = {
  is_pro: boolean;
  can_manage: boolean;
  wallet_gems: number;
  backgrounds: BackgroundAccess[];
};
type EmblemAccess = {
  id: string;
  name: string;
  image: string;
  tier: "free" | "gems" | "pro";
  price: number | null;
  unlocked: boolean;
};
type EmblemGallery = {
  is_pro: boolean;
  can_manage: boolean;
  wallet_gems: number;
  emblems: EmblemAccess[];
};
const FALLBACK_MISSIONS = [
  {
    id: "faith",
    title: "Jornada de Fé",
    description: "Vença batalhas em conjunto",
    target: 50,
    progress: 0,
    reward_label: "Baú da Aliança",
    ends_at: "",
  },
  {
    id: "study",
    title: "Sabedoria Compartilhada",
    description: "Complete estudos e desafios",
    target: 30,
    progress: 0,
    reward_label: "500 Glória",
    ends_at: "",
  },
  {
    id: "help",
    title: "Servir uns aos outros",
    description: "Ajude membros da Aliança",
    target: 20,
    progress: 0,
    reward_label: "Emblema semanal",
    ends_at: "",
  },
];
const FALLBACK_GALLERY: Gallery = {
  is_pro: false,
  can_manage: false,
  wallet_gems: 0,
  backgrounds: ALLIANCE_BACKGROUNDS_V62.map((item) => ({
    ...item,
    price: item.price ?? null,
    required_level: item.requiredLevel ?? null,
    unlocked: item.tier === "free",
  })),
};
const FALLBACK_EMBLEMS: EmblemGallery = {
  is_pro: false,
  can_manage: false,
  wallet_gems: 0,
  emblems: ALLIANCE_EMBLEMS_V63.map((item) => ({
    ...item,
    price: item.price ?? null,
    unlocked: item.tier === "free",
  })),
};

export function ArenaAllianceV61() {
  const [hub, setHub] = useState<Hub | null>(null),
    [discover, setDiscover] = useState<Alliance[]>([]),
    [activeTab, setActiveTab] = useState<
      | "home"
      | "wall"
      | "missions"
      | "treasury"
      | "shop"
      | "members"
      | "advanced"
    >("home"),
    [loading, setLoading] = useState(true),
    [creating, setCreating] = useState(false),
    [customizing, setCustomizing] = useState(false),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("A carregar a sua Aliança…"),
    [name, setName] = useState(""),
    [tag, setTag] = useState(""),
    [description, setDescription] = useState("");
  const [gallery, setGallery] = useState<Gallery>(FALLBACK_GALLERY),
    [emblemGallery, setEmblemGallery] =
      useState<EmblemGallery>(FALLBACK_EMBLEMS),
    [previewId, setPreviewId] = useState("cidadela-dourada"),
    [previewEmblemId, setPreviewEmblemId] = useState("pomba-da-alianca"),
    [customTab, setCustomTab] = useState<"backgrounds" | "emblems">(
      "backgrounds",
    );
  const load = async () => {
    setLoading(true);
    const client = createClient();
    const [own, list] = await Promise.all([
      client.rpc("arena_get_alliance_hub"),
      client.rpc("arena_browse_alliances", { p_query: "", p_limit: 12 }),
    ]);
    const nextHub = !own.error && own.data ? (own.data as Hub) : null;
    setHub(nextHub);
    if (!list.error && Array.isArray(list.data))
      setDiscover(list.data as Alliance[]);
    if (nextHub) {
      setPreviewId(
        nextHub.alliance.effective_background_id ||
          nextHub.alliance.background_id ||
          "cidadela-dourada",
      );
      setPreviewEmblemId(
        nextHub.alliance.effective_emblem_id ||
          nextHub.alliance.emblem_id ||
          "pomba-da-alianca",
      );
      const [access, emblems] = await Promise.all([
        client.rpc("arena_get_alliance_backgrounds"),
        client.rpc("arena_get_alliance_emblems"),
      ]);
      if (!access.error && access.data) setGallery(access.data as Gallery);
      if (!emblems.error && emblems.data)
        setEmblemGallery(emblems.data as EmblemGallery);
    }
    setLoading(false);
    setMessage(
      own.error
        ? "Aplique as migrações V61, V62 e V63 para ativar a Aliança."
        : "",
    );
  };
  useEffect(() => {
    void load();
  }, []);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    const { error } = await createClient().rpc("arena_create_alliance", {
      p_name: name,
      p_tag: tag,
      p_description: description,
      p_visibility: "open",
    });
    if (error) {
      setMessage(
        error.message.includes("already")
          ? "Você já pertence a uma Aliança."
          : "Não foi possível criar. Confira nome e sigla.",
      );
      return;
    }
    setCreating(false);
    setName("");
    setTag("");
    setDescription("");
    await load();
  };
  const join = async (id: string) => {
    const { error } = await createClient().rpc("arena_join_alliance", {
      p_alliance_id: id,
    });
    if (error)
      setMessage(
        error.message.includes("full")
          ? "Esta Aliança está completa."
          : "Não foi possível entrar nesta Aliança.",
      );
    else await load();
  };
  const selectBackground = async (item: BackgroundAccess) => {
    if (!gallery.can_manage || !item.unlocked) return;
    setBusy(item.id);
    const { error } = await createClient().rpc(
      "arena_select_alliance_background",
      { p_background_id: item.id },
    );
    setBusy("");
    if (error) {
      setMessage("Não foi possível aplicar este cenário.");
      return;
    }
    setCustomizing(false);
    await load();
  };
  const purchaseBackground = async (item: BackgroundAccess) => {
    if (!gallery.can_manage || item.tier !== "gems" || !item.price) return;
    if (
      !window.confirm(
        `Desbloquear ${item.name} para toda a Aliança por ${item.price} gemas?`,
      )
    )
      return;
    setBusy(item.id);
    const { error } = await createClient().rpc(
      "arena_purchase_alliance_background",
      {
        p_background_id: item.id,
        p_idempotency_key: `alliance-bg:${crypto.randomUUID()}`,
      },
    );
    setBusy("");
    if (error) {
      setMessage(
        error.message.includes("insufficient")
          ? "Gemas insuficientes para este cenário."
          : "Não foi possível concluir o desbloqueio.",
      );
      return;
    }
    await load();
    setCustomizing(true);
  };
  const selectEmblem = async (item: EmblemAccess) => {
    if (!emblemGallery.can_manage || !item.unlocked) return;
    setBusy(item.id);
    const { error } = await createClient().rpc("arena_select_alliance_emblem", {
      p_emblem_id: item.id,
    });
    setBusy("");
    if (error) {
      setMessage("Não foi possível aplicar este brasão.");
      return;
    }
    setCustomizing(false);
    await load();
  };
  const purchaseEmblem = async (item: EmblemAccess) => {
    if (!emblemGallery.can_manage || item.tier !== "gems" || !item.price)
      return;
    if (
      !window.confirm(
        `Desbloquear ${item.name} para toda a Aliança por ${item.price} gemas?`,
      )
    )
      return;
    setBusy(item.id);
    const { error } = await createClient().rpc(
      "arena_purchase_alliance_emblem",
      {
        p_emblem_id: item.id,
        p_idempotency_key: `alliance-emblem:${crypto.randomUUID()}`,
      },
    );
    setBusy("");
    if (error) {
      setMessage(
        error.message.includes("insufficient")
          ? "Gemas insuficientes para este brasão."
          : "Não foi possível concluir o desbloqueio.",
      );
      return;
    }
    await load();
    setCustomTab("emblems");
    setCustomizing(true);
  };
  const preview = useMemo(() => allianceBackgroundById(previewId), [previewId]);
  const previewEmblem = useMemo(
    () => allianceEmblemById(previewEmblemId),
    [previewEmblemId],
  );
  if (loading)
    return (
      <section className={styles.loading}>
        <i />
        <b>ERGUENDO A SEDE DA ALIANÇA…</b>
      </section>
    );
  if (!hub) return <ArenaAllianceDiscoveryV65 onJoined={() => void load()} />;
  if (!hub)
    return (
      <section className={styles.discovery}>
        <header>
          <div>
            <small>APOSTOLIC ARENA · COMUNIDADE COMPETITIVA</small>
            <h2>Encontre a sua Aliança</h2>
            <p>
              Mais que um clã: uma comunidade que batalha, aprende, coopera e
              cresce na mesma jornada.
            </p>
          </div>
          <button type="button" onClick={() => setCreating(true)}>
            + FUNDAR ALIANÇA
          </button>
        </header>
        {message && <aside>{message}</aside>}
        <div className={styles.benefits}>
          <article>
            <span>⚔</span>
            <b>MISSÕES COOPERATIVAS</b>
            <p>Cada vitória contribui para objetivos compartilhados.</p>
          </article>
          <article>
            <span>♜</span>
            <b>SEDE EVOLUTIVA</b>
            <p>O nível coletivo transforma visualmente a fortaleza.</p>
          </article>
          <article>
            <span>✦</span>
            <b>GLÓRIA SEMANAL</b>
            <p>Ranking saudável com recompensas cosméticas.</p>
          </article>
        </div>
        <section className={styles.openList}>
          <h3>ALIANÇAS ABERTAS</h3>
          <div>
            {discover.map((item) => (
              <article key={item.id}>
                <div className={styles.emblem}>
                  <img
                    src={
                      allianceEmblemById(
                        item.effective_emblem_id || item.emblem_id,
                      ).image
                    }
                    alt=""
                    loading="lazy"
                  />
                </div>
                <span>
                  <small>{item.tag}</small>
                  <b>{item.name}</b>
                  <p>{item.description || "Uma nova jornada começa aqui."}</p>
                </span>
                <em>
                  NÍVEL {item.level}
                  <br />
                  {item.member_count}/{item.max_members} membros
                </em>
                <button type="button" onClick={() => void join(item.id)}>
                  ENTRAR
                </button>
              </article>
            ))}
          </div>
        </section>
        {creating && (
          <div className={styles.modal}>
            <form onSubmit={(event) => void create(event)}>
              <small>NOVA ALIANÇA</small>
              <h3>Erga uma sede para sua comunidade</h3>
              <label>
                NOME
                <input
                  required
                  minLength={3}
                  maxLength={40}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label>
                SIGLA
                <input
                  required
                  minLength={2}
                  maxLength={5}
                  value={tag}
                  onChange={(event) =>
                    setTag(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                />
              </label>
              <label>
                PROPÓSITO
                <textarea
                  maxLength={240}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
              <footer>
                <button type="button" onClick={() => setCreating(false)}>
                  CANCELAR
                </button>
                <button type="submit">FUNDAR</button>
              </footer>
            </form>
          </div>
        )}
      </section>
    );
  const alliance = hub.alliance,
    missions = hub.missions.length ? hub.missions : FALLBACK_MISSIONS,
    active = allianceBackgroundById(
      alliance.effective_background_id || alliance.background_id,
    );
  const hubStyle = {
    "--alliance-bg": `url("${active.image}")`,
  } as CSSProperties;
  const backgroundCards = (
    <div className={styles.gallery}>
      {gallery.backgrounds.map((item) => (
        <article
          key={item.id}
          data-tier={item.tier}
          data-selected={previewId === item.id}
          data-locked={!item.unlocked}
          onMouseEnter={() => setPreviewId(item.id)}
          onFocus={() => setPreviewId(item.id)}
        >
          <button
            type="button"
            className={styles.artPreview}
            onClick={() => setPreviewId(item.id)}
          >
            <img src={item.image} alt={`Cenário ${item.name}`} loading="lazy" />
            <i>{item.unlocked ? "✓" : "◆"}</i>
          </button>
          <div>
            <b>{item.name}</b>
            <small>
              {item.tier === "free"
                ? "GRATUITO"
                : item.tier === "gems"
                  ? `${item.price} GEMAS`
                  : item.tier === "level"
                    ? `NÍVEL ${item.required_level}`
                    : "EXCLUSIVO PRO"}
            </small>
          </div>
          {item.unlocked ? (
            <button
              type="button"
              disabled={
                !gallery.can_manage ||
                busy === item.id ||
                alliance.background_id === item.id
              }
              onClick={() => void selectBackground(item)}
            >
              {alliance.background_id === item.id ? "EM USO" : "APLICAR"}
            </button>
          ) : item.tier === "gems" ? (
            <button
              type="button"
              disabled={!gallery.can_manage || busy === item.id}
              onClick={() => void purchaseBackground(item)}
            >
              DESBLOQUEAR
            </button>
          ) : item.tier === "pro" ? (
            <button
              type="button"
              onClick={() =>
                setMessage(
                  "A assinatura Aliança PRO será ativada pela loja segura.",
                )
              }
            >
              CONHECER PRO
            </button>
          ) : (
            <button type="button" disabled>
              CONTINUE EVOLUINDO
            </button>
          )}
        </article>
      ))}
    </div>
  );
  const emblemCards = (
    <div className={`${styles.gallery} ${styles.emblemGallery}`}>
      {emblemGallery.emblems.map((item) => (
        <article
          key={item.id}
          data-tier={item.tier}
          data-selected={previewEmblemId === item.id}
          data-locked={!item.unlocked}
          onMouseEnter={() => setPreviewEmblemId(item.id)}
          onFocus={() => setPreviewEmblemId(item.id)}
        >
          <button
            type="button"
            className={styles.artPreview}
            onClick={() => setPreviewEmblemId(item.id)}
          >
            <img src={item.image} alt={`Brasão ${item.name}`} loading="lazy" />
            <i>{item.unlocked ? "✓" : "◆"}</i>
          </button>
          <div>
            <b>{item.name}</b>
            <small>
              {item.tier === "free"
                ? "GRATUITO"
                : item.tier === "gems"
                  ? `${item.price} GEMAS`
                  : "EXCLUSIVO PRO"}
            </small>
          </div>
          {item.unlocked ? (
            <button
              type="button"
              disabled={
                !emblemGallery.can_manage ||
                busy === item.id ||
                alliance.emblem_id === item.id
              }
              onClick={() => void selectEmblem(item)}
            >
              {alliance.emblem_id === item.id ? "EM USO" : "APLICAR"}
            </button>
          ) : item.tier === "gems" ? (
            <button
              type="button"
              disabled={!emblemGallery.can_manage || busy === item.id}
              onClick={() => void purchaseEmblem(item)}
            >
              DESBLOQUEAR
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setMessage(
                  "A assinatura Aliança PRO será ativada pela loja segura.",
                )
              }
            >
              CONHECER PRO
            </button>
          )}
        </article>
      ))}
    </div>
  );
  return (
    <section
      className={styles.hub}
      style={hubStyle}
      data-pro={alliance.is_pro ? "true" : "false"}
    >
      <header>
        <div className={styles.crest}>
          <img
            src={
              allianceEmblemById(
                alliance.effective_emblem_id || alliance.emblem_id,
              ).image
            }
            alt={`Brasão de ${alliance.name}`}
          />
        </div>
        <div>
          <small>
            {alliance.tag} · SEDE NÍVEL {alliance.level}
            {alliance.is_pro ? " · PRO" : ""}
          </small>
          <h2>{alliance.name}</h2>
          <p>
            {alliance.description ||
              "Unidos pela fé, conhecimento e cooperação."}
          </p>
        </div>
        <aside>
          <span>
            GLÓRIA SEMANAL<b>{alliance.weekly_glory.toLocaleString("pt-PT")}</b>
          </span>
          <span>
            MEMBROS
            <b>
              {alliance.member_count}/{alliance.max_members}
            </b>
          </span>
          <button
            type="button"
            className={styles.customizeButton}
            onClick={() => {
              setPreviewId(
                alliance.effective_background_id ||
                  alliance.background_id ||
                  "cidadela-dourada",
              );
              setPreviewEmblemId(
                alliance.effective_emblem_id ||
                  alliance.emblem_id ||
                  "pomba-da-alianca",
              );
              setCustomTab("backgrounds");
              setCustomizing(true);
            }}
          >
            ✦ PERSONALIZAR SEDE
          </button>
        </aside>
      </header>
      {message && <div className={styles.notice}>{message}</div>}
      <nav>
        <button
          type="button"
          data-active={activeTab === "home"}
          onClick={() => setActiveTab("home")}
        >
          SEDE
        </button>
        <button
          type="button"
          data-active={activeTab === "wall"}
          onClick={() => setActiveTab("wall")}
        >
          MURAL
        </button>
        <button
          type="button"
          data-active={activeTab === "missions"}
          onClick={() => setActiveTab("missions")}
        >
          MISSÕES
        </button>
        <button
          type="button"
          data-active={activeTab === "members"}
          onClick={() => setActiveTab("members")}
        >
          MEMBROS
        </button>
        <button
          type="button"
          data-active={activeTab === "treasury"}
          onClick={() => setActiveTab("treasury")}
        >
          TESOURO
        </button>
        <button
          type="button"
          data-active={activeTab === "shop"}
          onClick={() => setActiveTab("shop")}
        >
          LOJA
        </button>
        <button
          type="button"
          data-active={activeTab === "advanced"}
          onClick={() => setActiveTab("advanced")}
        >
          SOCIAL+
        </button>
      </nav>
      <div className={styles.level}>
        <span>NÍVEL {alliance.level}</span>
        <i>
          <em
            style={{
              width: `${Math.min(100, (alliance.xp / Math.max(1, alliance.level * 1000)) * 100)}%`,
            }}
          />
        </i>
        <b>
          {alliance.xp}/{alliance.level * 1000} XP
        </b>
      </div>
      {activeTab === "wall" ? (
        <ArenaAllianceWallV67 />
      ) : activeTab === "missions" ? (
        <ArenaAllianceMissionsV68 />
      ) : activeTab === "treasury" ? (
        <ArenaAllianceTreasuryV69 />
      ) : activeTab === "shop" ? (
        <ArenaAllianceShopV70 />
      ) : activeTab === "advanced" ? (
        <ArenaAllianceAdvancedV75 />
      ) : activeTab === "members" ? (
        <ArenaAllianceManagementV64 onLeave={() => void load()} />
      ) : (
        <main>
          <section className={styles.missions}>
            <h3>
              MISSÕES DA SEMANA <small>Todos contribuem</small>
            </h3>
            {missions.map((mission) => (
              <article key={mission.id}>
                <span>✦</span>
                <div>
                  <b>{mission.title}</b>
                  <p>{mission.description}</p>
                  <i>
                    <em
                      style={{
                        width: `${Math.min(100, (mission.progress / mission.target) * 100)}%`,
                      }}
                    />
                  </i>
                  <small>
                    {mission.progress}/{mission.target}
                  </small>
                </div>
                <strong>{mission.reward_label}</strong>
              </article>
            ))}
          </section>
          <aside className={styles.feed}>
            <h3>MURAL VIVO</h3>
            {hub.activities.length ? (
              hub.activities.map((item) => (
                <article key={item.id}>
                  <span>{item.kind === "join" ? "👤" : "✦"}</span>
                  <p>
                    {item.message}
                    <small>
                      {new Date(item.created_at).toLocaleString("pt-PT")}
                    </small>
                  </p>
                </article>
              ))
            ) : (
              <p>
                A história da Aliança começa agora. Convide pessoas e conquistem
                a primeira missão.
              </p>
            )}
          </aside>
          <section className={styles.members}>
            <h3>GUARDIÕES DA ALIANÇA</h3>
            {hub.members.slice(0, 8).map((member, index) => (
              <article key={member.user_id}>
                <span>{index + 1}</span>
                <b>{member.user_id.slice(0, 8).toUpperCase()}</b>
                <em>
                  {member.role === "founder"
                    ? "FUNDADOR"
                    : member.role.toUpperCase()}
                </em>
                <strong>{member.contribution} glória</strong>
              </article>
            ))}
          </section>
        </main>
      )}
      {customizing && (
        <div
          className={styles.customizer}
          role="dialog"
          aria-modal="true"
          aria-label="Personalizar sede"
        >
          <section>
            <header
              className={
                customTab === "emblems" ? styles.emblemHero : undefined
              }
              style={
                customTab === "backgrounds"
                  ? {
                      backgroundImage: `linear-gradient(90deg,#05080ae8,#05080a55),url("${preview.image}")`,
                    }
                  : undefined
              }
            >
              {customTab === "emblems" && (
                <img src={previewEmblem.image} alt="" />
              )}
              <div>
                <small>IDENTIDADE VISUAL V63</small>
                <h3>
                  {customTab === "backgrounds"
                    ? preview.name
                    : previewEmblem.name}
                </h3>
                <p>
                  {gallery.is_pro
                    ? "Aliança PRO · coleção completa ativa"
                    : `${Math.min(gallery.wallet_gems, emblemGallery.wallet_gems).toLocaleString("pt-PT")} gemas disponíveis`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizing(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>
            <nav className={styles.customTabs}>
              <button
                type="button"
                data-active={customTab === "backgrounds"}
                onClick={() => setCustomTab("backgrounds")}
              >
                CENÁRIOS · 20
              </button>
              <button
                type="button"
                data-active={customTab === "emblems"}
                onClick={() => setCustomTab("emblems")}
              >
                BRASÕES · 12
              </button>
            </nav>
            <div className={styles.tierLegend}>
              <span>GRÁTIS</span>
              <span>GEMAS</span>
              {customTab === "backgrounds" && <span>CONQUISTA</span>}
              <span>PRO</span>
            </div>
            {customTab === "backgrounds" ? backgroundCards : emblemCards}
            {!(customTab === "backgrounds"
              ? gallery.can_manage
              : emblemGallery.can_manage) && (
              <footer>
                Somente o fundador e os anciãos podem comprar ou aplicar itens.
              </footer>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
