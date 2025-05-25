import type { Chapter } from './chapter';
import type { Question, QuestionWithOptions } from './question';

export interface Test {
  id: string;
  title: string;
  description?: string;
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Test with populated relationships
export interface TestWithRelations extends Test {
  chapter?: Chapter;
  questions?: Question[];
}

// Test creation/update DTOs
export interface CreateTestDto {
  title: string;
  description?: string;
  chapterId: string;
}

export interface UpdateTestDto extends Partial<CreateTestDto> {}

// Test with question count for summary views
export interface TestSummary extends Test {
  questionCount: number;
  chapterTitle?: string;
  bookTitle?: string;
}

// Test with full questions and options for taking the test
export interface TestWithQuestions extends Test {
  questions: QuestionWithOptions[];
  chapter?: {
    title: string;
    book?: {
      title: string;
    };
  };
} 