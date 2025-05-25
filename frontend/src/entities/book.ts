import type { Chapter } from './chapter';
import type { Class } from './class';
import type { User } from './user';

export interface Book {
  id: string;
  title: string;
  fileUri: string;
  classId: string;
  uploaderId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Book with populated relationships
export interface BookWithRelations extends Book {
  chaptersInfo?: Chapter[];
  class?: Class;
  uploader?: User;
}

// Book creation/update DTOs
export interface CreateBookDto {
  title: string;
  fileUri: string;
  classId: string;
  uploaderId: string;
}

export interface UpdateBookDto extends Partial<Omit<CreateBookDto, 'uploaderId'>> {
  uploaderId?: string;
}

// Book with chapter count for summary views
export interface BookSummary extends Book {
  chapterCount: number;
  className?: string;
  uploaderName?: string;
} 