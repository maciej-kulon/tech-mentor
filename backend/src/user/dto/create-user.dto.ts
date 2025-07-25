import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  public readonly name: string;

  @IsString()
  @MinLength(3)
  public readonly surname: string;

  @IsEmail()
  public readonly email: string;

  @IsString()
  @MinLength(8)
  public readonly password: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  public readonly company?: string;
}

export class CreateUserResponseDto {
  public readonly id: string;
  public readonly company?: string;
  public readonly name: string;
  public readonly surname: string;
  public readonly email: string;
}
