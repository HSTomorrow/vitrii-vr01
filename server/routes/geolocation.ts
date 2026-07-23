import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Best-effort IP -> localidade suggestion for anonymous visitors on their first visit.
// Uses ip-api.com's free tier (no key, ~45 req/min) - this never blocks the page: any
// failure (rate limit, unresolvable IP, no match in our localidades table) just returns
// data: null and the client falls back to a plain manual picker.
export const suggestLocalidade: RequestHandler = async (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : undefined) ||
      req.socket.remoteAddress ||
      "";

    // Private/local addresses (dev, health checks) have nothing to look up.
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
      return res.json({ success: true, data: null });
    }

    const geoResponse = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,city,region`,
    );
    const geoData = await geoResponse.json();

    if (geoData.status !== "success" || !geoData.city) {
      return res.json({ success: true, data: null });
    }

    const localidade = await prisma.localidades.findFirst({
      where: {
        status: "ativo",
        municipio: { equals: geoData.city, mode: "insensitive" },
        ...(geoData.region ? { estado: { equals: geoData.region, mode: "insensitive" } } : {}),
      },
      select: { id: true, descricao: true, municipio: true, estado: true },
    });

    res.json({ success: true, data: localidade });
  } catch (error) {
    console.error("[suggestLocalidade] Error:", error);
    res.json({ success: true, data: null });
  }
};
