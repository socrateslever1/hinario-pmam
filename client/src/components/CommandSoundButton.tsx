import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  ArrowLeft,
  ArrowRight,
  Bell,
  BedDouble,
  CircleStop,
  Clock3,
  Eye,
  Flag,
  Flame,
  Footprints,
  GraduationCap,
  Hand,
  Megaphone,
  Music2,
  PersonStanding,
  RotateCcw,
  Shield,
  Star,
  Sun,
  Swords,
  UserRound,
  Users,
  UtensilsCrossed,
  Volume2,
  VolumeX,
} from "lucide-react";
import { normalizeDrillCommand } from "@/lib/drillStateMachine";

type Tone = "red" | "yellow" | "blue" | "green" | "orange" | "purple";

const TONE_STYLES: Record<Tone, string> = {
  red: "border-red-950/60 bg-gradient-to-br from-red-300 via-red-500 to-red-800 shadow-[inset_0_5px_7px_rgba(255,255,255,.7),inset_0_-8px_10px_rgba(80,0,0,.45),0_7px_12px_rgba(60,0,0,.35)]",
  yellow: "border-amber-800/60 bg-gradient-to-br from-yellow-100 via-yellow-400 to-amber-600 shadow-[inset_0_5px_7px_rgba(255,255,255,.8),inset_0_-8px_10px_rgba(120,70,0,.35),0_7px_12px_rgba(70,50,0,.3)]",
  blue: "border-blue-950/55 bg-gradient-to-br from-sky-200 via-sky-500 to-blue-800 shadow-[inset_0_5px_7px_rgba(255,255,255,.75),inset_0_-8px_10px_rgba(0,30,100,.4),0_7px_12px_rgba(0,30,70,.3)]",
  green: "border-emerald-950/55 bg-gradient-to-br from-lime-200 via-emerald-500 to-emerald-800 shadow-[inset_0_5px_7px_rgba(255,255,255,.75),inset_0_-8px_10px_rgba(0,70,30,.4),0_7px_12px_rgba(0,55,30,.3)]",
  orange: "border-orange-950/55 bg-gradient-to-br from-orange-200 via-orange-500 to-red-700 shadow-[inset_0_5px_7px_rgba(255,255,255,.75),inset_0_-8px_10px_rgba(100,30,0,.4),0_7px_12px_rgba(70,30,0,.3)]",
  purple: "border-violet-950/55 bg-gradient-to-br from-fuchsia-200 via-violet-500 to-purple-800 shadow-[inset_0_5px_7px_rgba(255,255,255,.75),inset_0_-8px_10px_rgba(55,0,90,.4),0_7px_12px_rgba(45,0,70,.3)]",
};

const ICON_BY_KEY: Record<string, LucideIcon> = {
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  clock: Clock3,
  eye: Eye,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gauge: Footprints,
  hand: Hand,
  relaxed: BedDouble,
  rotate: RotateCcw,
  salute: Hand,
  school: GraduationCap,
  search: Eye,
  shield: Shield,
  sun: Sun,
  user: UserRound,
  users: Users,
  utensils: UtensilsCrossed,
  volume: Volume2,
  "volume-off": VolumeX,
  music: Music2,
};

export function getCommandVisual(title: string, iconKey?: string | null): { Icon: LucideIcon; tone: Tone } {
  const command = normalizeDrillCommand(title);

  if (/silencio/.test(command)) return { Icon: VolumeX, tone: "blue" };
  if (/alvorada/.test(command)) return { Icon: Sun, tone: "yellow" };
  if (/expediente|recolher|horario/.test(command)) return { Icon: AlarmClock, tone: "yellow" };
  if (/rancho/.test(command)) return { Icon: UtensilsCrossed, tone: "orange" };
  if (/bandeira/.test(command)) return { Icon: Flag, tone: "green" };
  if (/bombeiro/.test(command)) return { Icon: Flame, tone: "red" };
  if (/escola/.test(command)) return { Icon: GraduationCap, tone: "blue" };
  if (/governador|presidente|comandante|oficial|chefe/.test(command)) return { Icon: Star, tone: "purple" };
  if (/batalhao|companhia|pelotao|contingente|reunir|cobrir/.test(command)) return { Icon: Users, tone: "orange" };
  if (/a vontade|descansar$/.test(command)) return { Icon: BedDouble, tone: "green" };
  if (/sentido|firme/.test(command)) return { Icon: PersonStanding, tone: "red" };
  if (/apresentar arma/.test(command)) return { Icon: Hand, tone: "red" };
  if (/ombro arma|cruzar arma|descansar arma/.test(command)) return { Icon: Swords, tone: "orange" };
  if (/olhar/.test(command)) return { Icon: Eye, tone: "blue" };
  if (/direita/.test(command)) return { Icon: ArrowRight, tone: "blue" };
  if (/esquerda/.test(command)) return { Icon: ArrowLeft, tone: "blue" };
  if (/volta volver/.test(command)) return { Icon: RotateCcw, tone: "blue" };
  if (/alto/.test(command)) return { Icon: CircleStop, tone: "red" };
  if (/marcha|marche|marcar passo|acelerado|avancar/.test(command)) return { Icon: Footprints, tone: "yellow" };
  if (/ordem|prontidao|inspec/.test(command)) return { Icon: Shield, tone: "red" };

  const Icon = (iconKey && ICON_BY_KEY[iconKey]) || Megaphone;
  const tones: Tone[] = ["red", "yellow", "blue", "green", "orange", "purple"];
  const hash = command.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return { Icon, tone: tones[hash % tones.length] };
}

type Props = {
  title: string;
  subtitle?: string | null;
  iconKey?: string | null;
  isPlaying?: boolean;
  isAllowed?: boolean;
  onClick: () => void;
  action?: React.ReactNode;
  compact?: boolean;
  darkSurface?: boolean;
};

export function CommandSoundButton({
  title,
  subtitle,
  iconKey,
  isPlaying = false,
  isAllowed = true,
  onClick,
  action,
  compact = false,
  darkSurface = false,
}: Props) {
  const { Icon, tone } = getCommandVisual(title, iconKey);

  return (
    <div className="relative flex min-w-0 flex-col items-center text-center">
      <button
        type="button"
        onClick={onClick}
        aria-disabled={!isAllowed && !isPlaying}
        aria-label={`${isPlaying ? "Parar" : isAllowed ? "Executar" : "Comando bloqueado"}: ${title}`}
        className={`group relative grid aspect-square w-full place-items-center rounded-full border-[6px] outline-none transition duration-150 focus-visible:ring-4 focus-visible:ring-amber-400/70 active:translate-y-1 active:scale-[.97] ${compact ? "max-w-[6.5rem]" : "max-w-[9.5rem]"} ${TONE_STYLES[tone]} ${!isAllowed && !isPlaying ? "cursor-not-allowed grayscale-[.45] opacity-45" : "hover:brightness-110"}`}
      >
        <span className="absolute inset-[8%] rounded-full border-2 border-white/45 bg-black/10 shadow-[inset_0_3px_8px_rgba(0,0,0,.3)]" />
        <span className="absolute left-[19%] top-[10%] h-[17%] w-[50%] rotate-[-8deg] rounded-full bg-white/35 blur-[1px]" />
        <span className="relative grid h-[53%] w-[53%] place-items-center rounded-full bg-white/90 text-slate-900 shadow-[0_4px_8px_rgba(0,0,0,.35)]">
          {isPlaying ? <Volume2 className="h-[62%] w-[62%] animate-pulse" strokeWidth={2.8} /> : <Icon className="h-[62%] w-[62%]" strokeWidth={2.8} />}
        </span>
      </button>
      <strong className={`mt-2 line-clamp-2 leading-tight ${darkSurface ? "text-white" : "text-foreground"} ${compact ? "text-xs" : "text-sm sm:text-base"}`}>{title}</strong>
      {subtitle && <span className={`mt-0.5 line-clamp-1 max-w-full text-[11px] ${darkSurface ? "text-white/60" : "text-muted-foreground"}`}>{subtitle}</span>}
      {action}
    </div>
  );
}
