// Enums
export { UserRole } from './enums';

// User types
export type {
  User,
  UserWithRelations,
  PublicUser,
  CreateUserDto,
  UpdateUserDto
} from './user';

// Class types
export type {
  Class,
  ClassWithRelations,
  CreateClassDto,
  UpdateClassDto,
  ClassSummary
} from './class';

// Book types
export type {
  Book,
  BookWithRelations,
  CreateBookDto,
  UpdateBookDto,
  BookSummary
} from './book';

// Chapter types
export type {
  Chapter,
  ChapterWithRelations,
  CreateChapterDto,
  UpdateChapterDto,
  ChapterSummary
} from './chapter';

// Test types
export type {
  Test,
  TestWithRelations,
  CreateTestDto,
  UpdateTestDto,
  TestSummary,
  TestWithQuestions
} from './test';

// Question types
export type {
  Question,
  QuestionWithRelations,
  QuestionWithOptions,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionAnswer
} from './question';

// Option types
export type {
  Option,
  OptionWithRelations,
  CreateOptionDto,
  UpdateOptionDto,
  PublicOption,
  OptionWithQuestion
} from './option';

// Common API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
} 