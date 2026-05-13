/**
 * Formata uma data para o padrão brasileiro (DD/MM/YYYY HH:MM)
 */
export function formatDateBR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formata uma data apenas com dia/mês/ano
 */
export function formatDateBRShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data em formato legível em português (ex: "13 de maio de 2026")
 */
export function formatDateBRLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} de ${month} de ${year}`;
}
