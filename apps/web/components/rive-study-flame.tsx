"use client";

import { useRive } from "@rive-app/react-webgl2";

export function RiveStudyFlame({
  src,
  paused
}: Readonly<{
  src: string;
  paused: boolean;
}>) {
  const { RiveComponent } = useRive({
    src,
    autoplay: !paused,
    stateMachines: "Study flame"
  });

  return (
    <RiveComponent
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
