import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { RabbitMQService } from './rabbitmq.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { EmailSender } from '../email.sender';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailSender: EmailSender,
    private readonly rabbitmqService: RabbitMQService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const apiResponse = await axios.post<User>('https://reqres.in/api/users', {
      name: createUserDto.name,
      job: createUserDto.job,
    });
    const userDb = await this.userRepository.create(apiResponse.data);
    await this.emailSender.send({
      to: apiResponse['email'],
      from: 'juniozguedes@gmail.com',
      body: 'Account created',
    });
    await this.rabbitmqService.sendEvent('CREATED_USER', {
      db_id: userDb.id,
      reqres_id: apiResponse.data.id,
    });
  }

  async findAll() {
    return await this.userRepository.findAll();
  }

  async findOne(id: number) {
    try {
      const response = await axios.get<User>(
        `https://reqres.in/api/users/${id}`,
      );
      return response.data;
    } catch (e) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async findAvatarById(id: number) {
    const response = await this.userRepository.findAvatarById(id);
    //If user.avatar exists in mongodb, returns user.avatar
    if (response) {
      return response.avatar;
    }

    // If doesn't exist, request api to get the avatar
    const apiResponse = await axios.get(`https://reqres.in/api/users/${id}`);
    console.log(apiResponse.data.data.avatar);
    // If the user from request api doesn't have avatar, throw new HttpException bad request
    if (!apiResponse.data.data.avatar) {
      throw new HttpException(
        'Avatar not found on API',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Save User on mongodb and return avatar
    const userDb = await this.userRepository.create({
      name: apiResponse.data.data.name,
      job: apiResponse.data.data.job,
      avatar: apiResponse.data.data.avatar,
    });
    await this.rabbitmqService.sendEvent('CREATED_USER_AVATAR', {
      db_id: userDb.id,
      reqres_id: apiResponse.data.data.id,
    });
    return userDb;
  }

  async remove(id: number) {
    try {
      const deletedUser = await this.userRepository.deleteById(id);
      if (deletedUser) {
        console.log('User deleted:', deletedUser);
      }
    } catch (e) {
      throw new HttpException(
        'Avatar not found on API',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
