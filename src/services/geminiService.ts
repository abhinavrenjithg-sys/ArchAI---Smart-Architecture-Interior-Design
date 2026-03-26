import { GoogleGenAI } from "@google/genai";
import { ArchitecturePlan, ArchitecturePlanSchema, ProjectInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateArchitecturePlan(input: ProjectInput): Promise<ArchitecturePlan> {
  const prompt = `
    Act as a world-class architect and interior designer.
    Generate a comprehensive architecture and interior design plan based on the following inputs:
    - Plot Size: ${input.plotSize} ${input.unit}
    - Location: ${input.location}
    - Budget: ${input.budget}
    - Rooms: ${input.rooms}
    - Floors: ${input.floors}
    - Style: ${input.style}
    - India-Based (Vastu): ${input.isIndiaBased ? 'Yes' : 'No'}

    The plan must include:
    1. Detailed description and style justification.
    2. Space planning with room dimensions and features.
    3. A 3D layout representation (walls and room positions) for a Three.js viewer.
    4. Detailed furniture placement for interior design (position, size, and rotation for common items like beds, sofas, tables).
    5. Interior design suggestions (colors, lighting, materials).
    6. A detailed budget breakdown (construction, materials, labor, interior).
    7. Material requirements with quantities and estimated market rates.
    8. A construction timeline with phases.
    9. Practical construction workflow and safety measures.

    For the 3D layout:
    - Walls should form a closed structure.
    - Furniture should be placed logically within the rooms.
    - Use a coordinate system where (0,0,0) is the center of the plot.
    - Units are in meters (approximate 1m = 3.28ft).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: ArchitecturePlanSchema as any,
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getChatResponse(message: string, context: ArchitecturePlan | null) {
  const prompt = `
    You are ArchAI, an expert architectural assistant. 
    ${context ? `The current project context is: ${JSON.stringify(context)}` : "No project context yet."}
    User message: ${message}
    Provide helpful, professional, and creative advice on architecture, interior design, and construction.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}
