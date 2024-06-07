import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { JwtAuthGuard } from '../auth/guard/jwt.guard';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @UseGuards(JwtAuthGuard)
  @Post('message')
  async sendMessage(
    @Query('sessionId') sessionId: string,
    @Body('message') message: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    try {
      return await this.openaiService.getResponse(message, sessionId, userId);
    } catch (error) {
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    try {
      return await this.openaiService.getUserSessions(req.user.userId);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve user sessions',
      );
    }
  }
}
