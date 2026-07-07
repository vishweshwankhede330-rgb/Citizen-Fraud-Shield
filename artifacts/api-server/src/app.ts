import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the Replit proxy so express-rate-limit can read X-Forwarded-For correctly
app.set("trust proxy", 1);

// Build an allowlist of trusted origins from Replit environment variables.
// REPLIT_DOMAINS is a comma-separated list of production domains;
// REPLIT_DEV_DOMAIN is the dev preview domain.
const allowedOrigins: Set<string> = new Set(
  [
    process.env["REPLIT_DEV_DOMAIN"]
      ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
      : null,
    ...(process.env["REPLIT_DOMAINS"] ?? "")
      .split(",")
      .filter(Boolean)
      .map((d) => `https://${d.trim()}`),
  ].filter((o): o is string => o !== null),
);

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / server-to-server calls (no Origin header)
      // and any Replit-managed domain.
      if (!origin || allowedOrigins.has(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
