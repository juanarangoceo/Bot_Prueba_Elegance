import { GoogleGenAI } from "@google/genai";
import { buildSystemPrompt } from "../../../lib/prompt.js";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Convert our message format to Gemini's format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        {
          role: "user",
          parts: [{ text: lastMessage.content }],
        },
      ],
      config: {
        systemInstruction: buildSystemPrompt(),
        thinkingConfig: {
          thinkingLevel: "low", // Low latency for chat — feels more human/instant
        },
        generationConfig: {
          temperature: 1.0, // Gemini 3 recommended default
          maxOutputTokens: 1024,
        },
      },
    });

    const text = response.text || "";

    // Split by ||| for multi-message support with delays
    const parts = text
      .split("|||")
      .map((p) => p.trim())
      .filter(Boolean);

    return Response.json({ parts });
  } catch (error) {
    console.error("Gemini API error:", error);
    return Response.json(
      { error: "Error al conectar con el asistente. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
