import { Router, type Request, type Response } from "express";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are accepted."));
    }
  },
});

router.post(
  "/transcribe",
  upload.single("audio"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No audio file provided." });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Transcription service is not configured." });
      return;
    }

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(req.file.buffer)], {
        type: req.file.mimetype || "audio/webm",
      });
      formData.append("file", blob, req.file.originalname || "recording.webm");
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData,
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        req.log.error(
          { status: groqRes.status, body: errText },
          "Groq transcription error",
        );
        res.status(500).json({ error: "Transcription failed. Please try again." });
        return;
      }

      const data = (await groqRes.json()) as { text: string };
      res.json({ transcript: data.text });
    } catch (err) {
      req.log.error({ err }, "Transcription error");
      res
        .status(500)
        .json({ error: "Unable to transcribe right now. Please try again." });
    }
  },
);

export default router;
