import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ChatSession } from './schema/chat-session.schema';
import { AuthService } from 'src/auth/auth.service';
import { ChatCompletionMessageParam } from 'openai/resources';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(ChatSession.name)
    private readonly chatSessionModel: Model<ChatSession>,
    private readonly authService: AuthService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async getSession(sessionId: string): Promise<ChatSession> {
    try {
      const session = await this.chatSessionModel
        .findById(sessionId)
        .populate('user');
      if (!session) {
        throw new NotFoundException('Session not found');
      }
      return session;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get session');
    }
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const sessions = await this.chatSessionModel
        .find({ user: new Types.ObjectId(userId) })
        .lean();
      return sessions;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to get user sessions');
    }
  }

  async getResponse(
    prompt: string,
    sessionId: string,
    userId: string,
  ): Promise<{ sessionId: string; response: string }> {
    let session;
    try {
      session = await this.getSession(sessionId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        session = await this.createSession(userId);
      } else {
        console.error(error);
        throw new InternalServerErrorException(
          'Failed to get or create session',
        );
      }
    }

    const fullPrompt = this.generatePromptWithContext(session.history, prompt);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: fullPrompt,
        max_tokens: parseInt(
          this.configService.get('OPENAI_MAX_TOKENS') ?? '150',
        ),
      });

      const botResponse = completion.choices[0].message.content.trim();
      session.history.push({ user: prompt, bot: botResponse });
      await session.save();

      return { sessionId: session._id.toString(), response: botResponse };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        'Failed to communicate with OpenAI API',
      );
    }
  }

  private generatePromptWithContext(
    history: { user: string; bot: string }[],
    newPrompt: string,
  ) {
    try {
      const results: ChatCompletionMessageParam[] = [];
      results.push({
        role: 'system',
        content: 'You are a helpful assistant to chat with and ask questions.',
      });
      history.forEach((entry) => {
        results.push({ role: 'user', content: entry.user });
        results.push({ role: 'assistant', content: entry.bot });
      });
      results.push({ role: 'user', content: newPrompt });
      return results;
    } catch (error) {
      console.error('Failed to generate prompt with context', error);
      throw new InternalServerErrorException(
        'Failed to generate prompt with context',
      );
    }
  }

  private async createSession(userId: string): Promise<ChatSession> {
    try {
      const user = await this.authService.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const session = new this.chatSessionModel({ user, history: [] });
      await session.save();

      user.chatSessions.push(session._id as any);
      await user.save();

      return session;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create session');
    }
  }
}
