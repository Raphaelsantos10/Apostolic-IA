"use client";

import { useRive } from "@rive-app/react-webgl2";

export const LUMI_ARTBOARD = "Lumi";
export const LUMI_STATE_MACHINE = "lumi-ui";

export function RiveLumi({
  src,
  paused
}: Readonly<{
  src: string;
  paused: boolean;
}>) {
  const { RiveComponent } = useRive({
    src,
    autoplay: !paused,
    artboard: LUMI_ARTBOARD,
    stateMachines: LUMI_STATE_MACHINE
  });

  return (
    <RiveComponent
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/**
 * Compatibilidade temporária para consumidores anteriores da Sprint 035.
 * Remover somente depois de existir um ativo Lumi aprovado em produção.
 */
export const RiveStudyFlame = RiveLumi;
