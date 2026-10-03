import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: "test",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log("Success");
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
