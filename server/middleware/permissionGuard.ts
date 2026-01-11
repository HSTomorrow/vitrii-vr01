import { RequestHandler } from "express";
import prisma from "../lib/prisma";

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
      const usuario = await prisma.usracessoss.findUnique({
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
      const userFuncionalidades = await prisma.usracessosXFuncionalidade.findMany({
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
 * Middleware to extract user ID from request
 * This should be used before permission guard middleware
 * Gets userId from multiple sources (params, query, body, headers)
 */
export const extractUserId: RequestHandler = (req, res, next) => {
  try {
    // Try to get userId from (in order of priority):
    // 1. Headers (x-user-id) - for authenticated API requests
    // 2. URL parameter usuarioId (for nested routes like /api/usuarios/:usuarioId/...)
    // Note: We avoid using generic :id param to prevent confusion between resource ID and user ID
    // 3. Query parameter (?userId=123)
    // 4. Request body ({userId: 123} or {usuarioId: 123})

    const userIdSource =
      req.headers["x-user-id"] ||
      req.params?.usuarioId ||
      req.query?.userId ||
      req.body?.usuarioId ||
      req.body?.userId;

    if (userIdSource) {
      const parsedId = parseInt(userIdSource as string, 10);
      if (!isNaN(parsedId)) {
        req.userId = parsedId;
        console.log(`[extractUserId] Successfully extracted user ID: ${parsedId}`);
      } else {
        console.warn(`[extractUserId] Invalid user ID format: ${userIdSource}`);
      }
    } else {
      console.log("[extractUserId] No user ID found in request");
    }

    next();
  } catch (error) {
    console.error("Error extracting user ID:", error);
    res.status(400).json({
      success: false,
      error: "Erro ao processar ID do usuário",
    });
  }
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
