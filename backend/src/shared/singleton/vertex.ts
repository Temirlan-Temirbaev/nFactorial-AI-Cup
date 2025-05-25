import { VertexAI } from "@google-cloud/vertexai";

export const vertexAI = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID,
    location: "us-central1"
  });

export const generativeModel = vertexAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-05-20"
  });