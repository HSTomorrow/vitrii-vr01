import serverless from "serverless-http";
import { createServer } from "../../server";

let server: any;

export const handler = async (event: any, context: any) => {
  try {
    console.log("[Netlify] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    console.log("[Netlify] NODE_ENV:", process.env.NODE_ENV);

    if (!server) {
      console.log("[Netlify Function] Initializing server...");
      server = createServer();
      console.log("[Netlify Function] Server created successfully");
    }

    const handler = serverless(server);
    const response = await handler(event, context);

    console.log("[Netlify Function] Request processed successfully");
    return response;
  } catch (error) {
    console.error("[Netlify Function] Error:", error);
    console.error("[Netlify Function] DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.message : String(error),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
