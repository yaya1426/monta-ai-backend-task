import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt.guard';

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
    return this.openaiService.getResponse(message, sessionId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getUserSessions(@Request() req) {
    return this.openaiService.getUserSessions(req.user.userId);
  }
}
