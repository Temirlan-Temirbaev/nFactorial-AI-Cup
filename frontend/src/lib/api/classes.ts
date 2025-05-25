import { apiClient } from './client';

// Class DTOs (matching backend)
export interface CreateClassDto {
  name: string;
  description?: string;
}

export interface JoinClassDto {
  classCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface StudentInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  studentClass?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface ClassInfo {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacher: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  studentsCount: number;
  booksCount: number;
  createdAt: Date;
}

export interface ClassDetails {
  id: string;
  name: string;
  code: string;
  description?: string;
  teacher: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  students: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    createdAt: Date;
  }[];
  books: {
    id: string;
    title: string;
    createdAt: Date;
    chaptersCount: number;
  }[];
  createdAt: Date;
}

// Class API functions
export const classApi = {
  createClass: async (data: CreateClassDto): Promise<ClassInfo> => {
    const response = await apiClient.post<ClassInfo>('/classes', data);
    return response.data;
  },

  joinClass: async (data: JoinClassDto): Promise<StudentInfo> => {
    const response = await apiClient.post<StudentInfo>('/classes/join', data);
    return response.data;
  },

  getMyClasses: async (): Promise<ClassInfo[]> => {
    const response = await apiClient.get<ClassInfo[]>('/classes/my-classes');
    return response.data;
  },

  getClassDetails: async (classId: string): Promise<ClassDetails> => {
    const response = await apiClient.get<ClassDetails>(`/classes/${classId}`);
    return response.data;
  },
}; 