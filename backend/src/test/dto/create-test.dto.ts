export class CreateTestDto {
  title?: string;
  description?: string;
  numberOfQuestions?: number = 5;
}

export interface TestQuestionDto {
  id: string;
  questionText: string;
  options: TestOptionDto[];
}

export interface TestOptionDto {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

export interface GeneratedTestDto {
  id: string;
  title: string;
  description?: string;
  questions: TestQuestionDto[];
  createdAt: Date;
} 