import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth, ApiConsumes } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as QRCode from 'qrcode';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { Generate2FADto, Verify2FADto, Login2faEndpointDto } from './dto/two-factor.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  private getCookieOptions(req?: Request) {
    const isProd = process.env.NODE_ENV === 'production';
    const authDebug = process.env.AUTH_DEBUG === 'true';
    const isMobile = req?.isMobile || false;

    let sameSite: 'none' | 'lax' | 'strict' = 'strict';

    if (isProd) {
      sameSite = 'none';
    }

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: '/',
    };

    if (authDebug) {
      console.log('[COOKIE_OPTIONS]', {
        isProd,
        isMobile,
        sameSite,
        secure: cookieOptions.secure,
        hasCookieInRequest: Boolean(req?.cookies?.jwt),
        userAgent: req?.userAgent?.substring(0, 100) || 'N/A',
        origin: req?.headers?.origin || 'N/A',
      });
    }

    return cookieOptions;
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastro de usuário (auto-cadastro)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = 'uploads/users';
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `user-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Arquivo inválido. Apenas imagens são permitidas.'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async register(
    @Body() body: CreateUserDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @UploadedFile() foto?: { path: string },
  ) {
    const fotoUrl = foto ? `/${foto.path.replace(/\\/g, '/')}` : undefined;
    const createUserDto: CreateUserDto = {
      ...body,
      role: UserRole.SINDICALIZADO,
    };

    const user = await this.usersService.create(createUserDto, fotoUrl);
    const tokens = await this.authService.login(user);

    const cookieBase = this.getCookieOptions(request);

    response.cookie('jwt', tokens.accessToken, {
      ...cookieBase,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Cadastro realizado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);

    if (user.isTwoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        message: 'Código 2FA necessário',
      };
    }

    const tokens = await this.authService.login(user);

    const cookieBase = this.getCookieOptions(request);

    response.cookie('jwt', tokens.accessToken, {
      ...cookieBase,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      requiresTwoFactor: false,
      message: 'Login realizado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário com 2FA (step 2)' })
  async login2fa(
    @Body() dto: Login2faEndpointDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado para este usuário');
    }

    const tokenToValidate = (dto.recoveryCode || dto.twoFactorToken) as string;
    if (!tokenToValidate) {
      throw new BadRequestException('Código 2FA ou recovery code é obrigatório');
    }

    const ok = await this.authService.validateTwoFactorToken(user.id, tokenToValidate);
    if (!ok) {
      throw new UnauthorizedException('Código 2FA inválido');
    }

    const tokens = await this.authService.login(user);

    const cookieBase = this.getCookieOptions(request);

    response.cookie('jwt', tokens.accessToken, {
      ...cookieBase,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      requiresTwoFactor: false,
      message: 'Login realizado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar configuração do 2FA' })
  @ApiCookieAuth()
  async setup2fa(@CurrentUser() currentUser: any, @Body() dto: Generate2FADto) {
    const user = await this.authService.validateUser(currentUser.email, dto.password);
    const result = await this.authService.startTwoFactorSetup(user.id);
    const qrCodeDataUrl = await QRCode.toDataURL(result.otpauthUrl);
    return {
      otpauthUrl: result.otpauthUrl,
      qrCodeDataUrl,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar e habilitar o 2FA' })
  @ApiCookieAuth()
  async confirm2fa(@CurrentUser('id') userId: string, @Body() dto: Verify2FADto) {
    const result = await this.authService.confirmTwoFactorSetup(userId, dto.token);
    const user = await this.authService.getUserById(userId);
    return {
      ...result,
      user: {
        id: user.id,
        email: user.email,
        nomeCompleto: user.nomeCompleto,
        cpf: user.cpf,
        role: user.role,
        status: user.status,
        isTwoFactorEnabled: user.isTwoFactorEnabled,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desabilitar o 2FA' })
  @ApiCookieAuth()
  async disable2fa(@CurrentUser('id') userId: string, @Body() dto: Verify2FADto) {
    const ok = await this.authService.validateTwoFactorToken(userId, dto.token);
    if (!ok) {
      throw new UnauthorizedException('Código 2FA inválido');
    }
    return this.authService.disableTwoFactor(userId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const cookieBase = this.getCookieOptions(request);
    response.clearCookie('jwt', cookieBase);
    response.clearCookie('refreshToken', cookieBase);

    return {
      message: 'Logout realizado com sucesso',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar token de acesso' })
  @ApiResponse({ status: 200, description: 'Token renovado com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @Req() request: Request,
    @Body('refreshToken') refreshTokenFromBody: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (process.env.AUTH_DEBUG === 'true') {
      console.log('[AUTH_DEBUG][REFRESH] cookieHeaderPresent=', Boolean(request.headers?.cookie));
      console.log('[AUTH_DEBUG][REFRESH] hasRefreshTokenCookie=', Boolean(request.cookies?.refreshToken));
      console.log('[AUTH_DEBUG][REFRESH] hasRefreshTokenBody=', Boolean(refreshTokenFromBody));
    }
    const refreshToken = request.cookies?.refreshToken || refreshTokenFromBody;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    const cookieBase = this.getCookieOptions(request);

    response.cookie('jwt', tokens.accessToken, {
      ...cookieBase,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      ...cookieBase,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Token renovado com sucesso',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  @ApiResponse({ status: 200, description: 'Email de redefinição enviado (se o email existir)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }
}
