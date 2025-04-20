import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

@Schema({
  collection: 'users',
  timestamps: true,
  _id: true,
})
export class User {
  public _id: ObjectId;

  public createdAt: Date;
  public updatedAt: Date;

  @Prop({ required: true })
  public name: string;

  @Prop({ required: true })
  public surname: string;

  @Prop({ required: true })
  public email: string;

  @Prop({ required: true })
  public passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
