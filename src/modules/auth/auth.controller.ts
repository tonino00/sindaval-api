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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

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

    response.cookie('jwt', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Cadastro realizado com sucesso',
      user: tokens.user,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuário' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    const tokens = await this.authService.login(user);

    response.cookie('jwt', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Login realizado com sucesso',
      user: tokens.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de usuário' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    response.clearCookie('refreshToken');

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
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado');
    }

    const tokens = await this.authService.refreshToken(refreshToken);

    response.cookie('jwt', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: 'Token renovado com sucesso',
      user: tokens.user,
    };
  }
}
