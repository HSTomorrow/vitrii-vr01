#!/usr/bin/env tsx
import { sendTestEmail } from "./lib/emailService";

async function testEmail() {
  console.log("🧪 Iniciando teste de envio de email...\n");

  const toEmail = "daniel_pelegrinelli@hotmail.com";
  const fromEmail = "contato@herestomorrow.com";

  console.log(`📧 De: ${fromEmail}`);
  console.log(`📧 Para: ${toEmail}`);
  console.log(`📧 Servidor SMTP: ${process.env.SMTP_HOST}`);
  console.log(`📧 Porta: ${process.env.SMTP_PORT}`);
  console.log(`📧 Usuário: ${process.env.SMTP_USER}`);
  console.log("");

  const success = await sendTestEmail(toEmail, fromEmail);

  if (success) {
    console.log("\n✅ Email de teste enviado com sucesso!");
    console.log("\n📬 Verifique o email em alguns minutos em: daniel_pelegrinelli@hotmail.com");
  } else {
    console.log("\n❌ Erro ao enviar email de teste");
    console.log("⚠️  Verifique as configurações SMTP no arquivo .env");
  }

  process.exit(success ? 0 : 1);
}

testEmail().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
