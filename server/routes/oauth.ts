import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Schema para armazenar tokens OAuth
interface OAuthToken {
  usuarioId: number;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

/**
 * GET /api/oauth/google/authorize
 * Redireciona para Google OAuth
 */
export const googleAuthorize: RequestHandler = (req, res) => {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/api/oauth/google/callback`;
    const scope = "profile email";
    const state = Math.random().toString(36).substring(7);

    // Armazenar state na sessão (você pode usar redis ou similar)
    res.cookie("oauth_state", state, { maxAge: 300000, httpOnly: true });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;

    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error("Error in Google authorize:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao iniciar autenticação com Google",
    });
  }
};

/**
 * GET /api/oauth/google/callback
 * Callback do Google OAuth
 */
export const googleCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state } = req.query;

    // Verificar state (prevenção de CSRF)
    const storedState = req.cookies?.oauth_state;
    if (state !== storedState) {
      return res.status(400).json({
        success: false,
        error: "State mismatch. Possible CSRF attack.",
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Authorization code not provided",
      });
    }

    // Trocar código por token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
        code: code as string,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.APP_URL}/api/oauth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();

    // Buscar informações do usuário
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }

    const userInfo = await userInfoResponse.json();

    // Verificar ou criar usuário
    let usuario = await prisma.usracessos.findUnique({
      where: { email: userInfo.email },
    });

    if (!usuario) {
      // Criar novo usuário
      usuario = await prisma.usracessos.create({
        data: {
          nome: userInfo.name || userInfo.email,
          email: userInfo.email,
          senha: "", // Não há senha para OAuth
          cpf: "",
          telefone: "",
          endereco: "",
          tipoUsuario: "comum",
          dataAtualizacao: new Date(),
        },
      });
    }

    // Armazenar tokens OAuth
    // Você precisará adicionar uma tabela `oauth_tokens` para isso
    // Por enquanto, apenas retornaremos o usuário

    res.json({
      success: true,
      data: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
      },
      message: "Login via Google realizado com sucesso",
    });
  } catch (error) {
    console.error("Error in Google callback:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao processar autenticação com Google",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/oauth/google/link
 * Vincular conta existente com Google
 */
export const googleLinkAccount: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, accessToken } = req.body;

    if (!usuarioId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: "usuarioId e accessToken são obrigatórios",
      });
    }

    // Verificar se usuário existe
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Aqui você armazenaria o token OAuth associado ao usuário
    // Por enquanto, apenas retornamos sucesso

    res.json({
      success: true,
      message: "Conta vinculada com Google com sucesso",
    });
  } catch (error) {
    console.error("Error linking Google account:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao vincular conta com Google",
    });
  }
};
