import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { EmailSender } from '../email.sender';
import { RabbitMQService } from './rabbitmq.service';
import axios from 'axios';

// Mock the dependencies
const userRepositoryMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAvatarById: jest.fn(),
  deleteById: jest.fn(),
};

const emailSenderMock = {
  send: jest.fn(),
};

const rabbitMQServiceMock = {
  sendEvent: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: userRepositoryMock },
        { provide: EmailSender, useValue: emailSenderMock },
        { provide: RabbitMQService, useValue: rabbitMQServiceMock },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user and send email and RabbitMQ event', async () => {
      const createUserDto = { name: 'John', job: 'Developer' };
      const apiResponse = { data: { id: 1, email: 'test@gmail.com' } };
      const userDb = { id: 1, name: 'John', job: 'Developer' };

      // Mock the axios.post call
      jest.spyOn(axios, 'post').mockResolvedValue(apiResponse);

      // Mock the userRepository.create call
      userRepositoryMock.create.mockResolvedValue(userDb);

      await service.create(createUserDto);

      expect(userRepositoryMock.create).toHaveBeenCalledWith(apiResponse.data);
      expect(emailSenderMock.send).toHaveBeenCalledWith({
        to: apiResponse.data.email,
        from: 'juniozguedes@gmail.com',
        body: 'Account created',
      });
      expect(rabbitMQServiceMock.sendEvent).toHaveBeenCalledWith(
        'CREATED_USER',
        {
          db_id: userDb.id,
          reqres_id: apiResponse.data.id,
        },
      );
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ id: 1, name: 'John', job: 'Developer' }];

      // Mock the userRepository.findAll call
      userRepositoryMock.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepositoryMock.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const id = 1;
      const user = { id: 1, name: 'John', job: 'Developer' };

      // Mock the axios.get call
      jest.spyOn(axios, 'get').mockResolvedValue({ data: user });

      const result = await service.findOne(id);

      expect(axios.get).toHaveBeenCalledWith(
        `https://reqres.in/api/users/${id}`,
      );
      expect(result).toEqual(user);
    });

    it('should throw an error if user not found', async () => {
      const id = 1;

      // Mock the axios.get call to simulate a user not found
      jest.spyOn(axios, 'get').mockRejectedValue({});

      await expect(service.findOne(id)).rejects.toThrowError('User not found');
    });
  });

  describe('findAvatarById', () => {
    it('should return the avatar if found in the database', async () => {
      const id = 1;
      const avatar = 'path/to/avatar.jpg';

      // Mock the userRepository.findAvatarById call
      userRepositoryMock.findAvatarById.mockResolvedValue({ avatar });

      const result = await service.findAvatarById(id);

      expect(userRepositoryMock.findAvatarById).toHaveBeenCalledWith(id);
      expect(result).toEqual(avatar);
    });

    it('should request the avatar from the API if not found in the database', async () => {
      const id = 1;
      const apiResponse = { data: { avatar: 'path/to/avatar.jpg', id: 1 } };
      const userDb = {
        id: 1,
        name: 'John',
        job: 'Developer',
        avatar: 'path/to/avatar.jpg',
      };

      // Mock the userRepository.findAvatarById call to return null
      userRepositoryMock.findAvatarById.mockResolvedValue(null);

      // Mock the axios.get call
      jest.spyOn(axios, 'get').mockResolvedValue(apiResponse);

      // Mock the userRepository.create call
      userRepositoryMock.create.mockResolvedValue(userDb);

      const result = await service.findAvatarById(id);

      expect(userRepositoryMock.findAvatarById).toHaveBeenCalledWith(id);
      expect(axios.get).toHaveBeenCalledWith(
        `https://reqres.in/api/users/${id}`,
      );
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        name: userDb.name,
        job: userDb.job,
        avatar: userDb.avatar,
      });
      expect(rabbitMQServiceMock.sendEvent).toHaveBeenCalledWith(
        'CREATED_USER_AVATAR',
        {
          db_id: userDb.id,
          reqres_id: apiResponse.data.id,
        },
      );
      expect(result).toEqual(userDb);
    });
  });
});
