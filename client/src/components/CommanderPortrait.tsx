import { useEffect, useState } from "react";

export function CommanderPortrait({
  portraitIndex,
  portraitUrl,
  name,
  className = "",
  sizes = "(max-width: 640px) 33vw, (max-width: 1280px) 25vw, 220px",
}: {
  portraitIndex?: number;
  portraitUrl?: string | null;
  name: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [portraitUrl]);

  if (!portraitUrl || failed) {
    return (
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-[#10281d] via-[#1a3a2a] to-[#061019] ${className}`}
        role="img"
        aria-label={`Retrato de ${name} ainda não disponível`}
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(196,168,75,.45),transparent_55%)]" />
        <div className="relative flex flex-col items-center gap-3 text-center text-[#d6bd66]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#d6bd66]/30 bg-black/20 p-3 shadow-[0_0_35px_rgba(196,168,75,.14)]">
            <img src="/documents/images/brasao_cfap.png" alt="Emblema do CFAP" className="h-full w-full object-contain opacity-90" />
          </div>
          <span className="px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
            Retrato oficial não localizado
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={portraitUrl || ""}
      alt={`Retrato de ${name}`}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      draggable={false}
      onError={() => setFailed(true)}
      className={`aspect-square w-full bg-white object-cover object-top ${className}`}
    />
  );
}
