// Export API clients
export { apiClient, apiClientFormData } from './client';

// Export all API services
export { authApi } from './auth';
export { classApi } from './classes';
export { bookApi } from './books';
export { chapterApi } from './chapters';
export { testApi } from './tests';

// Export types
export type {
  LoginDto,
  RegisterDto,
  AuthUser,
  AuthResponse,
} from './auth';

export type {
  CreateClassDto,
  JoinClassDto,
  ClassInfo,
  ClassDetails,
} from './classes';

export type {
  CreateBookDto as BookCreateDto,
  BookChapters,
} from './books';

export type {
  ChapterSummary,
  ChapterPodcast,
  ChapterPresentation,
} from './chapters';

export type {
  CreateTestDto,
  TestOption,
  TestQuestion,
  GeneratedTest,
} from './tests'; 