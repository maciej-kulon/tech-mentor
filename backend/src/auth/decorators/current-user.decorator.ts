import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ICommonUser } from '@/user/interfaces/common-user.interface';

/**
 * Custom decorator to extract the current authenticated user from the request
 * This decorator works with JWT authentication and returns the user object
 * that was set by the JWT strategy's validate method
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ICommonUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
