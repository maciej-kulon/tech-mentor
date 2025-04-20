import { IsString, IsEmail, MinLength } from 'class-validator';

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
}

export class CreateUserResponseDto {
  public readonly id: string;
}
