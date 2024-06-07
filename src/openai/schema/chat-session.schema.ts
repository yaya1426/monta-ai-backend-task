import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';

@Schema()
export class ChatSession extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ type: [{ user: String, bot: String }], default: [] })
  history: { user: string; bot: string }[];
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
