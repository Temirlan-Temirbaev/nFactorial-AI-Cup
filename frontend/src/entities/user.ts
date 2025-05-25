import { UserRole } from './enums';
import type { Class } from './class';
import type { Book } from './book';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
  voicePreference: string;
  classId?: string;
}

// User with populated relationships
export interface UserWithRelations extends User {
  teachingClasses?: Class[];
  uploadedBooks?: Book[];
  studentClass?: Class;
}

// User without sensitive data (for client-side use)
export interface PublicUser extends Omit<User, 'password'> {
  fullName?: string;
}

// User creation/update DTOs
export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  voicePreference?: string;
  classId?: string;
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'email' | 'password'>> {
  email?: string;
  password?: string;
} 