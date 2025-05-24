import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { CreateBookDto, BookChaptersDto } from './dto';
import { v4 as uuid } from 'uuid';
import { generativeModel } from '@shared/singleton';
import { extractJsonBlock } from '@shared/utils';
import { Book } from 'generated/prisma';
import { extractPages } from '@shared/utils';
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

  async getChapterSummary(chapterId: string) {
    try {
      const chapter = await this.prisma.chapter.findUnique({
        where: { id: chapterId },
        include: {
          book: true
        }
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found');
      }

      let uploadedChapter: {bucket: string, name: string} | null = null

      if (chapter.fileUri && typeof chapter.fileUri === 'string') {
        uploadedChapter = {
          bucket: chapter.fileUri.split('gs://')[1].split('/')[0],
          name: chapter.fileUri.split('gs://')[1].split('/').slice(1).join('/')
        }
      } else {
        
        const fileName = chapter.book.fileUri.replace('gs://', '').split('/').slice(1).join('/');
        const fileBuffer = await this.storageService.downloadFile(fileName);
        const extractedPages = await extractPages(fileBuffer, chapter.startPage, chapter.endPage);
        
        const chapterBuffer = Buffer.from(extractedPages); 
        uploadedChapter = await this.storageService.uploadFile(
          chapterBuffer, 
          `books/${chapter.book.id}/chapters/${chapter.id}.pdf`,
          {
            metadata: {
              contentType: 'application/pdf',
              chapterId: chapter.id,
              bookId: chapter.book.id,
            },
          }
        );
        await this.prisma.chapter.update({
          where: { id: chapter.id },
          data: {
            fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`
          }
        })
      }

      const result = await generativeModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: `gs://${uploadedChapter.bucket}/${uploadedChapter.name}`,
                  mimeType: 'application/pdf'
                }
              },
              {
                text: `Создай краткое содержание главы. 
                
Название главы: ${chapter.title}

Требования к содержанию:
1. Краткое и понятное изложение основных идей
2. Выделение ключевых моментов и концепций
3. Логическая структура изложения
4. Длина: 3-5 абзацев
5. Язык: русский

Создай содержание, которое поможет студенту понять основные идеи главы.`
              }
            ]
          }
        ],
        generationConfig: {
          candidateCount: 1,
        }
      });

      console.log(result.response.candidates[0].content.parts[0].text);
      

      const summary = result.response.candidates[0].content.parts[0].text;

      return {
        summary,
        chapter: {
          id: chapter.id,
          title: chapter.title,
          startPage: chapter.startPage,
          endPage: chapter.endPage,
          book: {
            id: chapter.book.id,
            title: chapter.book.title
          }
        }
      };

    } catch (error) {
      throw new BadRequestException(`Failed to generate chapter summary: ${error.message}`);
    }
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
