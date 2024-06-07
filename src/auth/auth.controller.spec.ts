/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import {
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const req = { user: { username: 'test', userId: '1' } };
      const result = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      mockAuthService.login.mockResolvedValue(result);

      expect(await authController.login(req)).toBe(result);
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const req = { user: { username: 'test', userId: '1' } };
      mockAuthService.login.mockRejectedValue(new Error());

      await expect(authController.login(req)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('register', () => {
    it('should return tokens on successful registration', async () => {
      const registerUserDto: RegisterUserDto = {
        username: 'test',
        password: 'test',
        fullname: 'Test User',
      };
      const result = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      mockAuthService.register.mockResolvedValue(result);

      expect(await authController.register(registerUserDto)).toBe(result);
    });

    it('should throw BadRequestException if username already exists', async () => {
      const registerUserDto: RegisterUserDto = {
        username: 'test',
        password: 'test',
        fullname: 'Test User',
      };
      mockAuthService.register.mockRejectedValue(new BadRequestException());

      await expect(authController.register(registerUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const registerUserDto: RegisterUserDto = {
        username: 'test',
        password: 'test',
        fullname: 'Test User',
      };
      mockAuthService.register.mockRejectedValue(new Error());

      await expect(authController.register(registerUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('refresh', () => {
    it('should return tokens on successful refresh', async () => {
      const req = { user: { refresh_token: 'refreshToken' } };
      const result = {
        access_token: 'accessToken',
        refresh_token: 'newRefreshToken',
      };
      mockAuthService.refresh.mockResolvedValue(result);

      expect(await authController.refresh(req)).toBe(result);
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const req = { user: { refresh_token: 'refreshToken' } };
      mockAuthService.refresh.mockRejectedValue(new UnauthorizedException());

      await expect(authController.refresh(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const req = { user: { refresh_token: 'refreshToken' } };
      mockAuthService.refresh.mockRejectedValue(new Error());

      await expect(authController.refresh(req)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
