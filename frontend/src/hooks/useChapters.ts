import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chapterApi } from '@/lib/api';
import type { ChapterSummary, ChapterPodcast, ChapterPresentation } from '@/lib/api';
import { bookKeys } from './useBooks';

// Query keys
export const chapterKeys = {
  all: ['chapters'] as const,
  details: () => [...chapterKeys.all, 'detail'] as const,
  detail: (id: string) => [...chapterKeys.details(), id] as const,
  summary: (id: string) => [...chapterKeys.detail(id), 'summary'] as const,
  podcast: (id: string) => [...chapterKeys.detail(id), 'podcast'] as const,
  presentation: (id: string) => [...chapterKeys.detail(id), 'presentation'] as const,
} as const;

// Chapter hooks
export const useGetChapterSummary = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chapterId: string) => chapterApi.getChapterSummary(chapterId),
    onSuccess: (data: ChapterSummary, chapterId: string) => {
      // Cache the summary data
      queryClient.setQueryData(chapterKeys.summary(chapterId), data);
      
      // Also update the chapter data if we have it in any book chapters cache
      const queryCache = queryClient.getQueryCache();
      queryCache.findAll({ queryKey: bookKeys.all }).forEach((query) => {
        if (query.queryKey.includes('chapters')) {
          const bookChapters = query.state.data as any;
          if (bookChapters?.chapters) {
            const updatedChapters = bookChapters.chapters.map((chapter: any) =>
              chapter.id === chapterId ? { ...chapter, summary: data.summary } : chapter
            );
            queryClient.setQueryData(query.queryKey, {
              ...bookChapters,
              chapters: updatedChapters,
            });
          }
        }
      });
    },
    onError: (error) => {
      console.error('Get chapter summary failed:', error);
    },
  });
};

export const useGenerateChapterPodcast = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chapterId: string) => chapterApi.generateChapterPodcast(chapterId),
    onSuccess: (data: ChapterPodcast, chapterId: string) => {
      // Cache the podcast data
      queryClient.setQueryData(chapterKeys.podcast(chapterId), data);
      
      // Also update the chapter data if we have it in any book chapters cache
      const queryCache = queryClient.getQueryCache();
      queryCache.findAll({ queryKey: bookKeys.all }).forEach((query) => {
        if (query.queryKey.includes('chapters')) {
          const bookChapters = query.state.data as any;
          if (bookChapters?.chapters) {
            const updatedChapters = bookChapters.chapters.map((chapter: any) =>
              chapter.id === chapterId ? { ...chapter, podcastUrl: data.podcastUrl } : chapter
            );
            queryClient.setQueryData(query.queryKey, {
              ...bookChapters,
              chapters: updatedChapters,
            });
          }
        }
      });
    },
    onError: (error) => {
      console.error('Generate chapter podcast failed:', error);
    },
  });
};

export const useGenerateChapterPresentation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chapterId: string) => chapterApi.generateChapterPresentation(chapterId),
    onSuccess: (data: ChapterPresentation, chapterId: string) => {
      // Cache the presentation data
      queryClient.setQueryData(chapterKeys.presentation(chapterId), data);
      
      // Also update the chapter data if we have it in any book chapters cache
      const queryCache = queryClient.getQueryCache();
      queryCache.findAll({ queryKey: bookKeys.all }).forEach((query) => {
        if (query.queryKey.includes('chapters')) {
          const bookChapters = query.state.data as any;
          if (bookChapters?.chapters) {
            const updatedChapters = bookChapters.chapters.map((chapter: any) =>
              chapter.id === chapterId ? { ...chapter, presentationUrl: data.presentationUrl } : chapter
            );
            queryClient.setQueryData(query.queryKey, {
              ...bookChapters,
              chapters: updatedChapters,
            });
          }
        }
      });
    },
    onError: (error) => {
      console.error('Generate chapter presentation failed:', error);
    },
  });
}; 