export type EffectiveStudent = {
  numerica?: string | null;
  nomeGuerra?: string | null;
  nomeCompleto?: string | null;
  registrationStatus?: "available" | "active" | "blocked" | null;
};

export function filterEffectiveStudents<T extends EffectiveStudent>(students: T[], query: string): T[] {
  const registeredStudents = students.filter((student) => student.registrationStatus === "active");
  const search = query.trim().toLocaleLowerCase("pt-BR");
  if (!search) return registeredStudents;

  return registeredStudents.filter((student) => [student.numerica, student.nomeGuerra, student.nomeCompleto]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("pt-BR")
    .includes(search));
}
