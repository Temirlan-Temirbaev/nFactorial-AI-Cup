import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto';
import { JwtAuthGuard } from '@shared/guards';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Post('chapters/:chapterId')
  @UseGuards(JwtAuthGuard)
  async generateChapterTest(
    @Param('chapterId') chapterId: string,
    @Body() createTestDto?: CreateTestDto
  ) {
    return await this.testService.generateChapterTest(chapterId, createTestDto);
  }

  @Get('chapters/:chapterId')
  @UseGuards(JwtAuthGuard)
  async getChapterTest(@Param('chapterId') chapterId: string) {
    return await this.testService.getChapterTest(chapterId);
  }
}
