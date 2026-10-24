export interface ViralAnalysis {
  score: number;
  label: "High Viral Potential" | "Good" | "Low";
  reasons: string[];
}

export async function analyzeClip(transcript: string, duration: number): Promise<ViralAnalysis> {
  const cleanTranscript = (transcript || "").trim().toLowerCase();
  const words = cleanTranscript.split(/\s+/).filter(Boolean);
  const firstWords = words.slice(0, 10).join(" ");
  const lastWords = words.slice(-8).join(" ");

  let score = 0;
  const reasons: string[] = [];

  // Rule 1: First 2 seconds has a hook question or strong statement = +30 points
  const hasQuestion = firstWords.includes("?") || /^(why|how|what|did|can|do|is|are|who|where|if|have|ever)/.test(firstWords);
  const hasHookStatement = /(secret|never|stop|this|watch|don't|look|reason|nobody|everyone|must|truth)/.test(firstWords) || cleanTranscript.includes("?");

  if (hasQuestion || hasHookStatement) {
    score += 30;
    const matchedHook = firstWords.slice(0, 35);
    reasons.push(`Hook in first 2s: "${matchedHook || "Strong statement"}"`);
  } else {
    score += 15;
    reasons.push("Clear starting statement");
  }

  // Rule 2: Emotion word (failed, secret, shocked, money, etc.) = +20 points
  const emotionRegex = /(failed|fail|failure|secret|shocked|shock|money|dollar|rich|broke|crazy|insane|wild|unbelievable|mistake|error|die|dead|love|hate|win|lost|loss|scam|danger)/i;
  const matchEmotion = cleanTranscript.match(emotionRegex);
  if (matchEmotion) {
    score += 20;
    reasons.push(`Emotion: ${matchEmotion[0].toLowerCase()}`);
  } else {
    score += 10;
    reasons.push("Engaging tone");
  }

  // Rule 3: Under 35 seconds = +20 points
  if (duration <= 35 && duration > 0) {
    score += 20;
    reasons.push(`Optimal short-form length (${Math.round(duration)}s)`);
  } else if (duration <= 45) {
    score += 10;
    reasons.push(`Good short duration (${Math.round(duration)}s)`);
  } else {
    reasons.push("Extended duration");
  }

  // Rule 4: Ends with loop or cliffhanger = +15 points
  const loopOrCliffhanger = /(because|so|next|and|until|then|find out|watch|part 2|wait|see|\?|\.\.\.)$/.test(cleanTranscript) || /(you|this|how|why)/.test(lastWords);
  if (loopOrCliffhanger) {
    score += 15;
    reasons.push("Loopable ending or cliffhanger");
  } else {
    score += 8;
    reasons.push("Smooth clip resolution");
  }

  // Rule 5: Has numbers or story = +15 points
  const hasNumbers = /\d+|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million|percent|\$/.test(cleanTranscript);
  const hasStory = /(when|then|after|suddenly|first|finally|realized|happened|told|said)/.test(cleanTranscript);

  if (hasNumbers || hasStory) {
    score += 15;
    reasons.push(hasNumbers ? "Contains numbers or data" : "Storytelling structure detected");
  } else {
    score += 7;
    reasons.push("Direct delivery");
  }

  // Cap score between 0 and 100
  const finalScore = Math.min(100, Math.max(0, score));

  let label: "High Viral Potential" | "Good" | "Low" = "Low";
  if (finalScore >= 80) {
    label = "High Viral Potential";
  } else if (finalScore >= 50) {
    label = "Good";
  }

  return {
    score: finalScore,
    label,
    reasons: reasons.slice(0, 3),
  };
}
