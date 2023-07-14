import { Inject } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';

export class UserRepository {
  constructor(
    @Inject('USER_MODEL')
    private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    await createdUser.save();
    // Return only the user data without unnecessary fields
    return {
      id: createdUser.id,
      name: createdUser.name,
      job: createdUser.job,
      createdAt: createdUser.createdAt,
    };
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findAvatarById(id: number): Promise<User> {
    return await this.userModel
      .findOne({
        id,
      })
      .exec();
  }

  async deleteById(id: number): Promise<User | null> {
    const deletedUser = await this.userModel.findOneAndDelete({ id }).exec();
    return deletedUser;
  }
}
