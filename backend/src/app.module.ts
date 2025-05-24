import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TeacherModule } from './teacher/teacher.module';
import { BookModule } from './book/book.module';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '.env', isGlobal: true}),
    UserModule,
    TeacherModule,
    BookModule,
  ],
})
export class AppModule {}
