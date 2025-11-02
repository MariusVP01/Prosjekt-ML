// server.js
// Node.js + Express backend som snakker med Python-modell

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware for å lese JSON-body fra POST-requests
app.use(express.json());

// Serve statiske filer (style.css, script.js, etc.)
app.use(express.static(path.join(__dirname, "public")));

// GET /  -> send index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "main.html"));
});

// POST /analyze  -> send tekst til Python, få sentiment-resultat
app.post("/analyze", (req, res) => {
  const userText = req.body.text;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({
      error: "Tom tekst. Send inn en anmeldelse i 'text'.",
    });
  }

  // Start Python-prosessen
  const py = spawn("python", ["predict.py"]);

  // Send teksten som JSON til Python via stdin
  py.stdin.write(JSON.stringify({ text: userText }));
  py.stdin.end();

  // Samle output fra Python
  let dataFromPython = "";

  py.stdout.on("data", (chunk) => {
    dataFromPython += chunk.toString();
  });

  py.stderr.on("data", (err) => {
    console.error("Python error:", err.toString());
  });

  py.on("close", () => {
    try {
      // Forventer at Python returnerer JSON slik:
      // { "sentiment": "Mixed / Neutral", "prob_positive": 0.41, "prob_negative": 0.59 }
      const parsed = JSON.parse(dataFromPython);

      const sentiment = parsed.sentiment ?? "Unknown";
      const prob_positive = parsed.prob_positive ?? null;
      const prob_negative = parsed.prob_negative ?? null;

      res.json({
        sentiment,
        prob_positive,
        prob_negative,
      });
    } catch (e) {
      console.error("Failed to parse Python response:", e);
      res.status(500).json({ error: "Failed to parse Python response" });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Sentiment server kjører på http://localhost:${PORT}`);
});
