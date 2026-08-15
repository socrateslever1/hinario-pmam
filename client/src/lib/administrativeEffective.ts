export type EffectiveStudent = {
  numerica?: string | null;
  nomeGuerra?: string | null;
  nomeCompleto?: string | null;
};

export function filterEffectiveStudents<T extends EffectiveStudent>(students: T[], query: string): T[] {
  const search = query.trim().toLocaleLowerCase("pt-BR");
  if (!search) return students;

  return students.filter((student) => [student.numerica, student.nomeGuerra, student.nomeCompleto]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("pt-BR")
    .includes(search));
}
