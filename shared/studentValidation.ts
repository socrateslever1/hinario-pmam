/**
 * Validação de numérica do aluno
 * Estrutura: XXYY
 * XX = Companhia (1º dígito) + Pelotão (2º dígito)
 * YY = Número individual do aluno
 *
 * Exemplos:
 * 1111 = 1ª Companhia, 1º Pelotão, aluno 11
 * 1215 = 1ª Companhia, 2º Pelotão, aluno 15
 * 2150 = 2ª Companhia, 1º Pelotão, aluno 50
 * 5252 = 5ª Companhia, 2º Pelotão, aluno 52
 */

export interface NumericaInfo {
  numerica: string;
  companhia: number;
  peloton: number;
  alunoNumber: number;
  isValid: boolean;
  error?: string;
}

export function validateNumerica(numerica: string): NumericaInfo {
  // Remover formatação se houver
  const clean = numerica.replace(/\D/g, "");

  // Verificar se tem exatamente 4 dígitos
  if (clean.length !== 4) {
    return {
      numerica,
      companhia: 0,
      peloton: 0,
      alunoNumber: 0,
      isValid: false,
      error: "Numérica deve ter exatamente 4 dígitos",
    };
  }

  const companhia = parseInt(clean[0], 10);
  const peloton = parseInt(clean[1], 10);
  const alunoNumber = parseInt(clean.substring(2), 10);

  // Validar companhia (1-5)
  if (companhia < 1 || companhia > 5) {
    return {
      numerica,
      companhia,
      peloton,
      alunoNumber,
      isValid: false,
      error: "Companhia deve estar entre 1 e 5",
    };
  }

  // Validar pelotão (1-2)
  if (peloton < 1 || peloton > 2) {
    return {
      numerica,
      companhia,
      peloton,
      alunoNumber,
      isValid: false,
      error: "Pelotão deve estar entre 1 e 2",
    };
  }

  // Validar range geral (1111 a 5252)
  const numValue = parseInt(clean, 10);
  if (numValue < 1111 || numValue > 5252) {
    return {
      numerica,
      companhia,
      peloton,
      alunoNumber,
      isValid: false,
      error: "Numérica deve estar entre 1111 e 5252",
    };
  }

  return {
    numerica: clean,
    companhia,
    peloton,
    alunoNumber,
    isValid: true,
  };
}

export function getCompanhiaLabel(companhia: number): string {
  const labels: Record<number, string> = {
    1: "1ª Companhia",
    2: "2ª Companhia",
    3: "3ª Companhia",
    4: "4ª Companhia",
    5: "5ª Companhia",
  };
  return labels[companhia] || "Companhia desconhecida";
}

export function getPelotonLabel(peloton: number): string {
  const labels: Record<number, string> = {
    1: "1º Pelotão",
    2: "2º Pelotão",
  };
  return labels[peloton] || "Pelotão desconhecido";
}
