import { StudyModule } from "./types";
export type { StudyModule, StudyQuestion, StudySection } from "./types";

import { manualCfapModule } from "./modules/manual-cfap";
import { estatutoPmamModule } from "./modules/estatuto-pmam";
import { rupmamUniformesModule } from "./modules/rupmam-uniformes";
import { rcontContinenciasModule } from "./modules/rcont-continencias";
import { rdpmamDisciplinaModule } from "./modules/rdpmam-disciplina";
import { risgServicosGeraisModule } from "./modules/risg-servicos-gerais";

export const studyModules: StudyModule[] = [
  manualCfapModule,
  estatutoPmamModule,
  rupmamUniformesModule,
  rcontContinenciasModule,
  rdpmamDisciplinaModule,
  risgServicosGeraisModule,
];

export function getStudyModule(slug: string) {
  return studyModules.find((module) => module.slug === slug) ?? null;
}
