import { apiClient, apiClientFormData } from './client';
import type { Book } from '@/entities';

// Book DTOs (matching backend)
export interface CreateBookDto {
  title: string;
  classId: string;
}

export interface BookChapters {
  book: {
    id: string;
    title: string;
    createdAt: Date;
  };
  chapters: Array<{
    id: string;
    title: string;
    startPage: number;
    endPage: number;
  }>;
}

// Book API functions
export const bookApi = {
  uploadBook: async (file: File, data: CreateBookDto): Promise<Book> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', data.title);
    formData.append('classId', data.classId);

    const response = await apiClientFormData.post<Book>('/books/upload', formData);
    return response.data;
  },

  getBook: async (bookId: string): Promise<Book> => {
    const response = await apiClient.get<Book>(`/books/${bookId}`);
    return response.data;
  },

  getBookChapters: async (bookId: string): Promise<BookChapters> => {
    const response = await apiClient.get<BookChapters>(`/books/${bookId}/chapters`);
    return response.data;
  },
}; 