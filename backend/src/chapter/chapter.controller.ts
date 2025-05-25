import { Controller, Post, Param, Request, UseGuards } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { JwtAuthGuard } from '@shared/guards';

@Controller('chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post(':chapterId/summary')
  @UseGuards(JwtAuthGuard)
  async getChapterSummary(@Param('chapterId') chapterId: string) {
    return await this.chapterService.getChapterSummary(chapterId);
  }

  @Post(':chapterId/podcast')
  @UseGuards(JwtAuthGuard)
  async generateChapterPodcast(@Param('chapterId') chapterId: string, @Request() req: { user: { id: string } }) {
    return await this.chapterService.generateChapterPodcast(chapterId, req.user.id);
  }

  @Post(':chapterId/presentation')
  @UseGuards(JwtAuthGuard)
  async generateChapterPresentation(@Param('chapterId') chapterId: string) {
    return await this.chapterService.generateChapterPresentation(chapterId);
  }
}
