"use server";

import { db } from "@/lib/prisma";
import { generateContent } from "@/actions/chatbot";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

// Define the form validation schema
const roadmapInputSchema = z.object({
  domain: z.string().min(1, "Domain is required."),
  subdomain: z.string().min(1, "Subdomain is required."),
  hoursPerDay: z.number().int().min(1).max(24),
  duration: z.string().min(1, "Duration is required."),
  goal: z.string().min(1, "Goal is required."),
  schedulePattern: z.string().min(1, "Schedule pattern is required."),
  existingKnowledge: z.string().min(1, "Existing knowledge is required."),
  motivation: z.string().min(1, "Motivation is required."),
  exercisesCount: z.number().int().min(0),
  extras: z.string().optional(),
});

function stripMarkdownCodeBlock(markdownString) {
  const regex = /```json\n([\s\S]*?)\n```/;
  const match = markdownString.match(regex);
  return match ? match[1].trim() : markdownString.trim();
}

// Helper function to build the AI prompt
const buildPrompt = (inputs) => {
  return `
    You are an expert career coach and roadmap generator. Create a personalized, comprehensive, and actionable career roadmap based on the following user inputs.

    User Profile:
    - **Goal:** ${inputs.goal}
    - **Motivation:** ${inputs.motivation}
    - **Existing Knowledge:** ${inputs.existingKnowledge}
    - **Learning Plan:** ${inputs.hoursPerDay} hours per day for ${inputs.duration}, following a ${inputs.schedulePattern} schedule.
    - **Domain:** ${inputs.domain}
    - **Subdomain:** ${inputs.subdomain}
    - **Exercises:** Include ${inputs.exercisesCount} practical exercises.
    - **Additional Notes:** ${inputs.extras || "None"}

    **Task:** Generate a structured JSON object for the roadmap.
    - The JSON should contain a "title" and an array of "milestones".
    - Each milestone object must have a "title", "description", and a "tasks" array.
    - Each task object must have a "title", "description", and a "type" (e.g., "learning", "project", "assessment").
    - The response should be a single JSON object without any additional text or markdown.
    
    Example JSON Format:
    {
      "title": "Roadmap to become a Data Scientist in 4 weeks",
      "milestones": [
        {
          "title": "Phase 1: Foundations",
          "description": "Learn the core skills for your domain.",
          "tasks": [
            {
              "title": "Master Python for Data",
              "description": "Cover topics like Pandas, NumPy, and Matplotlib.",
              "type": "learning"
            }
          ]
        }
      ]
    }
  `;
};

// Server Action to generate and save a new roadmap
export async function generateRoadmapAction(formData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error("Unauthorized");

  // Fetch the user record by Clerk ID
  const user = await db.user.findUnique({ where: { clerkUserId } });
  if (!user) throw new Error("User not found");

  const validation = roadmapInputSchema.safeParse(formData);
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const inputs = validation.data;

  try {
    // Build the AI prompt
    const prompt = buildPrompt(inputs);

    // Call the AI to generate the roadmap
    const aiRaw = await generateContent(prompt);

    // Parse the AI response into JSON
    let aiJson;
     try {
      const cleanedRaw = stripMarkdownCodeBlock(aiRaw);
      aiJson = JSON.parse(cleanedRaw);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      aiJson = { error: "Failed to parse JSON", raw: aiRaw };
    }

    // Save the new roadmap to the database
    const newRoadmap = await db.roadmap.create({
      data: {
        userId: user.id, // <-- use UUID
        domain: inputs.domain,
        subdomain: inputs.subdomain,
        inputs: inputs,
        aiRaw,
        aiJson,
        status: "COMPLETE",
      },
    });

    return newRoadmap;
  } catch (error) {
    console.error("Error generating roadmap:", error);
    throw new Error("Failed to generate roadmap");
  }
}

export async function getUserRoadmaps() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");
    
    const user = await db.user.findUnique({ where: { clerkUserId } });
    if (!user) throw new Error("User not found");
    
    const roadmaps = await db.roadmap.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        domain: true,
        subdomain: true,
        inputs: true, // Make sure this field is included
        aiJson: true,
        createdAt: true,
      }
    });

    console.log('Raw roadmaps from DB:', roadmaps); // Debug log

    return roadmaps.map(roadmap => ({
      ...roadmap,
      inputs: typeof roadmap.inputs === 'string' 
        ? JSON.parse(roadmap.inputs) 
        : roadmap.inputs,
      aiJson: typeof roadmap.aiJson === 'string' 
        ? JSON.parse(roadmap.aiJson) 
        : roadmap.aiJson,
    }));
  } catch (error) {
    console.error('Error in getUserRoadmaps:', error);
    throw error;
  }
}