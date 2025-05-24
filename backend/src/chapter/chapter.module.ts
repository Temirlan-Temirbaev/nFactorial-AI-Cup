import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { PrismaService, GoogleCloudStorageService } from '../shared/services';
import { SpeechService } from '../shared/services/speech.service';

@Module({
  controllers: [ChapterController],
  providers: [ChapterService, PrismaService, GoogleCloudStorageService, SpeechService],
  exports: [ChapterService]
})
export class ChapterModule {}
