import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

const app = express();

log("Starting server initialization...");

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
log("Basic middleware configured");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  log("Created uploads directory");
}

// Serve static files from uploads directory
app.use("/uploads", express.static(uploadsDir));
log("Configured uploads directory middleware");

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});
log("Request logging middleware configured");

(async () => {
  try {
    log("Registering API routes...");
    const server = await registerRoutes(app);
    log("API routes registered successfully");

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    log("Error handling middleware configured");

    // Get port from environment variable
    const port = process.env.PORT || 3000;

    // Listen on all network interfaces
    server.listen(port, '0.0.0.0', () => {
      log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();