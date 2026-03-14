import { IsEmail, IsNotEmpty, IsString, Length, ValidateIf } from 'class-validator';

export class Generate2FADto {
  @IsString()
  password: string;
}

export class Verify2FADto {
  @IsString()
  @Length(6, 6)
  token: string;
}

export class LoginWith2FADto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @Length(6, 6)
  twoFactorToken: string;
}

export class RecoveryCodeDto {
  @IsString()
  @Length(10, 10)
  recoveryCode: string;
}

export class Login2faEndpointDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @ValidateIf((o) => !o.recoveryCode)
  @IsString()
  @Length(6, 6)
  twoFactorToken?: string;

  @ValidateIf((o) => !o.twoFactorToken)
  @IsString()
  @Length(10, 10)
  recoveryCode?: string;

  @ValidateIf((o) => !o.twoFactorToken && !o.recoveryCode)
  @IsNotEmpty({ message: 'Forneça twoFactorToken (6 dígitos) ou recoveryCode (10 caracteres)' })
  dummy?: string;
}
