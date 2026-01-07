import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import bcryptjs from "bcryptjs";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../lib/emailService";
import crypto from "crypto";

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
    .regex(/^\d{11}$/, "CPF deve ter 11 dígitos")
    .optional(),
  telefone: z.string().min(10, "Telefone inválido").optional(),
  endereco: z.string().min(1, "Endereço é obrigatório").optional(),
});

// GET all users
export const getUsuarios: RequestHandler = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cpf: true,
        telefone: true,
        tipoUsuario: true,
        dataCriacao: true,
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
    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarioLojas: {
          include: {
            loja: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
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
      return res.status(400).json({
        success: false,
        error: "Email e senha são obrigatórios",
      });
    }

    // Find user by email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        senha: true,
        tipoUsuario: true,
        cpf: true,
        telefone: true,
        endereco: true,
        dataCriacao: true,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Email ou senha incorretos",
      });
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcryptjs.compare(senha, usuario.senha);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Email ou senha incorretos",
      });
    }

    // Return user data (without password)
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.status(200).json({
      success: true,
      data: usuarioSemSenha,
      message: "Login realizado com sucesso",
    });
  } catch (error) {
    console.error("Error signing in user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer login",
    });
  }
};

// SIGNUP - Create new user with basic info
export const signUpUsuario: RequestHandler = async (req, res) => {
  try {
    const validatedData = UsuarioSignUpSchema.parse(req.body);

    // Check if user already exists by email
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado",
      });
    }

    // Hash password with bcrypt
    const senhaHash = await bcryptjs.hash(validatedData.senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome: validatedData.nome,
        email: validatedData.email,
        senha: senhaHash,
        cpf: "",
        telefone: "",
        endereco: "",
        tipoUsuario: "comum",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
        dataCriacao: true,
      },
    });

    // Send welcome email
    await sendWelcomeEmail(usuario.email, usuario.nome);

    res.status(201).json({
      success: true,
      data: usuario,
      message: "Conta criada com sucesso!",
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

    console.error("Error signing up user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar conta",
    });
  }
};

// CREATE new user with full info (for profile update later)
export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const validatedData = UsuarioCreateSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.usuario.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email já cadastrado",
      });
    }

    // In production, hash the password with bcrypt
    const usuario = await prisma.usuario.create({
      data: {
        ...validatedData,
        tipoUsuario: "comum",
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

// UPDATE user
export const updateUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: req.body,
    });

    res.json({
      success: true,
      data: usuario,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar usuário",
    });
  }
};

// DELETE user
export const deleteUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.usuario.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar usuário",
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
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    if (!usuario) {
      // Return success even if user not found (security best practice)
      return res.status(200).json({
        success: true,
        message:
          "Se este email estiver cadastrado, você receberá um link para redefinir sua senha",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        usuarioId: usuario.id,
        token,
        expiresAt,
      },
    });

    // Generate reset link
    const resetLink = `${process.env.APP_URL || "http://localhost:5173"}/reset-senha?token=${token}&email=${encodeURIComponent(usuario.email)}`;

    // Send email
    await sendPasswordResetEmail(usuario.email, resetLink, usuario.nome);

    res.status(200).json({
      success: true,
      message: "Email para redefinição de senha enviado com sucesso",
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
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: "Token inválido",
      });
    }

    if (resetToken.isUsed) {
      return res.status(400).json({
        success: false,
        error: "Este token já foi utilizado",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Este token expirou. Solicite um novo link de redefinição",
      });
    }

    if (resetToken.usuarioId !== usuario.id) {
      return res.status(400).json({
        success: false,
        error: "Token inválido para este usuário",
      });
    }

    // Hash new password
    const senhaHash = await bcryptjs.hash(novaSenha, 10);

    // Update user password and mark token as used
    await Promise.all([
      prisma.usuario.update({
        where: { id: usuario.id },
        data: { senha: senhaHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { isUsed: true },
      }),
    ]);

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
    const usuario = await prisma.usuario.findUnique({
      where: { email: email as string },
      select: { id: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Find and validate reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: token as string },
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        error: "Token inválido",
      });
    }

    if (resetToken.isUsed) {
      return res.status(400).json({
        success: false,
        error: "Este token já foi utilizado",
      });
    }

    if (resetToken.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "Este token expirou",
      });
    }

    if (resetToken.usuarioId !== usuario.id) {
      return res.status(400).json({
        success: false,
        error: "Token inválido para este usuário",
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
