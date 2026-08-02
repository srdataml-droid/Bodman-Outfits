import { BadRequestException, Controller, HttpCode, Body, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AdminAuthGuard } from "./admin-auth.guard";
import { loginSchema } from "./auth.schema";
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
}
