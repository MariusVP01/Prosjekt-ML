const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());

// Session-oppsett
app.use(
  session({
    secret: "superhemmelig-ting-du-bør-endre", // bytt til noe random i prod
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 time levetid, kan justeres
    },
  })
);

// Serve statiske filer
app.use(express.static(path.join(__dirname, "public")));

// Serve forsiden
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "html", "main.html"));
});

// Hent historikk (siste 5)
app.get("/history", (req, res) => {
  if (!req.session.history) {
    return res.json([]);
  }
  res.json(req.session.history);
});

// Analyser tekst
app.post("/analyze", (req, res) => {
  const userText = req.body.text;

  if (!userText || userText.trim() === "") {
    return res.status(400).json({
      error: "Tom tekst. Send inn en anmeldelse i 'text'.",
    });
  }

  const py = spawn("python", ["predict.py"]);

  py.stdin.write(JSON.stringify({ text: userText }));
  py.stdin.end();

  let dataFromPython = "";

  py.stdout.on("data", (chunk) => {
    dataFromPython += chunk.toString();
  });

  py.stderr.on("data", (err) => {
    console.error("Python error (stderr):", err.toString());
  });

  py.on("close", () => {
    // Debug om du vil:
    // console.log("Raw output from Python:", JSON.stringify(dataFromPython));

    let cleaned = dataFromPython.trim();

    // fallback i tilfelle flere linjer
    if (cleaned.includes("\n")) {
      const lines = cleaned
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      cleaned = lines[lines.length - 1];
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse Python response:", e);
      return res.status(500).json({
        error: "Failed to parse Python response",
        raw: dataFromPython,
      });
    }

    const sentiment = parsed.sentiment ?? "Unknown";
    const prob_positive = parsed.prob_positive ?? null;
    const prob_negative = parsed.prob_negative ?? null;

    // --- Sessionhistorikk ---
    // lag objektet vi vil lagre
    const entry = {
      text: userText,
      sentiment,
      prob_positive,
      prob_negative,
      timestamp: Date.now(),
    };

    // sørg for at session.history finnes
    if (!req.session.history) {
      req.session.history = [];
    }

    // legg nyest først (unshift)
    req.session.history.unshift(entry);

    // klipp ned til maks 5
    req.session.history = req.session.history.slice(0, 5);

    // svar til frontend med resultatet for denne analysen
    res.json({
      sentiment,
      prob_positive,
      prob_negative,
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Sentiment server kjører på http://localhost:${PORT}`);
});
