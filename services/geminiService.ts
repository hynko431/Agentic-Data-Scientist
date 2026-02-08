import { GoogleGenAI } from "@google/genai";
import { MODEL_PLANNER, MODEL_CODER, MODEL_SUMMARY, SYSTEM_INSTRUCTION_PLANNER, SYSTEM_INSTRUCTION_CODER, SYSTEM_INSTRUCTION_SUMMARY, SYSTEM_INSTRUCTION_DASHBOARD } from "../constants";
import { DashboardMetrics } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePlan = async (userQuery: string, fileContext: string): Promise<string[]> => {
  try {
    const prompt = `User Query: "${userQuery}"\n\nAvailable Files: ${fileContext}\n\nCreate a plan.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_PLANNER,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PLANNER,
        temperature: 0.2, // Low temperature for deterministic planning
      }
    });

    const text = response.text || "[]";
    // Cleanup markdown if present to ensure JSON parsing works
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error generating plan:", error);
    return ["Error generating plan. Please try again."];
  }
};

export const generateCode = async (step: string, context: string): Promise<{ code: string; explanation: string }> => {
  try {
    const prompt = `Current Step: "${step}"\n\nContext/Previous Steps:\n${context}\n\nWrite the Python code to accomplish this step.`;

    const response = await ai.models.generateContent({
      model: MODEL_CODER,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CODER,
        temperature: 0.4,
      }
    });

    const text = response.text || "";
    
    // Simple extraction of code blocks
    const codeMatch = text.match(/```python([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : "# No code generated";
    const explanation = text.replace(/```python[\s\S]*?```/g, '').trim();

    return { code, explanation };
  } catch (error) {
    console.error("Error generating code:", error);
    return { code: "# Error generating code", explanation: "An error occurred while contacting the coding agent." };
  }
};

export const generateSummary = async (executionLog: string): Promise<string> => {
  try {
    const prompt = `Execution Log:\n${executionLog}\n\nProvide a final summary report.`;

    const response = await ai.models.generateContent({
      model: MODEL_SUMMARY,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_SUMMARY,
        temperature: 0.5,
      }
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error generating summary.";
  }
};

export const generateDashboardData = async (context: string): Promise<DashboardMetrics> => {
  try {
    const prompt = `Based on the following analysis context, generate the dashboard metrics JSON:\n${context}`;

    const response = await ai.models.generateContent({
      model: MODEL_SUMMARY,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_DASHBOARD,
        temperature: 0.3,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as DashboardMetrics;
  } catch (error) {
    console.error("Error generating dashboard data:", error);
    // Fallback default data
    return {
      accuracy: "N/A",
      accuracyChange: "0%",
      f1Score: "N/A",
      driftScore: "0.00",
      driftStatus: "Normal",
      avgLatency: "0ms",
      modelStatus: "System Operational",
      driftChartLabels: [],
      driftChartValues: [],
      recentBatches: []
    };
  }
};