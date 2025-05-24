import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookService } from './book.service';
import { CreateBookDto } from './dto';
import { JwtAuthGuard } from '@shared/guards';

interface UploadedFileType {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBook(
    @UploadedFile() file: UploadedFileType,
    @Body() createBookDto: CreateBookDto,
    @Request() req: { user: { id: string } },
  ) {

    return await this.bookService.uploadBook(file, createBookDto, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBook(@Param('id') id: string) {
    return await this.bookService.getBook(id);
  }

  @Get(':id/chapters')
  @UseGuards(JwtAuthGuard)
  async getBookChapters(@Param('id') id: string) {
    return await this.bookService.getBookChapters(id);
  }
}
