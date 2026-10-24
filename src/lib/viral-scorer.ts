import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the environment variable for the API key, assuming it's available.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ViralAnalysis {
  score: number;
  label: "High Viral Potential" | "Good" | "Low";
  reasons: string[];
}

export async function analyzeClip(transcript: string, duration: number): Promise<ViralAnalysis> {
  const prompt = `
    Analyze this video clip transcript and duration for viral potential on a scale of 0-100.
    Transcript: "${transcript}"
    Duration: ${duration} seconds

    Criteria (calculate based on these):
    1. First 2 seconds has a hook question or strong statement = +30
    2. Contains emotional words (e.g., failed, secret, shocked, money) = +20
    3. Under 35 seconds = +20
    4. Ends with loop or cliffhanger = +15
    5. Has numbers or story = +15

    Return ONLY a JSON object in this format:
    {
      "score": number,
      "reasons": ["Reason 1", "Reason 2", "Reason 3"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const analysis = JSON.parse(jsonStr);

    let label: "High Viral Potential" | "Good" | "Low" = "Low";
    if (analysis.score >= 80) label = "High Viral Potential";
    else if (analysis.score >= 50) label = "Good";

    return {
      score: Math.min(100, Math.max(0, analysis.score)),
      label,
      reasons: analysis.reasons.slice(0, 3),
    };
  } catch (e) {
    console.error("Scoring failed:", e);
    return {
      score: 50,
      label: "Good",
      reasons: ["General energy is good", "Transcript analysis failed", "Standard structure"],
    };
  }
}
