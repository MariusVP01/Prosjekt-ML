# predict.py
import sys
import json
import joblib

# last inn modeller
vectorizer = joblib.load("tfidf_vectorizer.joblib")
model = joblib.load("sentiment_model.joblib")

def classify_review(review_text: str):
    vec = vectorizer.transform([review_text])
    probs = model.predict_proba(vec)[0]  # [p(neg), p(pos)]
    p_neg, p_pos = probs[0], probs[1]

    if p_pos >= 0.7:
        sentiment = "Positive"
    elif p_pos <= 0.3:
        sentiment = "Negative"
    else:
        sentiment = "Mixed / Neutral"

    return {
        "sentiment": sentiment,
        "prob_positive": float(p_pos),
        "prob_negative": float(p_neg)
    }



# vi forventer at Node sender oss JSON med { "text": "..." }
raw_input = sys.stdin.read()
data = json.loads(raw_input)
text = data["text"]

result = classify_review(text)

# skriv tilbake som JSON
print(json.dumps(result))
