import bcrypt from "bcryptjs";

async function run() {
  const hash = "$2b$12$DDQRYMPONg5VfqYETx8F/OMDf/xYk5tW3nU4RBjUiUZ4dz.WmFXiy";
  const pass = "pmam2026";
  const result = await bcrypt.compare(pass, hash);
  console.log(`Bcrypt comparison for "${pass}" against the hash:`, result);
}

run();
