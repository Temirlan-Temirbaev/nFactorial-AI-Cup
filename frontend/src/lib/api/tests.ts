import { apiClient } from './client';

// Test DTOs (matching backend)
export interface CreateTestDto {
  title?: string;
  description?: string;
  numberOfQuestions?: number;
}

export interface TestOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

export interface TestQuestion {
  id: string;
  questionText: string;
  options: TestOption[];
}

export interface GeneratedTest {
  id: string;
  title: string;
  description?: string;
  questions: TestQuestion[];
  createdAt: Date;
}

// Test API functions
export const testApi = {
  generateChapterTest: async (chapterId: string, data?: CreateTestDto): Promise<GeneratedTest> => {
    const response = await apiClient.post<GeneratedTest>(`/test/chapters/${chapterId}`, data || {});
    return response.data;
  },

  getChapterTest: async (chapterId: string): Promise<GeneratedTest> => {
    const response = await apiClient.get<GeneratedTest>(`/test/chapters/${chapterId}`);
    return response.data;
  },
}; 