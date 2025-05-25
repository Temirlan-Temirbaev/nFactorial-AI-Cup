import type { Question } from './question';

export interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  questionId: string;
}

// Option with populated relationships
export interface OptionWithRelations extends Option {
  question?: Question;
}

// Option creation/update DTOs
export interface CreateOptionDto {
  optionText: string;
  isCorrect: boolean;
}

export interface UpdateOptionDto extends Partial<CreateOptionDto> {
  id?: string; // For updating existing options
}

// Option for displaying in tests (without revealing correct answer)
export interface PublicOption extends Omit<Option, 'isCorrect'> {}

// Option with question context for admin views
export interface OptionWithQuestion extends Option {
  question?: {
    questionText: string;
    testId: string;
  };
} 