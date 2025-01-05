import { Module } from '@nestjs/common';
import { InterfacesModule } from './interfaces/interfaces.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { PrismaService } from './prisma/prisma-service/prisma-service.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [InterfacesModule, RepositoriesModule, PrismaModule],
  providers: [PrismaService],
})
export class DatabaseModule {}
