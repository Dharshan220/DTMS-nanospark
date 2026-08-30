import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description:
      'Authenticate user with email and password. ' +
      'Returns an access token in the response body and sets a refresh token in an httpOnly cookie. ' +
      'Use the returned `accessToken` value with the **Authorize** button above to test other endpoints.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User authenticated successfully. Copy the `accessToken` from the response and paste it in the Authorize dialog.',
    schema: {
      example: {
        user: {
          id: 'clx1234567890abcdef',
          email: 'admin@example.com',
          role: 'ADMIN',
          status: 'ACTIVE',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHgxMjM0NTY3ODkwYWJjZGVmIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjkwMDAwMDAwLCJleHAiOjE2OTAwMDA5MDB9.signature',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 429, description: 'Too many login attempts — rate limited (10 requests per minute)' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);

    res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Use the refresh token cookie (set during login) to obtain a new access token. ' +
      'The refresh token is stored in an httpOnly cookie and is not exposed in the response body.',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token returned',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHgxMjM0NTY3ODkwYWJjZGVmIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjkwMDAwMDAwLCJleHAiOjE2OTAwMDA5MDB9.signature',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token cookie' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Return the authenticated user profile. Requires a valid Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile returned',
    schema: {
      example: {
        id: 'clx1234567890abcdef',
        email: 'admin@example.com',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token' })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    const safeUser = await this.authService.getSafeUser(user.id);
    return safeUser;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Clear refresh token cookie and invalidate the session. Requires a valid Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized — missing or invalid Bearer token' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }
}
