/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { OpenAIService } from './openai.service';
import { ChatSession } from './schema/chat-session.schema';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };
    }),
  };
});

describe('OpenAIService', () => {
  let service: OpenAIService;
  let chatSessionModel: Model<ChatSession>;
  let configService: ConfigService;
  let authService: AuthService;
  let openaiMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAIService,
        {
          provide: getModelToken(ChatSession.name),
          useValue: {
            findById: jest.fn(),
            find: jest.fn(),
            create: jest.fn().mockImplementation((data) => ({
              ...data,
              _id: new Types.ObjectId(),
              save: jest.fn().mockResolvedValue(undefined),
            })),
            lean: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OpenAIService>(OpenAIService);
    chatSessionModel = module.get<Model<ChatSession>>(
      getModelToken(ChatSession.name),
    );
    configService = module.get<ConfigService>(ConfigService);
    authService = module.get<AuthService>(AuthService);
    openaiMock = require('openai');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSession', () => {
    it('should return session if found', async () => {
      const sessionId = 'some-session-id';
      const session = { _id: sessionId, user: {}, save: jest.fn() } as any;
      jest.spyOn(chatSessionModel, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(session),
      } as any);

      const result = await service.getSession(sessionId);
      expect(result).toEqual(session);
    });

    it('should throw NotFoundException if session not found', async () => {
      const sessionId = 'some-session-id';
      jest.spyOn(chatSessionModel, 'findById').mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getSession(sessionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const sessionId = 'some-session-id';
      jest.spyOn(chatSessionModel, 'findById').mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('some error')),
      } as any);

      await expect(service.getSession(sessionId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions', async () => {
      const userId = '1234567890abcdef12345678';
      const sessions = [
        { _id: '1234567890abcdef12345678' },
        { _id: '1234567890abcdef12345679' },
      ];
      jest.spyOn(chatSessionModel, 'find').mockReturnValue({
        lean: jest.fn().mockResolvedValue(sessions),
      } as any);

      const result = await service.getUserSessions(userId);
      expect(result).toEqual(sessions);
    });

    it('should throw InternalServerErrorException on database error', async () => {
      const userId = '1234567890abcdef12345678';
      jest.spyOn(chatSessionModel, 'find').mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('some error')),
      } as any);

      await expect(service.getUserSessions(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generatePromptWithContext', () => {
    it('should generate prompt with context', () => {
      const history = [{ user: 'How are you?', bot: 'I am good, thanks!' }];
      const newPrompt = 'What can you do?';

      const result = service.generatePromptWithContext(history, newPrompt);
      expect(result).toEqual([
        {
          role: 'system',
          content:
            'You are a helpful assistant to chat with and ask questions.',
        },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am good, thanks!' },
        { role: 'user', content: 'What can you do?' },
      ]);
    });
  });
});
