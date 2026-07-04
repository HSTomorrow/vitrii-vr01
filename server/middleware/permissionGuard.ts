import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { verifyAuthToken } from "../lib/jwt";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userType?: string;
      userPermissions?: string[];
    }
  }
}

/**
 * Middleware to check if user has required permission(s)
 * @param requiredPermissions - Single permission or array of permissions to check
 * @param requireAll - If true, user must have ALL permissions. If false, user needs at least ONE
 */
export const checkPermission = (
  requiredPermissions: string | string[],
  requireAll = false,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      // Get userId from request (should be set by auth middleware)
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Usuário não autenticado",
        });
      }

      // Fetch user
      const usuario = await prisma.usracessos.findUnique({
        where: { id: userId },
      });

      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      // ADM users have access to everything
      if (usuario.tipoUsuario === "adm") {
        req.userType = "adm";
        return next();
      }

      // For regular users, check specific permissions
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Fetch user's funcionalidades
      const userFuncionalidades =
        await prisma.usracessosXFuncionalidade.findMany({
          where: { usuarioId: userId },
          include: { funcionalidade: true },
        });

      const userPermissionChaves = userFuncionalidades.map(
        (uf) => uf.funcionalidade.chave,
      );

      // Store permissions in request for later use
      req.userPermissions = userPermissionChaves;
      req.userType = "common";

      // Check permissions
      if (requireAll) {
        // User must have ALL required permissions
        const hasAllPermissions = permissions.every((perm) =>
          userPermissionChaves.includes(perm),
        );

        if (!hasAllPermissions) {
          return res.status(403).json({
            success: false,
            error: "Usuário não tem permissão para acessar este recurso",
          });
        }
      } else {
        // User must have AT LEAST ONE required permission
        const hasAnyPermission = permissions.some((perm) =>
          userPermissionChaves.includes(perm),
        );

        if (!hasAnyPermission) {
          return res.status(403).json({
            success: false,
            error: "Usuário não tem permissão para acessar este recurso",
          });
        }
      }

      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      res.status(500).json({
        success: false,
        error: "Erro ao verificar permissões",
      });
    }
  };
};

/**
 * Middleware to ensure user is ADM
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tipoUsuario: true,
      },
    });

    if (!usuario || usuario.tipoUsuario !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Acesso restrito a administradores",
      });
    }

    req.userType = "adm";
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar status de administrador",
    });
  }
};

/**
 * Auth middleware: verifies the signed JWT sent as `Authorization: Bearer <token>`
 * and populates req.userId/req.userType from its (server-signed) payload.
 *
 * Kept the historical name `extractUserId` (rather than renaming to e.g. `authenticate`)
 * because ~60 route registrations in server/index.ts import it by this name — previously
 * it just read an unsigned `x-user-id` header, which let any caller impersonate any user.
 * It now requires a valid token, so req.userId is trustworthy for authorization decisions.
 */
export const extractUserId: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Autenticação necessária",
    });
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      error: "Sessão inválida ou expirada",
    });
  }

  req.userId = payload.userId;
  req.userType = payload.tipoUsuario;
  next();
};

/**
 * Like extractUserId, but for routes that must also work for anonymous callers
 * (e.g. public listings, guest reservations). Populates req.userId when a valid
 * token is present; otherwise leaves it undefined and continues.
 */
export const optionalAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const payload = verifyAuthToken(token);
    if (payload) {
      req.userId = payload.userId;
      req.userType = payload.tipoUsuario;
    }
  }

  next();
};

/**
 * Utility function to check if user has permission (can be used in route handlers)
 */
export const userHasPermission = async (
  userId: number,
  permissionChave: string,
): Promise<boolean> => {
  try {
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return false;
    }

    // ADM users have all permissions
    if (usuario.tipoUsuario === "adm") {
      return true;
    }

    const permission = await prisma.usracessosXFuncionalidade.findFirst({
      where: {
        usuarioId,
        funcionalidade: { chave: permissionChave },
      },
    });

    return !!permission;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
};
