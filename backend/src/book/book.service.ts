import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { CreateBookDto, BookChaptersDto } from './dto';
import { v4 as uuid } from 'uuid';
import { generativeModel } from '@shared/singleton';
import { extractJsonBlock } from '@shared/utils';
import { Book } from 'generated/prisma';

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

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const fileExtension = file.originalname.split('.').pop();
      const uniqueFileName = `books/${uuid()}.${fileExtension}`;

      const uploadedFile = await this.storageService.uploadFile(
        file.buffer,
        uniqueFileName,
        {
          metadata: {
            contentType: file.mimetype,
            originalName: file.originalname,
            uploadedBy: teacherId,
          },
        },
      );

      const bookData = {
        title: createBookDto.title,
        fileUri: `gs://${uploadedFile.bucket}/${uploadedFile.name}`,
        uploaderId: teacherId,
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
                text: "Сделай оглавление этой книги: укажи названия параграфов и страницы, на которых они начинаются и заканчиваются. В JSON формате {title: string, startPage: number, endPage: number}[] и никак иначе"
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
        data: {
          ...bookData,
          uploaderId: teacherId,
        },
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

  async getBook(bookId: string): Promise<Book> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chaptersInfo: true
      }
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async getBookChapters(bookId: string): Promise<BookChaptersDto> {
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
      include: {
        chaptersInfo: {
          orderBy: { startPage: 'asc' }
        }
      }
    });

    if (!book) {
      throw new NotFoundException('Book not found');
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
 