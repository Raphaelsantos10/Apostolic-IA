"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "../app/dashboard-preview/study-experience.module.css";

const LazyRiveStudyFlame = dynamic(
  () =>
    import("./rive-study-flame").then((module) => module.RiveStudyFlame),
  { ssr: false }
);

const LazyDotLottie = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then(
      (module) => module.DotLottieReact
    ),
  { ssr: false }
);

function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function StudyFlame() {
  const reducedMotion = useReducedMotion();
  const riveSource = process.env.NEXT_PUBLIC_RIVE_STUDY_FLAME_URL;

  return (
    <span className={styles.flameStage} aria-hidden="true">
      {riveSource && !reducedMotion ? (
        <LazyRiveStudyFlame src={riveSource} paused={reducedMotion} />
      ) : (
        <span className={styles.staticFlame}>♨</span>
      )}
    </span>
  );
}

export function AchievementCelebration({
  active
}: Readonly<{ active: boolean }>) {
  const reducedMotion = useReducedMotion();

  if (!active || reducedMotion) return null;

  return (
    <span className={styles.celebration} aria-hidden="true">
      <LazyDotLottie
        src="/animations/achievement-spark.json"
        autoplay
        loop={false}
      />
    </span>
  );
}
