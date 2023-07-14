import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { EmailSender } from './email.sender';
import { UserRepository } from './repositories/user.repository';
import { RabbitMQService } from './services/rabbitmq.service';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, EmailSender, RabbitMQService],
})
export class RootTestModule {}
