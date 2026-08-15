type AdministrativeFoRecord = {
  type: "positive" | "negative" | string;
  foCode?: string | null;
  numerica?: string | number | null;
  nomeGuerra?: string | null;
  validationStatus?: "approved" | "rejected" | string | null;
};

export function buildAdministrativeFoSummary(record: AdministrativeFoRecord) {
  const student = [record.numerica, record.nomeGuerra].filter(Boolean).join(" ").trim() || "Aluno";
  const fo = `${record.type === "positive" ? "FO+" : "FO-"}${record.foCode ? ` ${record.foCode}` : ""}`;
  return record.validationStatus === "approved"
    ? `${student} recebeu ${fo}.`
    : `${fo} de ${student} foi rejeitado.`;
}

export function getLcHistoryLabel(status?: string | null) {
  switch (status) {
    case "pending": return "Originou LC pendente";
    case "homologated": return "Originou LC homologada";
    case "rejected": return "LC concluída/arquivada";
    case "cancelled": return "LC cancelada";
    default: return null;
  }
}
