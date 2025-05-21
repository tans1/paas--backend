import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../../constants';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../public-strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeaderOrQuery(request); // Updated method name

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      request['user'] = payload;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeaderOrQuery(request: Request): string | undefined {
    // 1. Check Authorization header first
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' || token) {
        return token;
      }
    }
  
    const queryToken = request.query?.token;
    if (queryToken) {
      if (Array.isArray(queryToken)) {
        // Return first element if it's an array
        return typeof queryToken[0] === 'string' ? queryToken[0] : undefined;
      }
      return typeof queryToken === 'string' ? queryToken : undefined;
    }
  
    return undefined;
  }
}