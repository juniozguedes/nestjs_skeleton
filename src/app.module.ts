import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RootTestModule } from './user/root-test.module';

@Module({
  imports: [UserModule, RootTestModule],
})
export class AppModule {}
