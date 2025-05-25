import type { User } from './user';
import type { Book } from './book';

export interface Class {
  id: string;
  name: string;
  code: string; // 20-character random code
  description?: string;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Class with populated relationships
export interface ClassWithRelations extends Class {
  teacher?: User;
  students?: User[];
  books?: Book[];
}

// Class creation/update DTOs
export interface CreateClassDto {
  name: string;
  description?: string;
  teacherId: string;
}

export interface UpdateClassDto extends Partial<Omit<CreateClassDto, 'teacherId'>> {
  teacherId?: string;
}

// Class with student/book counts for summary views
export interface ClassSummary extends Class {
  studentCount: number;
  bookCount: number;
  teacherName?: string;
} 