import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { timingSafeEqual } from "node:crypto";

const router = Router();

// Constant-time string comparison to prevent timing-based code enumeration
function safeCompare(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    if (aBuf.length !== bBuf.length) {
      // Run a dummy comparison anyway to keep timing uniform
      timingSafeEqual(aBuf, aBuf);
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

// ── POST /api/complaints ──────────────────────────────────────────────────────

const submitSchema = z.object({
  session_id: z.string().min(1),
  message_text: z.string().min(1),
  risk_level: z.string().min(1),
  crime_category: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  result_id: z.string().optional(),
  phone_number: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

router.post("/complaints", async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid complaint data." });
    return;
  }

  const { session_id, message_text, risk_level, crime_category, city, pincode, result_id, phone_number } =
    parsed.data;

  try {
    const dbResult = await pool.query<{ id: string }>(
      `INSERT INTO complaints (session_id, message_text, risk_level, crime_category, city, pincode, result_id, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        session_id,
        message_text,
        risk_level,
        crime_category ?? null,
        city ?? null,
        pincode ?? null,
        result_id ?? null,
        phone_number ?? null,
      ],
    );
    res.status(201).json({ id: dbResult.rows[0].id });
  } catch (err) {
    req.log.error({ err }, "Failed to save complaint");
    res.status(500).json({ error: "Failed to save complaint. Please try again." });
  }
});

// ── GET /api/complaints/mine?session=<id> ────────────────────────────────────

router.get("/complaints/mine", async (req, res) => {
  const sessionId =
    typeof req.query.session === "string" ? req.query.session.trim() : "";

  if (!sessionId) {
    res.status(400).json({ error: "Session ID required." });
    return;
  }

  try {
    const dbResult = await pool.query<{
      id: string;
      risk_level: string;
      crime_category: string | null;
      city: string | null;
      pincode: string | null;
      submitted_at: string;
      message_text: string;
    }>(
      `SELECT id, risk_level, crime_category, city, pincode, submitted_at, message_text
       FROM complaints
       WHERE session_id = $1
       ORDER BY submitted_at DESC`,
      [sessionId],
    );
    res.json({ complaints: dbResult.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user complaints");
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

// ── POST /api/complaints/verify-access ───────────────────────────────────────

router.post("/complaints/verify-access", (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const expected = process.env.POLICE_ACCESS_CODE ?? "";

  if (!expected) {
    req.log.warn("POLICE_ACCESS_CODE is not configured");
    res.status(503).json({ ok: false, error: "Dashboard access is not configured." });
    return;
  }

  if (safeCompare(code, expected)) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: "Incorrect access code." });
  }
});

// ── GET /api/complaints/all ───────────────────────────────────────────────────
// Requires: Authorization: Bearer <POLICE_ACCESS_CODE>

router.get("/complaints/all", async (req, res) => {
  const authHeader =
    typeof req.headers["authorization"] === "string" ? req.headers["authorization"] : "";
  const code = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const expected = process.env.POLICE_ACCESS_CODE ?? "";

  if (!expected) {
    res.status(503).json({ error: "Dashboard access is not configured." });
    return;
  }
  if (!safeCompare(code, expected)) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    const dbResult = await pool.query<{
      id: string;
      session_id: string;
      message_text: string;
      risk_level: string;
      crime_category: string | null;
      city: string | null;
      pincode: string | null;
      phone_number: string | null;
      submitted_at: string;
    }>(
      `SELECT id, session_id, message_text, risk_level, crime_category, city, pincode, phone_number, submitted_at
       FROM complaints
       ORDER BY submitted_at DESC`,
    );
    res.json({ complaints: dbResult.rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch all complaints");
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

export default router;
