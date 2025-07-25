// This interface is now redundant - use CreateUserResponseDto from generated types instead
// import { CreateUserResponseDto } from '../types/generated';
// export type IUser = CreateUserResponseDto;

export interface IUser {
  id: string;
  name: string;
  surname: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
