import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/lib/api';
import type { BookCreateDto, BookChapters } from '@/lib/api';
import type { Book } from '@/entities';
import { classKeys } from './useClasses';

// Query keys
export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
  chapters: (id: string) => [...bookKeys.detail(id), 'chapters'] as const,
} as const;

// Book hooks
export const useUploadBook = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, data }: { file: File; data: BookCreateDto }) => 
      bookApi.uploadBook(file, data),
    onSuccess: (data: Book) => {
      // Invalidate class details to refetch books list
      queryClient.invalidateQueries({ 
        queryKey: classKeys.detail(data.classId) 
      });
      
      // Set book data in cache
      queryClient.setQueryData(bookKeys.detail(data.id), data);
    },
    onError: (error) => {
      console.error('Upload book failed:', error);
    },
  });
};

export const useBook = (bookId: string, enabled = true) => {
  return useQuery({
    queryKey: bookKeys.detail(bookId),
    queryFn: () => bookApi.getBook(bookId),
    enabled: enabled && !!bookId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useBookChapters = (bookId: string, enabled = true) => {
  return useQuery({
    queryKey: bookKeys.chapters(bookId),
    queryFn: () => bookApi.getBookChapters(bookId),
    enabled: enabled && !!bookId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}; 