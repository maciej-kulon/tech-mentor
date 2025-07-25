import { CreateUserResponseDto } from '../../user/dto/create-user.dto';

export class LoginResponseDto {
  public readonly access_token: string;
  public readonly refresh_token: string;
  public readonly user: CreateUserResponseDto;
}
