tickets = [
    "The install was smooth and the app feels fast.",
    "The worker crashed twice while Docker was starting.",
    "I found the payout screen but I am unsure what pending means.",
    "Great onboarding flow. The dashboard is clear.",
]

positive_words = {"smooth", "fast", "great", "clear"}
negative_words = {"crashed", "unsure", "twice"}
counts = {"positive": 0, "neutral": 0, "negative": 0}

for ticket in tickets:
    words = set(ticket.lower().replace(".", "").split())
    score = len(words & positive_words) - len(words & negative_words)
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
    counts[label] += 1
    print(f"{label}: {ticket}")

print("summary=" + ", ".join(f"{key}:{value}" for key, value in counts.items()))
