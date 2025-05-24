import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { SpeechService } from '../shared/services/speech.service';

@Module({
    controllers: [BookController],
    providers: [BookService, PrismaService, GoogleCloudStorageService, SpeechService],
    exports: [BookService],
})
export class BookModule {}
