import { apiClient } from './client';

// Chapter response types
export interface ChapterSummary {
  id: string;
  title: string;
  summary: string;
  createdAt: Date;
}

export interface ChapterPodcast {
  id: string;
  title: string;
  podcastUrl: string;
  createdAt: Date;
}

export interface ChapterPresentation {
  slides: Array<{
    title: string;
    layout: string;
    item_amount: string;
    content_description: string;
  }>;
  presentationUrl: string;
}

// Chapter API functions
export const chapterApi = {
  getChapterSummary: async (chapterId: string): Promise<ChapterSummary> => {
    const response = await apiClient.post<ChapterSummary>(`/chapter/${chapterId}/summary`);
    return response.data;
  },

  generateChapterPodcast: async (chapterId: string): Promise<ChapterPodcast> => {
    const response = await apiClient.post<ChapterPodcast>(`/chapter/${chapterId}/podcast`);
    return response.data;
  },

  generateChapterPresentation: async (chapterId: string): Promise<ChapterPresentation> => {
    const response = await apiClient.post<ChapterPresentation>(`/chapter/${chapterId}/presentation`);
    return response.data;
  },
}; 