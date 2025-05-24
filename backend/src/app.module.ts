import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TeacherModule } from './teacher/teacher.module';
import { BookModule } from './book/book.module';
import { TestController } from './test/test.controller';
import { TestModule } from './test/test.module';
import { ChapterModule } from './chapter/chapter.module';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '.env', isGlobal: true}),
    UserModule,
    TeacherModule,
    BookModule,
    TestModule,
    ChapterModule,
  ],
  controllers: [TestController],
})
export class AppModule {}
