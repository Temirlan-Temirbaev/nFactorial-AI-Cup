import { Controller, Post, Get, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto, JoinClassDto } from './dto';
import { JwtAuthGuard } from '@shared/guards';

@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createClass(
    @Body() createClassDto: CreateClassDto,
    @Request() req: { user: { id: string } }
  ) {
    return await this.classService.createClass(req.user.id, createClassDto);
  }

  @Post('join')
  async joinClass(@Body() joinClassDto: JoinClassDto) {
    return await this.classService.joinClass(joinClassDto);
  }

  @Get('my-classes')
  @UseGuards(JwtAuthGuard)
  async getMyClasses(@Request() req: { user: { id: string; role: string } }) {
    if (req.user.role === 'TEACHER') {
      return await this.classService.getTeacherClasses(req.user.id);
    } else {
      return await this.classService.getStudentClass(req.user.id);
    }
  }

  @Get(':classId')
  @UseGuards(JwtAuthGuard)
  async getClassDetails(
    @Param('classId') classId: string,
    @Request() req: { user: { id: string } }
  ) {
    return await this.classService.getClassDetails(classId, req.user.id);
  }
} 