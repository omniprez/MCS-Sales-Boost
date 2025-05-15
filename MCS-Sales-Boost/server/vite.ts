import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import type { Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        server: server,
        port: 5174
      }
    },
    root: path.resolve(process.cwd(), "../client"),
    appType: "spa"
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // Serve static assets
  app.use(express.static(path.resolve(process.cwd(), "../client/public")));

  // Handle SPA routing - serve index.html for all non-API routes
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes and static assets
    if (url.startsWith('/api') || url.includes('.')) {
      return next();
    }

    try {
      // Read and transform index.html
      const indexHtml = fs.readFileSync(
        path.resolve(process.cwd(), "../client/index.html"),
        "utf-8"
      );
      
      const template = await vite.transformIndexHtml(url, indexHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "../client/dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve index.html for client-side routing in production
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
