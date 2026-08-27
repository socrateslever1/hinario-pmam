import type { LucideIcon } from "lucide-react";
import {
  AlarmClock,
  AlignJustify,
  Armchair,
  ArrowLeft,
  ArrowRight,
  Badge,
  Ban,
  Bell,
  BedDouble,
  Briefcase,
  Building2,
  CircleStop,
  Clock3,
  Combine,
  CornerUpLeft,
  CornerUpRight,
  Crown,
  Drum,
  Eye,
  EyeOff,
  Flag,
  Flame,
  FlipHorizontal2,
  Footprints,
  Gauge,
  GraduationCap,
  Hand,
  Landmark,
  Megaphone,
  Medal,
  MoveUpRight,
  Music2,
  Network,
  Octagon,
  PersonStanding,
  RotateCcw,
  RotateCw,
  Rows3,
  ScanSearch,
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  Star,
  Sun,
  Sunrise,
  Swords,
  TimerOff,
  Undo2,
  UserCheck,
  UserCog,
  UserRound,
  UserRoundCheck,
  Users,
  UsersRound,
  UtensilsCrossed,
  Volume2,
  VolumeX,
  Waves,
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

const UNIQUE_COMMAND_ICONS: Record<string, LucideIcon> = {
  "a vontade": Armchair,
  acelerado: Gauge,
  "ajudante geral": UserCog,
  alto: Octagon,
  alvorada: Sunrise,
  "apresentar arma": Hand,
  "avancar ao rancho": UtensilsCrossed,
  "bandeira nacional": Flag,
  batalhao: Building2,
  bombeiro: Flame,
  cavalaria: Shield,
  "cessar o a vontade": Ban,
  "chefe estado maior": Star,
  "chefe do estado maior": Star,
  "comandante de batalhao": UserRound,
  "comandante de companhia": UsersRound,
  "comandante geral": Crown,
  cobrir: AlignJustify,
  companhia: Rows3,
  contingente: Network,
  "cruzar arma": Swords,
  descansar: BedDouble,
  "descansar arma": ShieldOff,
  "direita volver": RotateCw,
  "em continencia": Medal,
  "em direcao a direita": CornerUpRight,
  "em direcao a esquerda": CornerUpLeft,
  escola: GraduationCap,
  "esquerda volver": RotateCcw,
  firme: UserCheck,
  governador: Landmark,
  granadeira: Drum,
  "inicio expediente": Clock3,
  "inicio do expediente": Clock3,
  "inspecoes policiais": ScanSearch,
  "marcar passo": Footprints,
  "marcha batida": Waves,
  "meia volta volver": FlipHorizontal2,
  "oficial superior": Badge,
  "olhar a direita": Eye,
  "olhar em frente": EyeOff,
  "ombro arma": Briefcase,
  ordem: Megaphone,
  "ordinario marche": MoveUpRight,
  "para prontidao": Bell,
  pelotao: Users,
  "policia militar": ShieldCheck,
  presidente: UserRoundCheck,
  reunir: Combine,
  "revista do recolher": Search,
  sentido: PersonStanding,
  silencio: VolumeX,
  "termino expediente": TimerOff,
  "termino do expediente": TimerOff,
  "ultima forma": Undo2,
};

export function getCommandVisual(title: string, iconKey?: string | null): { Icon: LucideIcon; tone: Tone } {
  const command = normalizeDrillCommand(title);
  const uniqueIcon = UNIQUE_COMMAND_ICONS[command];
  let semanticIcon: LucideIcon | undefined;
  let tone: Tone | undefined;

  if (/silencio/.test(command)) [semanticIcon, tone] = [VolumeX, "blue"];
  else if (/alvorada/.test(command)) [semanticIcon, tone] = [Sun, "yellow"];
  else if (/expediente|recolher|horario/.test(command)) [semanticIcon, tone] = [AlarmClock, "yellow"];
  else if (/rancho/.test(command)) [semanticIcon, tone] = [UtensilsCrossed, "orange"];
  else if (/bandeira/.test(command)) [semanticIcon, tone] = [Flag, "green"];
  else if (/bombeiro/.test(command)) [semanticIcon, tone] = [Flame, "red"];
  else if (/escola/.test(command)) [semanticIcon, tone] = [GraduationCap, "blue"];
  else if (/governador|presidente|comandante|oficial|chefe/.test(command)) [semanticIcon, tone] = [Star, "purple"];
  else if (/batalhao|companhia|pelotao|contingente|reunir|cobrir/.test(command)) [semanticIcon, tone] = [Users, "orange"];
  else if (/a vontade|descansar$/.test(command)) [semanticIcon, tone] = [BedDouble, "green"];
  else if (/sentido|firme/.test(command)) [semanticIcon, tone] = [PersonStanding, "red"];
  else if (/apresentar arma/.test(command)) [semanticIcon, tone] = [Hand, "red"];
  else if (/ombro arma|cruzar arma|descansar arma/.test(command)) [semanticIcon, tone] = [Swords, "orange"];
  else if (/olhar/.test(command)) [semanticIcon, tone] = [Eye, "blue"];
  else if (/direita/.test(command)) [semanticIcon, tone] = [ArrowRight, "blue"];
  else if (/esquerda/.test(command)) [semanticIcon, tone] = [ArrowLeft, "blue"];
  else if (/volta volver/.test(command)) [semanticIcon, tone] = [RotateCcw, "blue"];
  else if (/alto/.test(command)) [semanticIcon, tone] = [CircleStop, "red"];
  else if (/marcha|marche|marcar passo|acelerado|avancar/.test(command)) [semanticIcon, tone] = [Footprints, "yellow"];
  else if (/ordem|prontidao|inspec/.test(command)) [semanticIcon, tone] = [Shield, "red"];

  const Icon = uniqueIcon || semanticIcon || (iconKey && ICON_BY_KEY[iconKey]) || Megaphone;
  const tones: Tone[] = ["red", "yellow", "blue", "green", "orange", "purple"];
  const hash = command.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return { Icon, tone: tone || tones[hash % tones.length] };
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
        className={`group relative grid aspect-square w-full place-items-center rounded-full border-4 outline-none transition duration-150 focus-visible:ring-4 focus-visible:ring-amber-400/70 active:translate-y-1 active:scale-[.97] ${compact ? "max-w-[4.25rem]" : "max-w-[6.25rem]"} ${TONE_STYLES[tone]} ${!isAllowed && !isPlaying ? "cursor-not-allowed grayscale-[.45] opacity-45" : "hover:brightness-110"}`}
      >
        <span className="absolute inset-[8%] rounded-full border-2 border-white/45 bg-black/10 shadow-[inset_0_3px_8px_rgba(0,0,0,.3)]" />
        <span className="absolute left-[19%] top-[10%] h-[17%] w-[50%] rotate-[-8deg] rounded-full bg-white/35 blur-[1px]" />
        <span className="relative grid h-[53%] w-[53%] place-items-center rounded-full bg-white/90 !text-slate-900 shadow-[0_4px_8px_rgba(0,0,0,.35)]">
          {isPlaying ? <Volume2 className="h-[62%] w-[62%] animate-pulse" strokeWidth={2.8} /> : <Icon className="h-[62%] w-[62%]" strokeWidth={2.8} />}
        </span>
      </button>
      <strong className={`mt-1.5 line-clamp-2 leading-tight ${darkSurface ? "text-white" : "text-foreground"} ${compact ? "text-xs" : "text-xs sm:text-sm"}`}>{title}</strong>
      {subtitle && <span className={`mt-0.5 line-clamp-1 max-w-full text-xs ${darkSurface ? "text-white/60" : "text-muted-foreground"}`}>{subtitle}</span>}
      {action}
    </div>
  );
}
