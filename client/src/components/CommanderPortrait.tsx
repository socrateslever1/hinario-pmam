import { Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function CommanderPortrait({
  portraitIndex,
  portraitUrl,
  name,
  className = "",
}: {
  portraitIndex?: number;
  portraitUrl?: string | null;
  name: string;
  className?: string;
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
        <div className="relative flex flex-col items-center gap-2 text-center text-[#d6bd66]">
          <Shield className="h-12 w-12" />
          <span className="px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">
            Foto oficial pendente
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
      onError={() => setFailed(true)}
      className={`aspect-square w-full bg-white object-cover object-top ${className}`}
    />
  );
}
