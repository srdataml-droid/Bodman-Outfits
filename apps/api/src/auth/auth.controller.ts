import { BadRequestException, Controller, Get, HttpCode, Body, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AdminAuthGuard, type AuthenticatedRequest } from "./admin-auth.guard";
import { changeEmailSchema, changePasswordSchema, loginSchema } from "./auth.schema";
import { AuthService } from "./auth.service";
import { clearedSessionCookieOptions, SESSION_COOKIE_NAME, sessionCookieOptions } from "./session-cookie";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // AGENTS.md requires login attempts to be rate-limited: 5 attempts per 60
  // seconds per IP, tighter than the global default in app.module.ts.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response): Promise<{ email: string }> {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const session = await this.authService.login(parsed.data);
    res.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
    return { email: session.email };
  }

  @UseGuards(AdminAuthGuard)
  @Post("logout")
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE_NAME];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions());
    return { ok: true };
  }

  // Self-service credential management. Rate-limited on the same 5/60s
  // budget as login: these accept a password and are therefore just as
  // attractive a target for guessing as the login route itself.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AdminAuthGuard)
  @Post("change-password")
  @HttpCode(200)
  async changePassword(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<{ ok: true }> {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const token = (req.cookies as Record<string, string | undefined> | undefined)?.[SESSION_COOKIE_NAME];
    // The guard has already established a valid session, so a missing cookie
    // here is not reachable in practice; passing "" would silently revoke
    // nothing rather than everything, so fail loudly instead.
    if (!token) {
      throw new BadRequestException("Missing session cookie");
    }
    await this.authService.changePassword(req.admin.id, token, parsed.data);
    return { ok: true };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AdminAuthGuard)
  @Post("change-email")
  @HttpCode(200)
  async changeEmail(@Req() req: AuthenticatedRequest, @Body() body: unknown): Promise<{ email: string }> {
    const parsed = changeEmailSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.authService.changeEmail(req.admin.id, parsed.data);
  }

  // Lets the dashboard render "signed in as ..." and check session validity
  // without a dedicated probe against a data endpoint.
  @UseGuards(AdminAuthGuard)
  @Get("me")
  me(@Req() req: AuthenticatedRequest): { id: string; email: string } {
    return { id: req.admin.id, email: req.admin.email };
  }
}
