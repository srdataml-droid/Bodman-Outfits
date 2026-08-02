import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService, type AdminIdentity } from "./auth.service";
import { SESSION_COOKIE_NAME } from "./session-cookie";

export interface AuthenticatedRequest extends Request {
  admin: AdminIdentity;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE_NAME];
    const admin = token ? await this.authService.validateSession(token) : null;
    if (!admin) {
      throw new UnauthorizedException("Admin authentication required");
    }
    request.admin = admin;
    return true;
  }
}
