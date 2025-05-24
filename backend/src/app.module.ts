import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TeacherModule } from './teacher/teacher.module';
import { BookModule } from './book/book.module';
import { TestModule } from './test/test.module';
import { ChapterModule } from './chapter/chapter.module';
import { ClassModule } from './class/class.module';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '.env', isGlobal: true}),
    UserModule,
    TeacherModule,
    BookModule,
    TestModule,
    ChapterModule,
    ClassModule,
  ],
})
export class AppModule {}
