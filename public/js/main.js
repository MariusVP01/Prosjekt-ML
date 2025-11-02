const analyzeBtn = document.getElementById("analyzeBtn");
const reviewText = document.getElementById("reviewText");
const resultBox = document.getElementById("resultBox");

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

    resultBox.innerText =
      `🎬 Sentiment: ${data.sentiment}\n` +
      `Positiv sannsynlighet: ${(data.prob_positive * 100).toFixed(1)} %\n` +
      `Negativ sannsynlighet: ${(data.prob_negative * 100).toFixed(1)} %`;
  } catch (err) {
    console.error(err);
    resultBox.innerText = "Kunne ikke kontakte serveren 😭";
  }
});
