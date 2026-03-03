import prisma from "./prisma";

/**
 * Recalculates the numeroAnunciosAtivos and numeroAnunciosAtivosDestaque counters
 * for a specific user based on their active ads in the database.
 *
 * This function should be called:
 * 1. On user login (to ensure counts are always accurate)
 * 2. Manually by admin from the admin menu
 * 3. After bulk operations that might affect ad status
 *
 * @param usuarioId - The user ID to recalculate counters for. If not provided, recalculates for all users.
 * @returns Object with details of the recalculation
 */
export async function recalculateAdCounters(usuarioId?: number) {
  try {
    if (usuarioId) {
      // Recalculate for a single user
      return await recalculateSingleUserCounters(usuarioId);
    } else {
      // Recalculate for all users
      return await recalculateAllUsersCounters();
    }
  } catch (error) {
    console.error("[recalculateAdCounters] Error:", error);
    throw error;
  }
}

/**
 * Recalculates counters for a single user
 */
async function recalculateSingleUserCounters(usuarioId: number) {
  console.log(`[recalculateAdCounters] Recalculating counters for user ${usuarioId}`);

  // Count total active ads (status = "ativo" or "pago")
  const totalAtivos = await prisma.anuncios.count({
    where: {
      usuarioId,
      status: {
        in: ["ativo", "pago"],
      },
    },
  });

  // Count active featured ads (status = "ativo" or "pago" AND destaque = true)
  const destaqueAtivos = await prisma.anuncios.count({
    where: {
      usuarioId,
      status: {
        in: ["ativo", "pago"],
      },
      destaque: true,
    },
  });

  console.log(
    `[recalculateAdCounters] User ${usuarioId}: ${totalAtivos} total active ads, ${destaqueAtivos} featured active ads`
  );

  // Update user counters
  const updated = await prisma.usracessos.update({
    where: { id: usuarioId },
    data: {
      numeroAnunciosAtivos: totalAtivos,
      numeroAnunciosAtivosDestaque: destaqueAtivos,
    },
    select: {
      id: true,
      nome: true,
      numeroAnunciosAtivos: true,
      numeroAnunciosAtivosDestaque: true,
    },
  });

  return {
    success: true,
    usuarioId,
    updated,
    message: `Contadores recalculados para usuário ${usuarioId}`,
  };
}

/**
 * Recalculates counters for all users
 */
async function recalculateAllUsersCounters() {
  console.log("[recalculateAdCounters] Recalculating counters for ALL users");

  // Get all users
  const allUsers = await prisma.usracessos.findMany({
    select: { id: true },
  });

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (const user of allUsers) {
    try {
      const result = await recalculateSingleUserCounters(user.id);
      results.push(result);
      successCount++;
    } catch (error) {
      console.error(`[recalculateAdCounters] Error for user ${user.id}:`, error);
      errorCount++;
      results.push({
        success: false,
        usuarioId: user.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(
    `[recalculateAdCounters] Completed: ${successCount} successful, ${errorCount} failed`
  );

  return {
    success: errorCount === 0,
    totalUsers: allUsers.length,
    successCount,
    errorCount,
    results,
    message: `Contadores recalculados para ${successCount}/${allUsers.length} usuários`,
  };
}
