import { Type } from "@google/genai";

export interface ProjectInput {
  plotSize: number;
  unit: 'sqft' | 'sqm';
  location: string;
  budget: number;
  rooms: number;
  floors: number;
  style: 'modern' | 'minimalist' | 'luxury' | 'traditional' | 'eco-friendly';
  isIndiaBased: boolean;
}

export interface Room {
  name: string;
  dimensions: string;
  area: number;
  features: string[];
  furnitureSuggestions: string[];
}

export interface MaterialRequirement {
  item: string;
  quantity: string;
  unit: string;
  estimatedRate: number;
  totalCost: number;
}

export interface ConstructionPhase {
  phase: string;
  duration: string;
  tasks: string[];
  startDateOffset: number; // days from start
  durationDays: number;
}

export interface ArchitecturePlan {
  description: string;
  styleJustification: string;
  vastuCompliance?: string;
  ventilationOptimization: string;
  rooms: Room[];
  totalBuiltUpArea: number;
  threeDLayout: {
    walls: { start: [number, number]; end: [number, number]; height: number }[];
    rooms: { name: string; position: [number, number, number]; size: [number, number, number] }[];
    furniture: { type: string; position: [number, number, number]; size: [number, number, number]; rotation: number }[];
  };
  interiorDesign: {
    colorPalette: { name: string; hex: string }[];
    lightingPlan: string;
    materialRecommendations: string[];
  };
  budget: {
    construction: number;
    materials: number;
    labor: number;
    interior: number;
    total: number;
    optimizationTips: string[];
  };
  materials: MaterialRequirement[];
  timeline: ConstructionPhase[];
  workflow: string[];
  safetyMeasures: string[];
}

export const ArchitecturePlanSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    styleJustification: { type: Type.STRING },
    vastuCompliance: { type: Type.STRING },
    ventilationOptimization: { type: Type.STRING },
    totalBuiltUpArea: { type: Type.NUMBER },
    rooms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dimensions: { type: Type.STRING },
          area: { type: Type.NUMBER },
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          furnitureSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "dimensions", "area"]
      }
    },
    threeDLayout: {
      type: Type.OBJECT,
      properties: {
        walls: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 2, maxItems: 2 },
              end: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 2, maxItems: 2 },
              height: { type: Type.NUMBER }
            }
          }
        },
        rooms: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              position: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 3, maxItems: 3 },
              size: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 3, maxItems: 3 }
            }
          }
        },
        furniture: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, description: "e.g., bed, sofa, table, chair, cabinet" },
              position: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 3, maxItems: 3 },
              size: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 3, maxItems: 3 },
              rotation: { type: Type.NUMBER, description: "Y-axis rotation in radians" }
            }
          }
        }
      }
    },
    interiorDesign: {
      type: Type.OBJECT,
      properties: {
        colorPalette: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              hex: { type: Type.STRING }
            }
          }
        },
        lightingPlan: { type: Type.STRING },
        materialRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    budget: {
      type: Type.OBJECT,
      properties: {
        construction: { type: Type.NUMBER },
        materials: { type: Type.NUMBER },
        labor: { type: Type.NUMBER },
        interior: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
        optimizationTips: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    materials: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          quantity: { type: Type.STRING },
          unit: { type: Type.STRING },
          estimatedRate: { type: Type.NUMBER },
          totalCost: { type: Type.NUMBER }
        }
      }
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          duration: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          startDateOffset: { type: Type.NUMBER },
          durationDays: { type: Type.NUMBER }
        }
      }
    },
    workflow: { type: Type.ARRAY, items: { type: Type.STRING } },
    safetyMeasures: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["description", "rooms", "budget", "materials", "timeline"]
};
