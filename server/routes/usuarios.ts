import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { sendPasswordResetEmail, sendWelcomeEmail, sendEmailVerificationEmail } from "../lib/emailService";
import crypto from "crypto";

// NOTE: This file handles usracessos (User Access) model operations
// Routes are registered as /api/usracessos in server/index.ts

// Schema validation for signup (basic info only)
const UsuarioSignUpSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255),
    email: z.string().email("Email inválido"),
    senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "Senhas não conferem",
    path: ["confirmarSenha"],
  });

// Schema validation for full user (with additional info)
const UsuarioCreateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  cpf: z
    .string()
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      // Accept either 11 digits (CPF) or 14 digits (CNPJ)
      return /^\d{11}$|^\d{14}$/.test(digitsOnly);
    }, "CPF \ CNPJ deve ter 11 ou 14 dígitos")
    .optional(),
  telefone: z.string().min(10, "Telefone inválido").optional(),
  endereco: z.string().min(1, "Endereço é obrigatório").optional(),
});

// GET all users
export const getUsuarios: RequestHandler = async (req, res) => {
  try {
    const usuarios = await prisma.usracessos.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        whatsapp: true,
        linkedin: true,
        facebook: true,
        tipoUsuario: true,
        tassinatura: true,
        status: true,
        dataCriacao: true,
        dataVigenciaContrato: true,
        numeroAnunciosAtivos: true,
        maxAnunciosAtivos: true,
        endereco: true,
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    res.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar usuários",
    });
  }
};

// GET user by ID
export const getUsuarioById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usracessos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        whatsapp: true,
        linkedin: true,
        facebook: true,
        endereco: true,
        tipoUsuario: true,
        status: true,
        dataCriacao: true,
        dataAtualizacao: true,
        numeroAnunciosAtivos: true,
        maxAnunciosAtivos: true,
        localidadePadraoId: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is inactive
    if (usuario.status === "inativo") {
      return res.status(403).json({
        success: false,
        error: "Usuário inativo",
        inactive: true,
      });
    }

    res.json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar usuário",
    });
  }
};

// SIGNIN - Authenticate user with email and password
export const signInUsuario: RequestHandler = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validate input
    if (!email || !senha) {
      console.warn("[signInUsuario] ❌ Requisição incompleta:", {
        hasEmail: !!email,
        hasSenha: !!senha
      });
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios",
      });
    }

    // Find user by email
    const usuario = await prisma.usracessos.findUnique({
      where: { email },
    });

    if (!usuario) {
      console.warn("[signInUsuario] ❌ Usuário não encontrado:", email);
      return res.status(401).json({
        success: false,
        error: "Email ou senha incorretos",
        blocked: false,
      });
    }

    // Check if user is blocked
    if (usuario.status === "bloqueado") {
      console.warn("[signInUsuario] ⛔ Usuário bloqueado:", email);

      // If email is not verified, it's a new user waiting for email confirmation
      if (!usuario.emailVerificado) {
        return res.status(403).json({
          success: false,
          error: "Usuario bloqueado. Verifique sua caixa de entrada do e-mail ou spam para validar o seu cadastro. Em caso de duvidas, contactar a pagina de suporte.",
          blocked: true,
          requiresEmailVerification: true,
          supportUrl: "/ajuda-e-contato",
        });
      }

      // Otherwise, account was blocked due to too many failed login attempts
      return res.status(403).json({
        success: false,
        error: "Sua conta foi bloqueada por múltiplas tentativas de login. Por favor, entre em contato com o suporte.",
        blocked: true,
        supportUrl: "/ajuda-e-contato",
      });
    }

    // Check if user is inactive (deactivated by admin)
    if (usuario.status === "inativo") {
      console.warn("[signInUsuario] ⚠️ Usuário inativo:", email);
      return res.status(403).json({
        success: false,
        error: "Sua conta foi desativada. Por favor, entre em contato com o suporte.",
        blocked: false,
      });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcryptjs.compare(senha, usuario.senha);

    if (!isPasswordValid) {
      console.warn("[signInUsuario] ❌ Senha inválida para:", email);

      // Increment failed login attempts
      const novasTentativas = usuario.tentativasLoginFalhadas + 1;
      const agora = new Date();

      // Check if last attempt was more than 24 hours ago - if so, reset counter
      const horasDesdeUltimaTentativa = usuario.ultimaTentativaLogin
        ? (agora.getTime() - usuario.ultimaTentativaLogin.getTime()) / (1000 * 60 * 60)
        : 0;

      let tentativasParaBloquear = novasTentativas;

      // Reset counter if last attempt was more than 24 hours ago
      if (horasDesdeUltimaTentativa > 24) {
        tentativasParaBloquear = 1;
      }

      // Update user with failed attempt
      let statusAtualizado = usuario.status;
      if (tentativasParaBloquear >= 5) {
        statusAtualizado = "bloqueado";
        console.warn("[signInUsuario] ⛔ Usuário bloqueado após 5 tentativas:", email);
      }

      await prisma.usracessos.update({
        where: { id: usuario.id },
        data: {
          tentativasLoginFalhadas: tentativasParaBloquear >= 5 ? 0 : tentativasParaBloquear,
          ultimaTentativaLogin: agora,
          status: statusAtualizado,
        },
      });

      // If user just got blocked, return specific error
      if (statusAtualizado === "bloqueado") {
        return res.status(403).json({
          success: false,
          error: "Sua conta foi bloqueada após múltiplas tentativas de login incorretas. Por favor, entre em contato com o suporte.",
          blocked: true,
          supportUrl: "/ajuda-e-contato",
          tentativasRestantes: 0,
        });
      }

      const tentativasRestantes = Math.max(0, 5 - tentativasParaBloquear);
      return res.status(401).json({
        success: false,
        error: `Email ou senha incorretos. ${tentativasRestantes > 0 ? `Você tem mais ${tentativasRestantes} tentativa(s) antes de sua conta ser bloqueada.` : ""}`,
        blocked: false,
        tentativasRestantes,
      });
    }

    // Login successful - reset failed attempts counter
    const { senha: _, ...usuarioSemSenha } = usuario;

    await prisma.usracessos.update({
      where: { id: usuario.id },
      data: {
        tentativasLoginFalhadas: 0,
        ultimaTentativaLogin: new Date(),
      },
    });

    console.log("[signInUsuario] ✅ Login bem-sucedido:", {
      id: usuarioSemSenha.id,
      nome: usuarioSemSenha.nome,
      email: usuarioSemSenha.email,
      tipo: usuarioSemSenha.tipoUsuario,
      hora: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      data: usuarioSemSenha,
      message: "Login realizado com sucesso",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("[signInUsuario] 🔴 ERRO COMPLETO:");
    console.error("   Mensagem:", errorMessage);
    console.error("   Stack:", errorStack);
    console.error("   Objeto erro:", error);

    res.status(500).json({
      success: false,
      error: errorMessage || "Erro desconhecido ao fazer login",
    });
  }
};

// SIGNUP - Create new user with basic info
export const signUpUsuario: RequestHandler = async (req, res) => {
  try {
    console.log("[signUpUsuario] 📝 Iniciando cadastro com dados:", {
      nome: req.body.nome,
      email: req.body.email,
      senhaLength: req.body.senha?.length,
    });

    const validatedData = UsuarioSignUpSchema.parse(req.body);
    console.log("[signUpUsuario] ✅ Validação de dados bem-sucedida");

    // Check if user already exists by email
    const existingUser = await prisma.usracessos.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      console.warn("[signUpUsuario] ⚠️ Email já cadastrado:", validatedData.email);
      return res.status(400).json({
        success: false,
        error: `O email ${validatedData.email} já está cadastrado. Por favor, use outro email ou faça login se já possui uma conta.`,
        details: [
          {
            field: "email",
            message: `Este email já está registrado. Faça login ou use outro email.`
          }
        ]
      });
    }

    // Hash password with bcrypt
    const senhaHash = await bcryptjs.hash(validatedData.senha, 10);

    // Calculate contract expiration date (30 days from now)
    const contractExpireDate = new Date();
    contractExpireDate.setDate(contractExpireDate.getDate() + 30);

    console.log("[signUpUsuario] 📊 Tentando criar usuário com dados:", {
      nome: validatedData.nome,
      email: validatedData.email,
      senhaHash: senhaHash.substring(0, 20) + "...",
    });

    const usuario = await prisma.usracessos.create({
      data: {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: senhaHash,
        status: "bloqueado", // New users start as blocked until email is verified
      },
    });

    console.log("[signUpUsuario] ✅ Usuário criado com sucesso:", {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      status: "bloqueado",
    });

    // Generate email verification token (10 minutes expiration)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10);

    // Save verification token to database
    await prisma.emailVerificationToken.create({
      data: {
        usuarioId: usuario.id,
        token: verificationToken,
        expiresAt: expirationDate,
      },
    });
    console.log("[signUpUsuario] 📝 Token de verificação salvo no banco de dados (expiração: 10 minutos)");

    // Build verification link
    const appUrl = process.env.APP_URL || "https://www.vitrii.com.br";
    const verificationLink = `${appUrl}/verificar-email?token=${verificationToken}&email=${encodeURIComponent(usuario.email)}`;

    // Send verification email
    console.log("[signUpUsuario] 📧 Link de verificação gerado:", {
      appUrl,
      linkPreview: verificationLink.substring(0, 80) + "...",
    });

    console.log("[signUpUsuario] 📧 Tentando enviar email de verificação...");
    console.log("[signUpUsuario] SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + "***" : "NOT SET",
      pass: process.env.SMTP_PASS ? "SET" : "NOT SET",
      mail_from: process.env.MAIL_FROM,
    });

    const emailSent = await sendEmailVerificationEmail(usuario.email, usuario.nome, verificationLink);

    if (!emailSent) {
      console.error(`[signUpUsuario] ❌ FALHA CRÍTICA: Falha ao enviar email de verificação para: ${usuario.email}`);
      console.error("[signUpUsuario] ❌ Deletando usuário criado porque email falhou");

      // Delete the user since email couldn't be sent
      await prisma.usracessos.delete({
        where: { id: usuario.id },
      });

      return res.status(500).json({
        success: false,
        error: "Falha ao enviar email de verificação. Por favor, tente novamente mais tarde.",
      });
    }

    console.log(`[signUpUsuario] ✅ Email de verificação enviado com sucesso para: ${usuario.email}`);
    console.log("[signUpUsuario] 🎉 Cadastro concluído com sucesso");
    res.status(201).json({
      success: true,
      data: usuario,
      message: "Conta criada com sucesso! Por favor, verifique seu e-mail para ativar a conta.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn("[signUpUsuario] ⚠️ Erro de validação:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Por favor, verifique os dados preenchidos e tente novamente.",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";

    console.error("[signUpUsuario] 🔴 ERRO COMPLETO NO SERVIDOR:");
    console.error("Mensagem:", errorMessage);
    console.error("Stack trace:", errorStack);
    console.error("Objeto erro:", error);

    res.status(500).json({
      success: false,
      error: `Erro ao criar conta: ${errorMessage}`,
    });
  }
};

// CREATE new user with full info (for profile update later)
export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const validatedData = UsuarioCreateSchema.parse(req.body);

    // Check if user already exists by email
    const existingUser = await prisma.usracessos.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado",
      });
    }

    // Hash password with bcrypt (same as signup)
    const senhaHash = await bcryptjs.hash(validatedData.senha, 10);

    // Normalize CPF/CNPJ to digits-only format
    let normalizedCpf = "";
    if (validatedData.cpf && validatedData.cpf.trim()) {
      normalizedCpf = validatedData.cpf.replace(/\D/g, "");
    }

    // Check if CPF is already in use by another user
    if (normalizedCpf) {
      const existingCpf = await prisma.usracessos.findFirst({
        where: { cpf: normalizedCpf },
      });

      if (existingCpf) {
        return res.status(400).json({
          success: false,
          error: "CPF/CNPJ já cadastrado para outro usuário",
        });
      }
    }

    // Calculate contract expiration date (30 days from now)
    const contractExpireDate = new Date();
    contractExpireDate.setDate(contractExpireDate.getDate() + 30);

    const usuario = await prisma.usracessos.create({
      data: {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: senhaHash,
        cpf: normalizedCpf,
        telefone: validatedData.telefone || "",
        endereco: validatedData.endereco || "",
        tipoUsuario: "comum",
        tassinatura: "Gratuito", // Always start as Gratuito
        status: "bloqueado", // New users start as blocked until email is verified
        emailVerificado: false,
        dataAtualizacao: new Date(),
        dataVigenciaContrato: contractExpireDate,
        numeroAnunciosAtivos: 0,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        endereco: true,
        tipoUsuario: true,
        tassinatura: true,
        dataCriacao: true,
      },
    });

    res.status(201).json({
      success: true,
      data: usuario,
      message: "Usuário criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar usuário",
    });
  }
};

// Schema for updating user (whitelist safe fields)
// NOTE: Email cannot be edited through this endpoint - it's the primary key
// Email can only be changed by an admin through a separate admin endpoint
const UsuarioUpdateSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF \ CNPJ é obrigatório")
    .refine((value) => {
      const digitsOnly = value.replace(/\D/g, "");
      // Accept either 11 digits (CPF) or 14 digits (CNPJ)
      return /^\d{11}$|^\d{14}$/.test(digitsOnly);
    }, "CPF \ CNPJ deve ter 11 ou 14 dígitos"),
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255)
    .optional(),
  telefone: z
    .union([
      z.literal(""),
      z.string().refine(
        (value) => value.replace(/\D/g, "").length >= 10,
        "Telefone deve ter no mínimo 10 dígitos"
      ),
    ])
    .optional(),
  whatsapp: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  endereco: z.string().optional(),
  localidadePadraoId: z.number().int().positive().optional().nullable(),
});

// Admin schema for updating user profile (includes all fields)
const UsuarioAdminUpdateSchema = z.object({
  nome: z
    .string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255)
    .optional(),
  email: z.string().email("Email inválido").optional(),
  cpf: z
    .string()
    .refine((value) => {
      if (!value) return true; // Allow empty
      const digitsOnly = value.replace(/\D/g, "");
      return /^\d{11}$|^\d{14}$/.test(digitsOnly);
    }, "CPF \ CNPJ deve ter 11 ou 14 dígitos")
    .optional()
    .or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  linkedin: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  endereco: z.string().optional().or(z.literal("")),
  tipoUsuario: z.enum(["adm", "comum"]).optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  tassinatura: z.enum(["Gratuito", "Padrao", "Premium", "Master"]).optional(),
  dataVigenciaContrato: z
    .string()
    .refine((value) => {
      if (!value) return true; // Allow empty
      // Accept both date (YYYY-MM-DD) and datetime (ISO 8601) formats
      return /^\d{4}-\d{2}-\d{2}(T|$)/.test(value);
    }, "Data de vigência deve estar no formato YYYY-MM-DD ou ISO 8601")
    .optional(),
  maxAnunciosAtivos: z
    .number()
    .int()
    .min(1, "Limite deve ser pelo menos 1")
    .max(1000, "Limite não pode exceder 1000")
    .optional(),
});

// UPDATE user (only safe fields allowed)
export const updateUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input - only allow safe fields
    const validatedData = UsuarioUpdateSchema.parse(req.body);

    const userId = parseInt(id);

    // Normalize CPF/CNPJ to digits-only format
    if (validatedData.cpf && validatedData.cpf.trim()) {
      validatedData.cpf = validatedData.cpf.replace(/\D/g, "");
    }

    // Check if CPF already exists for a different user
    if (validatedData.cpf && validatedData.cpf.trim()) {
      const existingCpf = await prisma.usracessos.findFirst({
        where: {
          cpf: validatedData.cpf,
          id: { not: userId }, // Exclude current user
        },
      });

      if (existingCpf) {
        return res.status(400).json({
          success: false,
          error: "Dados inválidos",
          details: [
            {
              path: ["cpf"],
              message: "CPF \ CNPJ já cadastrado",
            },
          ],
        });
      }
    }

    const usuario = await prisma.usracessos.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        whatsapp: true,
        linkedin: true,
        facebook: true,
        endereco: true,
        localidadePadraoId: true,
        tipoUsuario: true,
        tassinatura: true,
        status: true,
        dataCriacao: true,
        dataAtualizacao: true,
        numeroAnunciosAtivos: true,
        maxAnunciosAtivos: true,
        dataVigenciaContrato: true,
      },
    });

    res.json({
      success: true,
      data: usuario,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar usuário",
    });
  }
};

// VALIDATE user status - Check if user is active
// This endpoint is called by the frontend to validate user access
export const validateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usracessos.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        status: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
        isActive: false,
      });
    }

    if (usuario.status !== "ativo") {
      return res.status(403).json({
        success: false,
        error: "Sua conta foi desativada. Por favor, entre em contato com o suporte.",
        isActive: false,
      });
    }

    res.json({
      success: true,
      isActive: true,
      message: "Usuário ativo",
    });
  } catch (error) {
    console.error("Error validating user status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao validar usuário",
      isActive: false,
    });
  }
};

// DELETE user (soft delete - change status to inativo)
export const deleteUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete: change status to inativo instead of actually deleting
    const usuario = await prisma.usracessos.update({
      where: { id: parseInt(id) },
      data: { status: "inativo" },
      select: {
        id: true,
        email: true,
        status: true,
      },
    });

    console.log(`[deleteUsuario] User ${id} (${usuario.email}) marked as inactive`);

    res.json({
      success: true,
      message: "Usuário deletado com sucesso",
      data: usuario,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar usuário",
    });
  }
};

// UPDATE max ads limit for a user (Admin only)
export const updateMaxAnunciosAtivos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxAnunciosAtivos } = req.body;

    // Validate input
    if (maxAnunciosAtivos === undefined || maxAnunciosAtivos === null) {
      return res.status(400).json({
        success: false,
        error: "maxAnunciosAtivos é obrigatório",
      });
    }

    // Validate value
    if (!Number.isInteger(maxAnunciosAtivos) || maxAnunciosAtivos < 1 || maxAnunciosAtivos > 1000) {
      return res.status(400).json({
        success: false,
        error: "maxAnunciosAtivos deve ser um número inteiro entre 1 e 1000",
      });
    }

    const userId = parseInt(id);

    // Update only maxAnunciosAtivos field
    const usuario = await prisma.usracessos.update({
      where: { id: userId },
      data: {
        maxAnunciosAtivos,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        numeroAnunciosAtivos: true,
        maxAnunciosAtivos: true,
        tipoUsuario: true,
      },
    });

    res.json({
      success: true,
      data: usuario,
      message: `Limite de anúncios atualizado para ${maxAnunciosAtivos}`,
    });
  } catch (error) {
    console.error("Error updating max ads limit:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar limite de anúncios",
    });
  }
};

// FORGOT PASSWORD - Request password reset
export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email é obrigatório",
      });
    }

    // Find user by email
    const usuario = await prisma.usracessos.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
      },
    });

    if (!usuario) {
      // Email not found in database
      console.log(
        `❌ Tentativa de reset de senha para email não cadastrado: ${email}`,
      );
      return res.status(200).json({
        success: true,
        emailFound: false,
        message: `Este email não está cadastrado em nossa base de dados. Verifique o email ou crie uma nova conta.`,
      });
    }

    // Check if user is blocked - don't send reset email
    if (usuario.status === "bloqueado") {
      console.warn(`[forgotPassword] ⛔ Tentativa de reset para usuário bloqueado: ${email}`);
      // Return success message to not leak information about blocked accounts
      return res.status(200).json({
        success: true,
        emailFound: true,
        message: `Se este email estiver registrado em nossa plataforma, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e pasta de spam.`,
      });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set token expiration to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store the token in the database
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Build the reset link with token and email as query parameters
    const appUrl = process.env.APP_URL || "https://www.vitrii.com.br";
    const resetLink = `${appUrl}/reset-senha?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log("[forgotPassword] 📧 Gerando link de reset de senha:", {
      appUrl,
      email,
      linkPreview: resetLink.substring(0, 80) + "...",
      hasAppUrl: !!process.env.APP_URL,
      env: process.env.NODE_ENV,
    });

    // Send the password reset email
    const emailSent = await sendPasswordResetEmail(
      usuario.email,
      resetLink,
      usuario.nome,
    );

    if (!emailSent) {
      console.error(
        `❌ Falha ao enviar email de reset de senha para: ${usuario.email}`,
      );
      return res.status(500).json({
        success: false,
        error: "Erro ao enviar email. Tente novamente mais tarde.",
      });
    }

    console.log(
      `✅ Email de reset de senha enviado com sucesso para: ${usuario.email}`,
    );

    res.status(200).json({
      success: true,
      emailFound: true,
      message:
        "Email para redefinição de senha enviado com sucesso! Verifique seu email.",
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao processar solicitação",
    });
  }
};

// RESET PASSWORD - Verify token and update password
export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { token, email, novaSenha, confirmarSenha } = req.body;

    if (!token || !email || !novaSenha || !confirmarSenha) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos são obrigatórios",
      });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({
        success: false,
        error: "As senhas não conferem",
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Senha deve ter no mínimo 6 caracteres",
      });
    }

    // Find user by email
    const usuario = await prisma.usracessos.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Validate the reset token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetTokenRecord) {
      console.error(`❌ Token de reset inválido ou expirado`);
      return res.status(400).json({
        success: false,
        error: "Link de reset expirado ou inválido. Solicite um novo link.",
      });
    }

    // Check if token is expired
    if (new Date() > resetTokenRecord.expiresAt) {
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetTokenRecord.id },
      });

      console.error(`❌ Token de reset expirado`);
      return res.status(400).json({
        success: false,
        error: "Link de reset expirou. Solicite um novo link.",
      });
    }

    // Verify token belongs to the user
    if (resetTokenRecord.usuarioId !== usuario.id) {
      console.error(`❌ Token de reset não corresponde ao usuário`);
      return res.status(400).json({
        success: false,
        error: "Link de reset inválido.",
      });
    }

    // Hash new password
    const senhaHash = await bcryptjs.hash(novaSenha, 10);

    // Update user password and delete the token
    await prisma.usracessos.update({
      where: { id: usuario.id },
      data: { senha: senhaHash },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { id: resetTokenRecord.id },
    });

    console.log(`✅ Senha redefinida com sucesso para: ${email}`);

    res.status(200).json({
      success: true,
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao redefinir senha",
    });
  }
};

// VALIDATE RESET TOKEN - Check if token is valid
export const validateResetToken: RequestHandler = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: "Token e email são obrigatórios",
      });
    }

    // Find user by email
    const usuario = await prisma.usracessos.findUnique({
      where: { email: email as string },
      select: { id: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Find the reset token
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: token as string },
    });

    if (!resetTokenRecord) {
      return res.status(400).json({
        success: false,
        error: "Link de reset expirado ou inválido",
      });
    }

    // Check if token is expired
    if (new Date() > resetTokenRecord.expiresAt) {
      // Delete the expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetTokenRecord.id },
      });

      return res.status(400).json({
        success: false,
        error: "Link de reset expirou. Solicite um novo link.",
      });
    }

    // Verify token belongs to the user
    if (resetTokenRecord.usuarioId !== usuario.id) {
      return res.status(400).json({
        success: false,
        error: "Link de reset inválido",
      });
    }

    res.status(200).json({
      success: true,
      message: "Token válido",
    });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao validar token",
    });
  }
};

// VERIFY EMAIL - Confirm email verification token
export const verifyEmail: RequestHandler = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        error: "Token e email são obrigatórios",
      });
    }

    // Find the verification token
    const verificationTokenRecord = await prisma.emailVerificationToken.findUnique({
      where: { token: token as string },
      include: { usuario: true },
    });

    if (!verificationTokenRecord) {
      return res.status(400).json({
        success: false,
        error: "Token de verificação inválido ou expirado",
      });
    }

    // Check if token is expired
    if (verificationTokenRecord.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Token de verificação expirou",
      });
    }

    // Check if email matches
    if (verificationTokenRecord.usuario.email !== email) {
      return res.status(400).json({
        success: false,
        error: "Email não corresponde ao token",
      });
    }

    console.log("[verifyEmail] ✅ Email válido, processando verificação:", email);

    // Mark email as verified and activate user account
    await prisma.usracessos.update({
      where: { id: verificationTokenRecord.usuarioId },
      data: {
        emailVerificado: true,
        status: "ativo", // Activate user after email verification
      },
    });

    console.log("[verifyEmail] ✅ Email verificado e conta ativada");

    // Delete the token after use
    await prisma.emailVerificationToken.delete({
      where: { id: verificationTokenRecord.id },
    });

    console.log("[verifyEmail] ✅ Token de verificação deletado");

    // Send welcome email now that email is verified
    console.log("[verifyEmail] 📧 Enviando email de boas-vindas...");
    await sendWelcomeEmail(verificationTokenRecord.usuario.email, verificationTokenRecord.usuario.nome);

    console.log("[verifyEmail] 🎉 Processo de verificação de email completo");
    res.status(200).json({
      success: true,
      message: "Email verificado com sucesso! Sua conta está ativada.",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar email",
    });
  }
};

// CHECK USER STATUS BY EMAIL - For polling if user verified their email
export const checkUserStatusByEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email é obrigatório",
      });
    }

    const usuario = await prisma.usracessos.findUnique({
      where: { email: email as string },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        emailVerificado: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    console.log("[checkUserStatusByEmail] Status for user:", {
      email: usuario.email,
      status: usuario.status,
      emailVerificado: usuario.emailVerificado,
    });

    res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error("Error checking user status by email:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar status do usuário",
    });
  }
};

// ADMIN: Get all users with passwords (only for ADM users)
export const getUsuariosComSenha: RequestHandler = async (req, res) => {
  try {
    // Check if user is admin (should be done via middleware in server/index.ts)
    const usuarios = await prisma.usracessos.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        whatsapp: true,
        linkedin: true,
        facebook: true,
        tipoUsuario: true,
        tassinatura: true,
        dataCriacao: true,
        dataVigenciaContrato: true,
        numeroAnunciosAtivos: true,
        endereco: true,
        senha: true, // Include hashed password for display purposes
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    res.json({
      success: true,
      data: usuarios,
      count: usuarios.length,
    });
  } catch (error) {
    console.error("Error fetching users with passwords:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar usuários",
    });
  }
};

// ADMIN: Reset user password and generate temporary password
export const adminResetUserPassword: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, novaSenha } = req.body;

    if (!usuarioId || !novaSenha) {
      return res.status(400).json({
        success: false,
        error: "ID do usuário e nova senha são obrigatórios",
      });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Senha deve ter no mínimo 6 caracteres",
      });
    }

    // Find user
    const usuario = await prisma.usracessos.findUnique({
      where: { id: parseInt(usuarioId) },
      select: { id: true, email: true, nome: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Hash new password
    const senhaHash = await bcryptjs.hash(novaSenha, 10);

    // Update user password
    await prisma.usracessos.update({
      where: { id: usuario.id },
      data: { senha: senhaHash },
    });

    res.status(200).json({
      success: true,
      message: `Senha do usuário ${usuario.nome} resetada com sucesso`,
      data: {
        usuarioId: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
      },
    });
  } catch (error) {
    console.error("Error resetting user password:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao resetar senha do usuário",
    });
  }
};

// ADMIN: Update user profile with all fields
export const adminUpdateUserProfile: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    const validatedData = UsuarioAdminUpdateSchema.parse(req.body);

    const userId = parseInt(id);

    // Find user
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
      select: { id: true, email: true, cpf: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if email already exists for a different user
    if (validatedData.email) {
      const existingEmail = await prisma.usracessos.findFirst({
        where: {
          email: validatedData.email,
          id: { not: userId },
        },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: "Email já cadastrado para outro usuário",
        });
      }
    }

    // Check if CPF already exists for a different user
    if (validatedData.cpf && validatedData.cpf.trim()) {
      const digitsOnly = validatedData.cpf.replace(/\D/g, "");
      const existingCpf = await prisma.usracessos.findFirst({
        where: {
          cpf: digitsOnly,
          id: { not: userId },
        },
      });

      if (existingCpf) {
        return res.status(400).json({
          success: false,
          error: "CPF \ CNPJ já cadastrado para outro usuário",
        });
      }

      validatedData.cpf = digitsOnly;
    }

    // Remove empty strings for optional fields
    const cleanedData = Object.fromEntries(
      Object.entries(validatedData).filter(
        ([_, value]) => value !== "" && value !== undefined,
      ),
    );

    // Update user profile
    const updatedUsuario = await prisma.usracessos.update({
      where: { id: userId },
      data: cleanedData,
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        whatsapp: true,
        linkedin: true,
        facebook: true,
        tipoUsuario: true,
        tassinatura: true,
        dataCriacao: true,
        dataVigenciaContrato: true,
        numeroAnunciosAtivos: true,
        endereco: true,
      },
    });

    res.json({
      success: true,
      data: updatedUsuario,
      message: "Perfil do usuário atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar perfil do usuário",
    });
  }
};

// UPDATE user's default localidade
export const updateLocalidadePadrao: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { localidadePadraoId } = req.body;

    // Validate user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // If localidadePadraoId is provided, validate it exists
    if (localidadePadraoId !== null && localidadePadraoId !== undefined) {
      const localidade = await prisma.localidades.findUnique({
        where: { id: localidadePadraoId },
      });

      if (!localidade) {
        return res.status(404).json({
          success: false,
          error: "Localidade não encontrada",
        });
      }
    }

    // Update user's default localidade
    const updatedUsuario = await prisma.usracessos.update({
      where: { id: userId },
      data: {
        localidadePadraoId: localidadePadraoId || null,
      },
      select: {
        id: true,
        nome: true,
        localidadePadraoId: true,
      },
    });

    res.json({
      success: true,
      data: updatedUsuario,
      message: "Localidade padrão atualizada com sucesso",
    });
  } catch (error) {
    console.error("Error updating user's default localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar localidade padrão",
    });
  }
};

// CHANGE user password
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { senhaAtual, senhaNova, senhaConfirm } = req.body;

    console.log("[changePassword] Iniciando alteração de senha para usuário:", userId);

    // Validate input
    if (!senhaAtual || !senhaNova || !senhaConfirm) {
      console.warn("[changePassword] ❌ Campos obrigatórios faltando");
      return res.status(400).json({
        success: false,
        error: "Todos os campos são obrigatórios",
      });
    }

    if (senhaNova !== senhaConfirm) {
      console.warn("[changePassword] ❌ Senhas não correspondem");
      return res.status(400).json({
        success: false,
        error: "As senhas não correspondem",
      });
    }

    if (senhaNova.length < 6) {
      console.warn("[changePassword] ❌ Senha muito curta");
      return res.status(400).json({
        success: false,
        error: "A nova senha deve ter no mínimo 6 caracteres",
      });
    }

    // Find user
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      console.warn("[changePassword] ❌ Usuário não encontrado:", userId);
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Verify current password
    const senhaValida = await bcryptjs.compare(senhaAtual, usuario.senha);

    if (!senhaValida) {
      console.warn("[changePassword] ❌ Senha atual incorreta para usuário:", userId);
      return res.status(401).json({
        success: false,
        error: "Senha atual incorreta",
      });
    }

    // Hash new password
    const novoHash = await bcryptjs.hash(senhaNova, 10);

    // Update password
    await prisma.usracessos.update({
      where: { id: userId },
      data: {
        senha: novoHash,
      },
    });

    console.log("[changePassword] ✅ Senha alterada com sucesso para usuário:", userId);

    res.json({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("[changePassword] 🔴 Erro:", error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      error: "Erro ao alterar senha",
    });
  }
};

// TOGGLE user status (Admin only) - Activate or deactivate a user
export const toggleUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status || !["ativo", "inativo", "bloqueado"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status deve ser "ativo", "inativo" ou "bloqueado"',
      });
    }

    const usuario = await prisma.usracessos.update({
      where: { id: parseInt(id) },
      data: {
        status,
        // Reset login attempts when unblocking
        ...(status === "ativo" && { tentativasLoginFalhadas: 0 })
      },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        tentativasLoginFalhadas: true,
      },
    });

    console.log(
      `[toggleUserStatus] User ${id} (${usuario.email}) status changed to: ${status}`,
    );

    res.json({
      success: true,
      message: `Usuário ${
        status === "ativo" ? "ativado" :
        status === "inativo" ? "desativado" :
        "bloqueado"
      } com sucesso`,
      data: usuario,
    });
  } catch (error) {
    console.error("[toggleUserStatus] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar status do usuário",
    });
  }
};

// UNLOCK blocked user (Admin only) - Reset login attempts and unblock
export const unlockUserAccount: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usracessos.update({
      where: { id: parseInt(id) },
      data: {
        status: "ativo",
        tentativasLoginFalhadas: 0,
        ultimaTentativaLogin: null,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
        tentativasLoginFalhadas: true,
      },
    });

    console.log(
      `[unlockUserAccount] User ${id} (${usuario.email}) account unlocked and attempts reset`,
    );

    res.json({
      success: true,
      message: "Conta de usuário desbloqueada com sucesso",
      data: usuario,
    });
  } catch (error) {
    console.error("[unlockUserAccount] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao desbloquear conta do usuário",
    });
  }
};

// RESEND verification email (Rate limited to 1 request per 30 seconds)
export const resendVerificationEmail: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email é obrigatório",
      });
    }

    console.log("[resendVerificationEmail] 📧 Tentando reenviar email para:", email);

    // Find user by email
    const usuario = await prisma.usracessos.findUnique({
      where: { email },
    });

    if (!usuario) {
      // Don't reveal if user exists (security)
      return res.status(200).json({
        success: true,
        message: "Se este email estiver registrado, você receberá um email de verificação.",
      });
    }

    // Check if user is already verified
    if (usuario.emailVerificado) {
      return res.status(400).json({
        success: false,
        error: "Este usuário já foi verificado.",
      });
    }

    // Check rate limiting (60 second cooldown between requests)
    const agora = new Date();
    if (usuario.ultimoEmailValidacao) {
      const segundosDesdeUltimo = (agora.getTime() - usuario.ultimoEmailValidacao.getTime()) / 1000;
      if (segundosDesdeUltimo < 60) {
        const segundosRestantes = Math.ceil(60 - segundosDesdeUltimo);
        console.warn("[resendVerificationEmail] ⏱️ Rate limit atingido para:", email, `- ${segundosRestantes}s restantes`);
        return res.status(429).json({
          success: false,
          error: `Aguarde ${segundosRestantes} segundo(s) antes de solicitar um novo email.`,
          cooldownSeconds: segundosRestantes,
        });
      }
    }

    // Delete old verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { usuarioId: usuario.id },
    });

    // Generate new verification token (10 minutes expiration)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + 10); // 10 minutes

    // Save new verification token
    await prisma.emailVerificationToken.create({
      data: {
        usuarioId: usuario.id,
        token: verificationToken,
        expiresAt: expirationDate,
      },
    });

    console.log("[resendVerificationEmail] 📝 Novo token salvo com expiração de 10 minutos");

    // Build verification link
    const appUrl = process.env.APP_URL || "https://www.vitrii.com.br";
    const verificationLink = `${appUrl}/verificar-email?token=${verificationToken}&email=${encodeURIComponent(usuario.email)}`;

    console.log("[resendVerificationEmail] 📧 Tentando enviar novo email de verificação...");

    // Send verification email
    const emailSent = await sendEmailVerificationEmail(usuario.email, usuario.nome, verificationLink);

    if (!emailSent) {
      console.error("[resendVerificationEmail] ❌ Falha ao enviar email de verificação");
      return res.status(500).json({
        success: false,
        error: "Falha ao enviar email de verificação. Por favor, tente novamente mais tarde.",
      });
    }

    // Update last email sent timestamp
    await prisma.usracessos.update({
      where: { id: usuario.id },
      data: {
        ultimoEmailValidacao: agora,
      },
    });

    console.log(`[resendVerificationEmail] ✅ Email de verificação reenviado com sucesso para: ${usuario.email}`);

    res.json({
      success: true,
      message: "Email de verificação reenviado com sucesso. Por favor, verifique sua caixa de entrada ou pasta de spam.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[resendVerificationEmail] 🔴 ERRO:", errorMessage);
    res.status(500).json({
      success: false,
      error: "Erro ao reenviar email de verificação",
    });
  }
};
