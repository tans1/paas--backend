// src/auth/guards/status.guard.ts
import { UsersRepositoryInterface } from '@/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { UserStatus } from '@prisma/client'; 
  
  @Injectable()
  export class StatusGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private usersRepositoryService: UsersRepositoryInterface
    ) {}
  
    async canActivate(ctx: ExecutionContext): Promise<boolean> {
      const req = ctx.switchToHttp().getRequest();
      const user = req.user; // assuming AuthGuard has already validated & attached
  
      if (!user) {
        throw new ForbiddenException('No user in request context');
      }
  
      const userId  = user.sub;
      const userDetail = await this.usersRepositoryService.findOneById(userId);
      if (userDetail.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
        throw new ForbiddenException(`Your account is ${user.status}.`);
      }
  
      return true;
    }
  }
  