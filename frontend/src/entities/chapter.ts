import type { Book } from './book';
import type { Test } from './test';

export interface Chapter {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  bookId: string;
  fileUri?: string;
  summary?: string;
  podcastUrl?: string;
}

// Chapter with populated relationships
export interface ChapterWithRelations extends Chapter {
  book?: Book;
  test?: Test;
}

// Chapter creation/update DTOs
export interface CreateChapterDto {
  title: string;
  startPage: number;
  endPage: number;
  bookId: string;
  fileUri?: string;
  summary?: string;
  podcastUrl?: string;
}

export interface UpdateChapterDto extends Partial<CreateChapterDto> {}

// Chapter with test status for summary views
export interface ChapterSummary extends Chapter {
  hasTest: boolean;
  testId?: string;
  bookTitle?: string;
  pageCount: number;
} 