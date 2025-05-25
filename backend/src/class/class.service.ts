import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/services';
import { CreateClassDto, JoinClassDto, ClassInfoDto, ClassDetailsDto } from './dto';
import { UserRole } from 'generated/prisma';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ClassService {
  constructor(private readonly prisma: PrismaService) {}

  private generateClassCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 20; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createClass(teacherId: string, createClassDto: CreateClassDto): Promise<ClassInfoDto> {
    // Verify teacher exists and is actually a teacher
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId }
    });

    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new BadRequestException('Only teachers can create classes');
    }

    // Generate unique class code
    let classCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      classCode = this.generateClassCode();
      const existingClass = await this.prisma.class.findUnique({
        where: { code: classCode }
      });
      isUnique = !existingClass;
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique class code');
    }

    const newClass = await this.prisma.class.create({
      data: {
        name: createClassDto.name,
        description: createClassDto.description,
        code: classCode,
        teacherId: teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            students: true,
            books: true,
          }
        }
      }
    });

    return {
      id: newClass.id,
      name: newClass.name,
      code: newClass.code,
      description: newClass.description,
      teacher: newClass.teacher,
      studentsCount: newClass._count.students,
      booksCount: newClass._count.books,
      createdAt: newClass.createdAt,
    };
  }

  async joinClass(joinClassDto: JoinClassDto) {
    // Check if class exists
    const classInfo = await this.prisma.class.findUnique({
      where: { code: joinClassDto.classCode }
    });

    if (!classInfo) {
      throw new NotFoundException('Invalid class code');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: joinClassDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(joinClassDto.password, 10);

    // Create student account and add to class
    const student = await this.prisma.user.create({
      data: {
        email: joinClassDto.email,
        password: hashedPassword,
        firstName: joinClassDto.firstName,
        lastName: joinClassDto.lastName,
        role: UserRole.STUDENT,
        classId: classInfo.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        studentClass: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        }
      }
    });

    return student;
  }

  async getTeacherClasses(teacherId: string): Promise<ClassInfoDto[]> {
    const classes = await this.prisma.class.findMany({
      where: { teacherId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        _count: {
          select: {
            students: true,
            books: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      teacher: cls.teacher,
      studentsCount: cls._count.students,
      booksCount: cls._count.books,
      createdAt: cls.createdAt,
    }));
  }

  async getClassDetails(classId: string, userId: string): Promise<ClassDetailsDto> {
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' }
        },
        books: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            _count: {
              select: {
                chaptersInfo: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!classInfo) {
      throw new NotFoundException('Class not found');
    }

    // Check if user has access to this class
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    const hasAccess = user.role === UserRole.TEACHER 
      ? classInfo.teacherId === userId 
      : user.classId === classId;

    if (!hasAccess) {
      throw new BadRequestException('Access denied to this class');
    }

    return {
      id: classInfo.id,
      name: classInfo.name,
      code: classInfo.code,
      description: classInfo.description,
      teacher: classInfo.teacher,
      students: classInfo.students,
      books: classInfo.books.map(book => ({
        id: book.id,
        title: book.title,
        createdAt: book.createdAt,
        chaptersCount: book._count.chaptersInfo,
      })),
      createdAt: classInfo.createdAt,
    };
  }

  async getStudentClass(studentId: string): Promise<ClassDetailsDto> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        studentClass: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            },
            students: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'asc' }
            },
            books: {
              select: {
                id: true,
                title: true,
                createdAt: true,
                _count: {
                  select: {
                    chaptersInfo: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!student || !student.studentClass) {
      throw new NotFoundException('Student not found or not enrolled in any class');
    }

    const classInfo = student.studentClass;

    return {
      id: classInfo.id,
      name: classInfo.name,
      code: classInfo.code,
      description: classInfo.description,
      teacher: classInfo.teacher,
      students: classInfo.students,
      books: classInfo.books.map(book => ({
        id: book.id,
        title: book.title,
        createdAt: book.createdAt,
        chaptersCount: book._count.chaptersInfo,
      })),
      createdAt: classInfo.createdAt,
    };
  }
} 