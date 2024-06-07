/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAIController } from './openai.controller';
import { OpenAIService } from './openai.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InternalServerErrorException } from '@nestjs/common';

describe('OpenAIController', () => {
  let openAIController: OpenAIController;
  let openAIService: OpenAIService;

  const mockOpenAIService = {
    getResponse: jest.fn(),
    getUserSessions: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OpenAIController],
      providers: [
        OpenAIService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    openAIController = module.get<OpenAIController>(OpenAIController);
    openAIService = module.get<OpenAIService>(OpenAIService);
  });

  it('should be defined', () => {
    expect(openAIController).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should return a response on successful message sending', async () => {
      const message = 'Hello';
      const sessionId = 'session1';
      const userId = 'user1';
      const req = { user: { userId } };
      const response = 'response';

      mockOpenAIService.getResponse.mockResolvedValue(response);

      expect(await openAIController.sendMessage(sessionId, message, req)).toBe(
        response,
      );
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const message = 'Hello';
      const sessionId = 'session1';
      const userId = 'user1';
      const req = { user: { userId } };

      mockOpenAIService.getResponse.mockRejectedValue(new Error());

      await expect(
        openAIController.sendMessage(sessionId, message, req),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserSessions', () => {
    it('should return user sessions on successful retrieval', async () => {
      const userId = 'user1';
      const req = { user: { userId } };
      const sessions = [{ sessionId: 'session1' }];

      mockOpenAIService.getUserSessions.mockResolvedValue(sessions);

      expect(await openAIController.getUserSessions(req)).toBe(sessions);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const userId = 'user1';
      const req = { user: { userId } };

      mockOpenAIService.getUserSessions.mockRejectedValue(new Error());

      await expect(openAIController.getUserSessions(req)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
