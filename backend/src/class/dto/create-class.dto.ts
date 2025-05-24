export class CreateClassDto {
  name: string;
  description?: string;
}

export class JoinClassDto {
  classCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface ClassInfoDto {
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

export interface ClassDetailsDto {
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