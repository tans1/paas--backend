import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {Response} from 'express'

interface AuthPayload {
    access_token: string;
  }

interface ConnectionResult {
  success: boolean;
  error?: string;
}
  
export class RedirectStrategyService {
  constructor(
    private readonly configService: ConfigService
  ) {}

    static redirectWithConnectionResult(res: Response, result: any): void {
    const baseUrl = process.env.FRONT_END_URL;
    const redirectUrl = result.success 
      ? `${baseUrl}/integration-success?provider=github` 
      : `${baseUrl}/integration-failure?error=${encodeURIComponent(result.error)}`;
    
    res.redirect(redirectUrl);
  }
  
  static redirectToSuccess(res: Response, payload: AuthPayload): void {
    const url = new URL(`${process.env.FRONT_END_URL}/login-success`);
    url.searchParams.set('token', payload.access_token);
    res.redirect(url.toString());
  }
  
  static redirectToFailure(res: Response, reason: string = 'Authentication failed'): void {
    const url = new URL(`${process.env.FRONT_END_URL}/login-failure`);
    url.searchParams.set('reason', encodeURIComponent(reason));
    res.redirect(url.toString());
  }

}
