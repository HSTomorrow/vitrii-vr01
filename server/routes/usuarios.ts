import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const UsuarioCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos"),
  telefone: z.string().min(10, "Telefone inválido"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
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

// CREATE new user
export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const validatedData = UsuarioCreateSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.usuario.findFirst({
      where: {
        OR: [{ email: validatedData.email }, { cpf: validatedData.cpf }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Email ou CPF já cadastrado",
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
