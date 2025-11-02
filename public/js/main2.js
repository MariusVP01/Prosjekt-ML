const analyzeBtn = document.getElementById("analyzeBtn");
const reviewText = document.getElementById("reviewText");
const resultBox = document.getElementById("resultBox");
const historyList = document.getElementById("historyList");

// Hjelpefunksjon: render historikk-liste
function renderHistory(items) {
  historyList.innerHTML = "";

  if (!items || items.length === 0) {
    historyList.innerHTML = "<li>Ingen tidligere analyser.</li>";
    return;
  }

  for (const entry of items) {
    // lag kort tekst-utdrag
    const shortText =
      entry.text.length > 80 ? entry.text.slice(0, 80) + "..." : entry.text;

    // vis sentiment + kort utdrag
    const li = document.createElement("li");
    li.className = "history-item";
    li.innerText = `${entry.sentiment} | ${shortText}`;
    historyList.appendChild(li);
  }
}

// Hent historikk fra serveren
async function loadHistory() {
  try {
    const res = await fetch("/history");
    const data = await res.json();
    renderHistory(data);
  } catch (err) {
    console.error("Kunne ikke hente historikk", err);
  }
}

// Kjør når siden laster inn første gang
loadHistory();

// Klikk: analyser anmeldelse
analyzeBtn.addEventListener("click", async () => {
  const text = reviewText.value.trim();

  if (text === "") {
    resultBox.innerText = "⚠️ Du må lime inn en anmeldelse først.";
    return;
  }

  resultBox.innerText = "Analyserer anmeldelsen ... 🔍";

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      resultBox.innerText = "Feil: " + (errData.error || "Ukjent feil.");
      return;
    }

    const data = await response.json();

    // Oppdater resultat-boks for denne analysen
    resultBox.innerText =
      `🎬 Sentiment: ${data.sentiment}\n` +
      `Positiv sannsynlighet: ${(data.prob_positive * 100).toFixed(1)} %\n` +
      `Negativ sannsynlighet: ${(data.prob_negative * 100).toFixed(1)} %`;

    // Oppdater historikken etter at vi har analysert noe nytt
    loadHistory();
  } catch (err) {
    console.error(err);
    resultBox.innerText = "Kunne ikke kontakte serveren 😭";
  }
});
