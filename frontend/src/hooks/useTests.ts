import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { testApi } from '@/lib/api';
import type { CreateTestDto, GeneratedTest } from '@/lib/api';

// Query keys
export const testKeys = {
  all: ['tests'] as const,
  lists: () => [...testKeys.all, 'list'] as const,
  details: () => [...testKeys.all, 'detail'] as const,
  detail: (id: string) => [...testKeys.details(), id] as const,
  byChapter: (chapterId: string) => [...testKeys.all, 'chapter', chapterId] as const,
} as const;

// Test hooks
export const useGenerateChapterTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chapterId, data }: { chapterId: string; data?: CreateTestDto }) => 
      testApi.generateChapterTest(chapterId, data),
    onSuccess: (data: GeneratedTest, variables) => {
      // Cache the generated test
      queryClient.setQueryData(testKeys.byChapter(variables.chapterId), data);
      
      // Also cache by test ID
      queryClient.setQueryData(testKeys.detail(data.id), data);
    },
    onError: (error) => {
      console.error('Generate chapter test failed:', error);
    },
  });
};

export const useChapterTest = (chapterId: string, enabled = true) => {
  return useQuery({
    queryKey: testKeys.byChapter(chapterId),
    queryFn: () => testApi.getChapterTest(chapterId),
    enabled: enabled && !!chapterId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry if test doesn't exist
  });
};

// Hook to check if a chapter has a test
export const useHasChapterTest = (chapterId: string) => {
  const { data, isLoading, error } = useChapterTest(chapterId);
  
  return {
    hasTest: !!data && !error,
    isLoading,
    test: data,
  };
}; 