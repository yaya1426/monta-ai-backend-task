/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from './schema/user.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserPayload } from './dto/user-payload.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let userModel: Model<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUserModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'jwtSecret';
      if (key === 'JWT_REFRESH_SECRET') return 'jwtRefreshSecret';
      return null;
    });
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      const user = {
        _id: '1',
        username: 'test',
        password: 'hashed',
        chatSessions: [],
      };
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(user),
      });

      expect(await authService.findById('1')).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(authService.findById('1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockUserModel.findById.mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.findById('1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user data if valid', async () => {
      const user = { _id: '1', username: 'test', password: 'hashed' };
      mockUserModel.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      expect(await authService.validateUser('test', 'password')).toEqual({
        userId: '1',
        username: 'test',
      });
    });

    it('should return null if invalid', async () => {
      const user = { _id: '1', username: 'test', password: 'hashed' };
      mockUserModel.findOne.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      expect(await authService.validateUser('test', 'password')).toBeNull();
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockUserModel.findOne.mockImplementation(() => {
        throw new Error();
      });

      await expect(
        authService.validateUser('test', 'password'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    it('should return tokens', async () => {
      const userPayload: UserPayload = { userId: '1', username: 'test' };
      const tokens = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      mockJwtService.sign
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');

      expect(await authService.login(userPayload)).toEqual(tokens);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockJwtService.sign.mockImplementation(() => {
        throw new Error();
      });

      const userPayload: UserPayload = { userId: '1', username: 'test' };
      await expect(authService.login(userPayload)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('refresh', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const user = { _id: '1', username: 'test' };
      mockJwtService.verify.mockReturnValue({ userId: '1' });
      mockUserModel.findById.mockResolvedValue(user);
      const tokens = {
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
      };
      mockJwtService.sign
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');

      expect(await authService.refresh('validRefreshToken')).toEqual(tokens);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue({ userId: '1' });
      mockUserModel.findById.mockResolvedValue(null);

      await expect(authService.refresh('invalidRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.refresh('invalidRefreshToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if username already exists', async () => {
      const registerUserDto: RegisterUserDto = {
        username: 'test',
        password: 'test',
        fullname: 'Test User',
      };
      mockUserModel.findOne.mockResolvedValue({ username: 'test' });

      await expect(authService.register(registerUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on error', async () => {
      const registerUserDto: RegisterUserDto = {
        username: 'test',
        password: 'test',
        fullname: 'Test User',
      };
      mockUserModel.findOne.mockImplementation(() => {
        throw new Error();
      });

      await expect(authService.register(registerUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
