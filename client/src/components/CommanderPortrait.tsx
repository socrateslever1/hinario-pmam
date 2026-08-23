import { Shield } from "lucide-react";
import { CFAP_COMMANDER_SPRITE } from "@/data/cfapCommanderSprite";

const COLUMNS = 5;
const ROWS = 8;

export function CommanderPortrait({
  portraitIndex,
  name,
  className = "",
}: {
  portraitIndex?: number;
  name: string;
  className?: string;
}) {
  if (portraitIndex === undefined) {
    return (
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-[#10281d] via-[#1a3a2a] to-[#061019] ${className}`}
        role="img"
        aria-label={`Retrato de ${name} ainda não disponível`}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(196,168,75,.45),transparent_55%)]" />
        <div className="relative flex flex-col items-center gap-2 text-center text-[#d6bd66]">
          <Shield className="h-12 w-12" />
          <span className="px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
            Foto oficial pendente
          </span>
        </div>
      </div>
    );
  }

  const column = portraitIndex % COLUMNS;
  const row = Math.floor(portraitIndex / COLUMNS);
  const x = (column / (COLUMNS - 1)) * 100;
  const y = (row / (ROWS - 1)) * 100;

  return (
    <div
      className={`aspect-square bg-white bg-no-repeat ${className}`}
      role="img"
      aria-label={`Retrato de ${name}`}
      style={{
        backgroundImage: `url(${CFAP_COMMANDER_SPRITE})`,
        backgroundSize: `${COLUMNS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${x}% ${y}%`,
      }}
    />
  );
}
