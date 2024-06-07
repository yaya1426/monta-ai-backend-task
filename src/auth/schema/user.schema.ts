import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ChatSession } from 'src/openai/schema/chat-session.schema';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  fullname: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'ChatSession' }] })
  chatSessions: ChatSession[];
}

export const UserSchema = SchemaFactory.createForClass(User);
