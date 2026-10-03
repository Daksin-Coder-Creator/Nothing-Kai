import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: "what is newtons first law"
    });
    console.log("Success", res.text.substring(0, 50));
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
