"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import styles from "../app/dashboard-preview/study-experience.module.css";

const LazyRiveLumi = dynamic(
  () =>
    import("./rive-study-flame").then((module) => module.RiveLumi),
  { ssr: false }
);

const LazyDotLottie = dynamic(
  () =>
    import("@lottiefiles/dotlottie-react").then(
      (module) => module.DotLottieReact
    ),
  { ssr: false }
);

function resolveStoredReducedMotion() {
  return document.documentElement.dataset.reduceMotion === "true";
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setReduced(media.matches || resolveStoredReducedMotion());
    const observer = new MutationObserver(update);

    update();
    media.addEventListener("change", update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-reduce-motion"]
    });

    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);

  return reduced;
}

export function StudyFlame() {
  const reducedMotion = useReducedMotion();
  const riveSource =
    process.env.NEXT_PUBLIC_RIVE_LUMI_URL ??
    process.env.NEXT_PUBLIC_RIVE_STUDY_FLAME_URL;

  return (
    <span
      className={styles.flameStage}
      aria-hidden="true"
      data-character="lumi"
      data-motion-state={reducedMotion ? "reduced" : "available"}
    >
      {riveSource && !reducedMotion ? (
        <LazyRiveLumi src={riveSource} paused={reducedMotion} />
      ) : (
        <img
          className={styles.lumiPoster}
          src="/characters/lumi/poster.webp"
          alt=""
          width="512"
          height="768"
        />
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
