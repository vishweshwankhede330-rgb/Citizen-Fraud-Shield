import { Router } from "express";

const router = Router();

/**
 * GET /api/pincode?code=400001
 * Proxies a Nominatim lookup for an Indian PIN code and returns { lat, lon }.
 * We proxy server-side so we can send a compliant User-Agent header that
 * browsers silently strip from client-side fetch calls.
 */
router.get("/pincode", async (req, res) => {
  const code = typeof req.query.code === "string" ? req.query.code.trim() : "";

  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "Invalid pincode: must be exactly 6 digits." });
    return;
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?postalcode=${encodeURIComponent(code)}&country=India&format=json&limit=1`;

    const nominatimRes = await fetch(url, {
      headers: {
        "User-Agent": "CitizenFraudShield/1.0 (https://citizen-fraud-shield.repl.co)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!nominatimRes.ok) {
      req.log.warn({ status: nominatimRes.status, code }, "Nominatim returned non-OK");
      res.status(502).json({ error: "Geocoding service unavailable." });
      return;
    }

    const data = (await nominatimRes.json()) as { lat: string; lon: string }[];

    if (!Array.isArray(data) || data.length === 0) {
      res.status(404).json({ error: "Pincode not found." });
      return;
    }

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.status(502).json({ error: "Geocoding returned invalid coordinates." });
      return;
    }

    res.json({ lat, lon });
  } catch (err) {
    req.log.error({ err, code }, "Pincode geocoding failed");
    res.status(502).json({ error: "Geocoding service unavailable." });
  }
});

export default router;
