import * as mongoose from 'mongoose';

export const UserSchema = new mongoose.Schema({
  id: Number,
  name: String,
  job: String,
  createdAt: Date,
  avatar: {
    required: false,
    type: String,
  },
});
