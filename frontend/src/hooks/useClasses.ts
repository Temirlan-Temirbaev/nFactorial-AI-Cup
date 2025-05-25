import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classApi } from '@/lib/api';
import type { CreateClassDto, JoinClassDto, ClassInfo, ClassDetails } from '@/lib/api';

// Query keys
export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  myClasses: () => [...classKeys.lists(), 'my'] as const,
  details: () => [...classKeys.all, 'detail'] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
} as const;

// Class hooks
export const useCreateClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateClassDto) => classApi.createClass(data),
    onSuccess: () => {
      // Invalidate my classes list to refetch
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
    },
    onError: (error) => {
      console.error('Create class failed:', error);
    },
  });
};

export const useJoinClass = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: JoinClassDto) => classApi.joinClass(data),
    onSuccess: () => {
      // Invalidate my classes list to refetch
      queryClient.invalidateQueries({ queryKey: classKeys.myClasses() });
    },
    onError: (error) => {
      console.error('Join class failed:', error);
    },
  });
};

export const useMyClasses = () => {
  return useQuery({
    queryKey: classKeys.myClasses(),
    queryFn: () => classApi.getMyClasses(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useClassDetails = (classId: string, enabled = true) => {
  return useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: () => classApi.getClassDetails(classId),
    enabled: enabled && !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}; 