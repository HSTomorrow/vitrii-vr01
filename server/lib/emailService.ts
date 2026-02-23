import nodemailer from "nodemailer";

// Create a reusable transporter
// For development, we'll use ethereal (testing service)
// For production, configure with your SMTP provider

let transporter: nodemailer.Transporter | null = null;
let lastSmtpConfig: string = "";

// Create or get transporter based on current environment
async function getTransporter() {
  // Check if SMTP configuration exists
  const currentConfig = `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`;

  // If SMTP is configured and hasn't changed, return cached transporter
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    lastSmtpConfig === currentConfig &&
    transporter
  ) {
    return transporter;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    // Production: Use configured SMTP
    console.log("🔄 Inicializando transporter com configuração SMTP real");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    lastSmtpConfig = currentConfig;
  } else {
    // Development: Use Ethereal (fake SMTP service for testing)
    console.log("🔄 Inicializando transporter com Ethereal (teste)");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    lastSmtpConfig = "";
  }

  return transporter;
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  userName: string,
): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@vitrii.com",
      to: email,
      bcc: ["herestomorrow@outlook.com", "vitriimarketplace@gmail.com"],
      subject: "Redefinir sua senha - Vitrii",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0066cc; margin: 0;">Vitrii</h1>
              <p style="color: #666; font-size: 14px;">Marketplace Inteligente</p>
            </div>
            
            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Redefinir sua senha</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Olá <strong>${userName}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Redefinir Senha
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Se o botão não funcionar, copie e cole este link em seu navegador:<br>
              <code style="background-color: #f0f0f0; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">${resetLink}</code>
            </p>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              Este link expira em 1 hora.<br>
              Se você não solicitou uma redefinição de senha, pode ignorar este email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 Vitrii. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
        Redefinir sua senha
        
        Olá ${userName},
        
        Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo para criar uma nova senha:
        
        ${resetLink}
        
        Este link expira em 1 hora.
        
        Se você não solicitou uma redefinição de senha, pode ignorar este email.
        
        © 2025 Vitrii
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de redefinição de senha enviado com sucesso");
    console.log("   - Para:", email);
    console.log("   - De:", process.env.MAIL_FROM);
    console.log(
      "   - BCC:",
      "herestomorrow@outlook.com, vitriimarketplace@gmail.com",
    );
    console.log("   - Message ID:", info.messageId);

    // In development, log preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("   - Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email de redefinição de senha:", error);
    console.error("   - Destinatário:", email);
    console.error("   - SMTP Host:", process.env.SMTP_HOST);
    console.error("   - SMTP Port:", process.env.SMTP_PORT);
    console.error("   - SMTP User:", process.env.SMTP_USER);
    return false;
  }
}

export async function sendEmailVerificationEmail(
  email: string,
  userName: string,
  verificationLink: string,
): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@vitrii.com",
      to: email,
      bcc: ["herestomorrow@outlook.com", "vitriimarketplace@gmail.com"],
      subject: "Confirme seu e-mail - Vitrii",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0066cc; margin: 0;">Vitrii</h1>
              <p style="color: #666; font-size: 14px;">Marketplace Inteligente</p>
            </div>

            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Confirme seu e-mail</h2>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Olá <strong>${userName}</strong>,
            </p>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Obrigado por se cadastrar no Vitrii! Para ativar sua conta e começar a usar a plataforma, clique no botão abaixo para confirmar seu e-mail:
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Confirmar E-mail
              </a>
            </div>

            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              Se o botão não funcionar, copie e cole este link em seu navegador:<br>
              <code style="background-color: #f0f0f0; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">${verificationLink}</code>
            </p>

            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
              Este link expira em 24 horas.<br>
              Se você não criou uma conta, pode ignorar este email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 Vitrii. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
      text: `
        Confirme seu e-mail

        Olá ${userName},

        Obrigado por se cadastrar no Vitrii! Para ativar sua conta, clique no link abaixo:

        ${verificationLink}

        Este link expira em 24 horas.

        Se você não criou uma conta, pode ignorar este email.

        © 2025 Vitrii
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de verificação enviado com sucesso");
    console.log("   - Para:", email);
    console.log("   - De:", process.env.MAIL_FROM);
    console.log(
      "   - BCC:",
      "herestomorrow@outlook.com, vitriimarketplace@gmail.com",
    );
    console.log("   - Message ID:", info.messageId);

    // In development, log preview URL
    if (process.env.NODE_ENV !== "production") {
      console.log("   - Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email de verificação:", error);
    console.error("   - Destinatário:", email);
    console.error("   - SMTP Host:", process.env.SMTP_HOST);
    console.error("   - SMTP Port:", process.env.SMTP_PORT);
    console.error("   - SMTP User:", process.env.SMTP_USER);
    return false;
  }
}

export async function sendWelcomeEmail(
  email: string,
  userName: string,
): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.MAIL_FROM || "noreply@vitrii.com",
      to: email,
      bcc: ["herestomorrow@outlook.com", "vitriimarketplace@gmail.com"],
      subject: "Bem-vindo ao Vitrii!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0066cc; margin: 0;">Vitrii</h1>
              <p style="color: #666; font-size: 14px;">Marketplace Inteligente</p>
            </div>

            <h2 style="color: #333; font-size: 24px; margin: 0 0 20px 0;">Bem-vindo!</h2>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Olá <strong>${userName}</strong>,
            </p>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Sua conta no Vitrii foi criada com sucesso! Você agora pode acessar a plataforma e começar a comprar ou vender produtos e serviços.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || "https://vitrii.com"}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Acessar Vitrii
              </a>
            </div>

            <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">
              Se tiver dúvidas, entre em contato conosco.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              © 2025 Vitrii. Todos os direitos reservados.
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email de boas-vindas enviado com sucesso");
    console.log("   - Para:", email);
    console.log("   - De:", process.env.MAIL_FROM);
    console.log(
      "   - BCC:",
      "herestomorrow@outlook.com, vitriimarketplace@gmail.com",
    );
    console.log("   - Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar email de boas-vindas:", error);
    console.error("   - Destinatário:", email);
    console.error("   - SMTP Host:", process.env.SMTP_HOST);
    console.error("   - SMTP Port:", process.env.SMTP_PORT);
    console.error("   - SMTP User:", process.env.SMTP_USER);
    return false;
  }
}
