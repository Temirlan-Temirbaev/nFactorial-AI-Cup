import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { PrismaService } from '../shared/services';

@Module({
  controllers: [TestController],
  providers: [TestService, PrismaService],
  exports: [TestService]
})
export class TestModule {}
