export type DrillState =
  | "descansar"
  | "a_vontade"
  | "sentido"
  | "ombro_arma"
  | "apresentar_arma"
  | "cruzar_arma"
  | "cobrir"
  | "olhar_direita"
  | "olhar_esquerda"
  | "marcha"
  | "marcar_passo"
  | "acelerado";

export const DRILL_STATE_LABELS: Record<DrillState, string> = {
  descansar: "Descansar",
  a_vontade: "À vontade",
  sentido: "Sentido",
  ombro_arma: "Ombro arma",
  apresentar_arma: "Apresentar arma",
  cruzar_arma: "Cruzar arma",
  cobrir: "Cobrir",
  olhar_direita: "Olhar à direita",
  olhar_esquerda: "Olhar à esquerda",
  marcha: "Em marcha",
  marcar_passo: "Marcar passo",
  acelerado: "Em acelerado",
};

type CommandRule = {
  command: string;
  allowedFrom: DrillState[];
  nextState: DrillState;
  changesPosition?: boolean;
};

export function normalizeDrillCommand(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

const RULES: CommandRule[] = [
  { command: "a vontade", allowedFrom: ["descansar"], nextState: "a_vontade", changesPosition: true },
  { command: "cessar o a vontade", allowedFrom: ["a_vontade"], nextState: "descansar", changesPosition: true },
  { command: "cessar a vontade", allowedFrom: ["a_vontade"], nextState: "descansar", changesPosition: true },
  { command: "descansar", allowedFrom: ["sentido", "a_vontade"], nextState: "descansar", changesPosition: true },
  { command: "sentido", allowedFrom: ["descansar"], nextState: "sentido", changesPosition: true },
  { command: "ombro arma", allowedFrom: ["sentido", "apresentar_arma", "cruzar_arma"], nextState: "ombro_arma", changesPosition: true },
  { command: "apresentar arma", allowedFrom: ["sentido", "ombro_arma"], nextState: "apresentar_arma", changesPosition: true },
  { command: "cruzar arma", allowedFrom: ["sentido", "ombro_arma"], nextState: "cruzar_arma", changesPosition: true },
  { command: "descansar arma", allowedFrom: ["ombro_arma", "apresentar_arma", "cruzar_arma"], nextState: "sentido", changesPosition: true },
  { command: "cobrir", allowedFrom: ["sentido"], nextState: "cobrir", changesPosition: true },
  { command: "firme", allowedFrom: ["cobrir"], nextState: "sentido", changesPosition: true },
  { command: "olhar a direita", allowedFrom: ["sentido"], nextState: "olhar_direita", changesPosition: true },
  { command: "olhar a esquerda", allowedFrom: ["sentido"], nextState: "olhar_esquerda", changesPosition: true },
  { command: "olhar em frente", allowedFrom: ["olhar_direita", "olhar_esquerda"], nextState: "sentido", changesPosition: true },
  { command: "ordinario marche", allowedFrom: ["sentido", "marcar_passo"], nextState: "marcha", changesPosition: true },
  { command: "marcha batida", allowedFrom: ["sentido", "marcar_passo"], nextState: "marcha", changesPosition: true },
  { command: "marcar passo", allowedFrom: ["sentido", "marcha"], nextState: "marcar_passo", changesPosition: true },
  { command: "acelerado", allowedFrom: ["sentido", "marcha"], nextState: "acelerado", changesPosition: true },
  { command: "alto", allowedFrom: ["marcha", "marcar_passo", "acelerado"], nextState: "sentido", changesPosition: true },
  { command: "direita volver", allowedFrom: ["sentido"], nextState: "sentido" },
  { command: "esquerda volver", allowedFrom: ["sentido"], nextState: "sentido" },
  { command: "meia volta volver", allowedFrom: ["sentido"], nextState: "sentido" },
  { command: "em direcao a direita", allowedFrom: ["marcha"], nextState: "marcha" },
  { command: "em direcao a esquerda", allowedFrom: ["marcha"], nextState: "marcha" },
];

const RULE_BY_COMMAND = new Map(RULES.map((rule) => [rule.command, rule]));

export function getDrillCommandRule(commandName: string): CommandRule {
  const normalized = normalizeDrillCommand(commandName);
  const exact = RULE_BY_COMMAND.get(normalized);
  if (exact) return exact;

  // Intelligent pattern matching for command variations (e.g. "Ordinário marche com dobrado", "Ordinário marche B", "Alto à tropa", etc.)
  if (normalized.includes("ordinario march") || normalized.includes("marcha ordinaria")) {
    return RULE_BY_COMMAND.get("ordinario marche")!;
  }
  if (normalized.includes("marcha batida")) {
    return RULE_BY_COMMAND.get("marcha batida")!;
  }
  if (normalized.includes("marcar passo")) {
    return RULE_BY_COMMAND.get("marcar passo")!;
  }
  if (normalized.includes("acelerado")) {
    return RULE_BY_COMMAND.get("acelerado")!;
  }
  if (normalized.startsWith("alto") || normalized.includes(" alto") || normalized.endsWith("alto")) {
    return RULE_BY_COMMAND.get("alto")!;
  }
  if (normalized.includes("cessar") && normalized.includes("vontade")) {
    return RULE_BY_COMMAND.get("cessar o a vontade")!;
  }
  if (normalized.includes("vontade")) {
    return RULE_BY_COMMAND.get("a vontade")!;
  }
  if (normalized.includes("descansar arma")) {
    return RULE_BY_COMMAND.get("descansar arma")!;
  }
  if (normalized.includes("descansar")) {
    return RULE_BY_COMMAND.get("descansar")!;
  }
  if (normalized.includes("sentido")) {
    return RULE_BY_COMMAND.get("sentido")!;
  }
  if (normalized.includes("ombro arma")) {
    return RULE_BY_COMMAND.get("ombro arma")!;
  }
  if (normalized.includes("apresentar arma")) {
    return RULE_BY_COMMAND.get("apresentar arma")!;
  }
  if (normalized.includes("cruzar arma")) {
    return RULE_BY_COMMAND.get("cruzar arma")!;
  }
  if (normalized.includes("cobrir")) {
    return RULE_BY_COMMAND.get("cobrir")!;
  }
  if (normalized.includes("firme")) {
    return RULE_BY_COMMAND.get("firme")!;
  }
  if (normalized.includes("olhar") && normalized.includes("direita")) {
    return RULE_BY_COMMAND.get("olhar a direita")!;
  }
  if (normalized.includes("olhar") && normalized.includes("esquerda")) {
    return RULE_BY_COMMAND.get("olhar a esquerda")!;
  }
  if (normalized.includes("olhar") && normalized.includes("frente")) {
    return RULE_BY_COMMAND.get("olhar em frente")!;
  }
  if (normalized.includes("direita") && normalized.includes("volver")) {
    return RULE_BY_COMMAND.get("direita volver")!;
  }
  if (normalized.includes("esquerda") && normalized.includes("volver")) {
    return RULE_BY_COMMAND.get("esquerda volver")!;
  }
  if (normalized.includes("meia volta")) {
    return RULE_BY_COMMAND.get("meia volta volver")!;
  }
  if (normalized.includes("direcao") && normalized.includes("direita")) {
    return RULE_BY_COMMAND.get("em direcao a direita")!;
  }
  if (normalized.includes("direcao") && normalized.includes("esquerda")) {
    return RULE_BY_COMMAND.get("em direcao a esquerda")!;
  }

  return {
    command: normalized,
    allowedFrom: ["sentido"],
    nextState: "sentido",
  };
}

export function isDrillCommandAllowed(commandName: string, state: DrillState) {
  if (normalizeDrillCommand(commandName) === "ultima forma") return true;
  return getDrillCommandRule(commandName).allowedFrom.includes(state);
}

export function applyDrillCommand(commandName: string, state: DrillState): DrillState {
  if (normalizeDrillCommand(commandName) === "ultima forma") return state;
  const rule = getDrillCommandRule(commandName);
  return rule.allowedFrom.includes(state) ? rule.nextState : state;
}

export function getPositionCommandsAllowedFrom(state: DrillState) {
  return RULES
    .filter((rule) => rule.changesPosition && rule.allowedFrom.includes(state))
    .map((rule) => rule.command);
}

export function getRequiredCommandSequence(commandName: string, state: DrillState) {
  const targetRule = getDrillCommandRule(commandName);
  if (targetRule.allowedFrom.includes(state)) return [];

  const positionRules = RULES.filter((rule) => rule.changesPosition);
  const queue: Array<{ state: DrillState; commands: string[] }> = [{ state, commands: [] }];
  const visited = new Set<DrillState>([state]);

  while (queue.length) {
    const current = queue.shift()!;
    if (targetRule.allowedFrom.includes(current.state)) {
      return [...current.commands, targetRule.command];
    }

    for (const rule of positionRules) {
      if (!rule.allowedFrom.includes(current.state) || visited.has(rule.nextState)) continue;
      visited.add(rule.nextState);
      queue.push({ state: rule.nextState, commands: [...current.commands, rule.command] });
    }
  }

  return [targetRule.command];
}

export const MARCH_STATES: DrillState[] = ["marcha", "marcar_passo", "acelerado"];
