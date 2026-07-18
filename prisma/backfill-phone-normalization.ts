// One-off backfill: normalizes phone numbers written before createContato/
// updateContato/createUsuario/updateUsuario started calling normalizeBRPhone()
// on every save. Legacy rows without the +55 country code silently fail the
// exact-string-match used by contatos_usuarios_links (server/routes/sync-contatos-usuarios.ts)
// to link a contato to the usuario sharing its email/celular - this fixes that
// for existing data, then re-runs the sync so any newly-matching pairs link up.
import prisma from "../server/lib/prisma";
import { normalizeBRPhone } from "../server/lib/phone";
import { runContatosUsuariosSync } from "../server/routes/sync-contatos-usuarios";

async function main() {
  console.log("📞 Normalizando números de telefone existentes...\n");

  const contatos = await prisma.contatos.findMany({
    select: { id: true, celular: true, telefone: true },
  });

  let contatosUpdated = 0;
  for (const contato of contatos) {
    const normalizedCelular = normalizeBRPhone(contato.celular);
    const normalizedTelefone = normalizeBRPhone(contato.telefone);

    const data: { celular?: string; telefone?: string | null } = {};
    if (normalizedCelular && normalizedCelular !== contato.celular) {
      data.celular = normalizedCelular;
    }
    if (normalizedTelefone !== contato.telefone) {
      data.telefone = normalizedTelefone;
    }

    if (Object.keys(data).length > 0) {
      await prisma.contatos.update({ where: { id: contato.id }, data });
      contatosUpdated++;
    }
  }
  console.log(`✅ contatos: ${contatosUpdated}/${contatos.length} atualizados`);

  const usuarios = await prisma.usracessos.findMany({
    select: { id: true, telefone: true, whatsapp: true },
  });

  let usuariosUpdated = 0;
  for (const usuario of usuarios) {
    const normalizedTelefone = normalizeBRPhone(usuario.telefone);
    const normalizedWhatsapp = normalizeBRPhone(usuario.whatsapp);

    const data: { telefone?: string | null; whatsapp?: string | null } = {};
    if (normalizedTelefone !== usuario.telefone) {
      data.telefone = normalizedTelefone;
    }
    if (normalizedWhatsapp !== usuario.whatsapp) {
      data.whatsapp = normalizedWhatsapp;
    }

    if (Object.keys(data).length > 0) {
      await prisma.usracessos.update({ where: { id: usuario.id }, data });
      usuariosUpdated++;
    }
  }
  console.log(`✅ usracessos: ${usuariosUpdated}/${usuarios.length} atualizados`);

  console.log("\n🔄 Re-executando sync de contatos_usuarios_links com os números corrigidos...");
  const { linkedCount } = await runContatosUsuariosSync();
  console.log(`✅ Sync concluído: ${linkedCount} vínculos criados/atualizados`);
}

main()
  .then(() => {
    console.log("\n🎉 Backfill finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro no backfill:", error);
    process.exit(1);
  });
