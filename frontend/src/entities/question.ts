import type { Test } from './test';
import type { Option, CreateOptionDto, UpdateOptionDto } from './option';

export interface Question {
  id: string;
  questionText: string;
  testId: string;
  createdAt: Date;
}

// Question with populated relationships
export interface QuestionWithRelations extends Question {
  test?: Test;
  options?: Option[];
}

// Question with options for displaying/taking tests
export interface QuestionWithOptions extends Question {
  options: Option[];
}

// Question creation/update DTOs
export interface CreateQuestionDto {
  questionText: string;
  testId: string;
  options: CreateOptionDto[];
}

export interface UpdateQuestionDto extends Partial<Omit<CreateQuestionDto, 'options'>> {
  options?: UpdateOptionDto[];
}

// Question answer for test submissions
export interface QuestionAnswer {
  questionId: string;
  selectedOptionId: string;
} 