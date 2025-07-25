export class CreateUserInternalDto {
  public readonly name: string;
  public readonly surname: string;
  public readonly email: string;
  public readonly passwordHash: string;
  public readonly company?: string;
}
