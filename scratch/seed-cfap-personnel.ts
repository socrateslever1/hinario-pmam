import "dotenv/config";
import { seedInitialCfapPersonnel } from "../server/cfapPersonnelDb";

try {
  const result = await seedInitialCfapPersonnel(null);
  console.log(`Carga inicial concluída: ${result.inserted} incluídos, ${result.updated} atualizados, ${result.total} registros conferidos.`);
  process.exit(0);
} catch (error) {
  console.error("Falha ao carregar o efetivo inicial do CFAP:", error);
  process.exit(1);
}

