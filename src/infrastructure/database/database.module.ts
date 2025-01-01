import { Module } from '@nestjs/common';
import { InterfacesModule } from './interfaces/interfaces.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { PrismaService } from './prisma-service/prisma-service.service';

@Module({
  imports: [InterfacesModule, RepositoriesModule],
  providers: [PrismaService]
})
export class DatabaseModule {}
