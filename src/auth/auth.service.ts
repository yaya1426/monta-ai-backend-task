import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    this.jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  async findById(id: string) {
    try {
      const user = this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find user');
    }
  }

  async validateUser(username: string, pass: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ username });
      if (user && (await bcrypt.compare(pass, user.password))) {
        return { username: user.username };
      }
      return null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to validate user');
    }
  }

  async login(user: User) {
    try {
      return this.generateTokens(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate tokens');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return this.generateTokens(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async register(userDto: RegisterUserDto) {
    try {
      const existingUser = await this.userModel.findOne({
        username: userDto.username,
      });

      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(userDto.password, 10);
      const user = new this.userModel({
        ...userDto,
        password: hashedPassword,
      });
      await user.save();

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  private generateTokens(user: User) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.jwtSecret,
        expiresIn: '15m',
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.jwtRefreshSecret,
        expiresIn: '7d',
      }),
    };
  }
}
