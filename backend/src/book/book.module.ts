import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';

@Module({
    controllers: [BookController],
    providers: [BookService, PrismaService, GoogleCloudStorageService],
    exports: [BookService],
})
export class BookModule {}
