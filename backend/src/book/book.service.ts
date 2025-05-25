import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { CreateBookDto, BookChaptersDto } from './dto';
import { v4 as uuid } from 'uuid';
import { generativeModel } from '@shared/singleton';
import { extractJsonBlock } from '@shared/utils';
import { Book, UserRole } from 'generated/prisma';

interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class BookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: GoogleCloudStorageService,
  ) {}

  async uploadBook(
    file: MulterFile,
    createBookDto: CreateBookDto,
    teacherId: string,
  ) {
    try {
      const teacher = await this.prisma.user.findUnique({
        where: { id: teacherId },
      });

      if (!teacher || teacher.role !== UserRole.TEACHER) {
        throw new BadRequestException('Only teachers can upload books');
      }

      // Verify the class exists and teacher owns it
      const classInfo = await this.prisma.class.findUnique({
        where: { id: createBookDto.classId }
      });

      if (!classInfo) {
        throw new NotFoundException('Class not found');
      }

      if (classInfo.teacherId !== teacherId) {
        throw new BadRequestException('You can only upload books to your own classes');
      }

      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `books/${file.originalname.split('.')[0]}-${teacherId}.${fileExtension}`;

      if (await this.prisma.book.findFirst({where: {fileUri: {equals: `gs://${uniqueFileName}-${teacherId}.${fileExtension}`}}})) {
        const existingBook = await this.prisma.book.findFirst({
          where: {
            fileUri: {
              equals: uniqueFileName
            },
          },
          include: {
            chaptersInfo: true,
          }
        })
        
        if (existingBook) {
          return {
            title: createBookDto.title,
            fileUri: existingBook.fileUri,
            uploaderId: teacherId,
            classId: createBookDto.classId,
            chapters: existingBook.chaptersInfo,
          }
        }
      }

      const uploadedFile = await this.storageService.uploadFile(
        file.buffer,
        uniqueFileName,
        {
          metadata: {
            contentType: file.mimetype,
            originalName: file.originalname,
            uploadedBy: teacherId,
            classId: createBookDto.classId,
          },
        },
      );

      const bookData = {
        title: createBookDto.title,
        fileUri: `gs://${uploadedFile.bucket}/${uploadedFile.name}`,
        uploaderId: teacherId,
        classId: createBookDto.classId,
      };

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: bookData.fileUri,
                  mimeType: file.mimetype
                }
              },
              {
                text: "Create a table of contents for this book: specify chapter names and the pages on which they start and end. In JSON format {title: string, startPage: number, endPage: number}[] and nothing else"
              }
            ]
          }
          ],
          generationConfig: {
              candidateCount: 1
          }
      });

      const chaptersInfo = extractJsonBlock(result.response.candidates[0].content.parts[0].text);

      const book = await this.prisma.book.create({
        data: bookData,
      });

      await this.prisma.chapter.createMany({
        data: chaptersInfo.map((chapter) => ({
          title: chapter.title,
          startPage: chapter.startPage,
          endPage: chapter.endPage,
          bookId: book.id,
        })),
      });

      return book;
    } catch (error) {
      throw new BadRequestException(`Failed to upload book: ${error.message}`);
    }
  }

  async getBook(bookId: string, userId: string): Promise<Book> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chaptersInfo: true,
        class: {
          include: {
            teacher: true,
            students: true,
          }
        }
      }
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Check if user has access to this book
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    const hasAccess = user.role === UserRole.TEACHER 
      ? book.class.teacherId === userId 
      : user.classId === book.classId;

    if (!hasAccess) {
      throw new BadRequestException('Access denied to this book');
    }

    return book;
  }

  async getBookChapters(bookId: string, userId: string): Promise<BookChaptersDto> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chaptersInfo: {
          orderBy: { startPage: 'asc' }
        },
        class: {
          include: {
            teacher: true,
            students: true,
          }
        }
      }
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Check if user has access to this book
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    const hasAccess = user.role === UserRole.TEACHER 
      ? book.class.teacherId === userId 
      : user.classId === book.classId;

    if (!hasAccess) {
      throw new BadRequestException('Access denied to this book');
    }

    return {
      book: {
        id: book.id,
        title: book.title,
        createdAt: book.createdAt
      },
      chapters: book.chaptersInfo
    };
  }
}
 