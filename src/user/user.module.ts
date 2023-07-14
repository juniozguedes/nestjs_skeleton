import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { EmailSender } from './email.sender';
import { DatabaseModule } from 'src/database.module';
import { usersProviders } from './users.providers';
import { RabbitMQService } from './services/rabbitmq.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    EmailSender,
    ...usersProviders,
    RabbitMQService,
  ],
})
export class UserModule {}
