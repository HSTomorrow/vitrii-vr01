import { execSync } from "child_process";

console.log("🚀 Adding Localidades, Anunciantes x Localidades, and User Locality Field...\n");

const sql = `
  -- Create localidades table
  CREATE TABLE IF NOT EXISTS localidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    municipio VARCHAR(255) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    descricao TEXT,
    observacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ativo',
    "dataCriacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(municipio, estado)
  );

  -- Create indexes on localidades
  CREATE INDEX IF NOT EXISTS idx_localidades_status ON localidades(status);
  CREATE INDEX IF NOT EXISTS idx_localidades_municipio ON localidades(municipio);
  CREATE INDEX IF NOT EXISTS idx_localidades_estado ON localidades(estado);

  -- Add localidadePadraoId to usracessos table
  ALTER TABLE usracessos
  ADD COLUMN IF NOT EXISTS "localidadePadraoId" INTEGER REFERENCES localidades(id) ON DELETE SET NULL;

  CREATE INDEX IF NOT EXISTS idx_usracessos_localidade_padrao ON usracessos("localidadePadraoId");

  -- Create anunciantes_x_localidades junction table
  CREATE TABLE IF NOT EXISTS anunciantes_x_localidades (
    id SERIAL PRIMARY KEY,
    "anuncianteId" INTEGER NOT NULL REFERENCES anunciantes(id) ON DELETE CASCADE,
    "localidadeId" INTEGER NOT NULL REFERENCES localidades(id) ON DELETE CASCADE,
    "dataCriacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("anuncianteId", "localidadeId")
  );

  -- Create indexes on junction table
  CREATE INDEX IF NOT EXISTS idx_anunciantes_x_localidades_anunciante ON anunciantes_x_localidades("anuncianteId");
  CREATE INDEX IF NOT EXISTS idx_anunciantes_x_localidades_localidade ON anunciantes_x_localidades("localidadeId");

  -- Insert default localidades with placeholder values
  INSERT INTO localidades (codigo, municipio, estado, descricao, status)
  VALUES 
    ('RS-MONTENEGRO', 'Montenegro', 'RS', 'Montenegro - Rio Grande do Sul', 'ativo')
  ON CONFLICT (codigo) DO NOTHING;

  SELECT '✅ Localidades setup completed!' as result;
`;

try {
  console.log("📝 Creating localidades tables and adding user field...");
  
  const result = execSync(
    `psql "${"$DATABASE_URL"}" -c "${sql.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8" }
  );

  console.log(result);
  console.log("\n✅ All localidade-related changes applied successfully!");
} catch (error) {
  console.error("❌ Error applying migrations:", error.message);
  process.exit(1);
}
