import { Module } from '@nestjs/common';
import { PythonService } from './python.service';
import { AlsModule } from '@/utils/als/als.module';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { PythonDockerfileService } from './python-docker-config/python-dockerfile.service';
import { PythonDockerIgnoreFileService } from './python-docker-config/python-dockerignorefile.service';
import { PythonScannerService } from './python-scanner/python-scanner.service';

@Module({
  providers: [
    PythonService,
    PythonDockerfileService,
    PythonDockerIgnoreFileService,
    PythonScannerService,
  ],
  imports: [AlsModule, InterfacesModule],
})
export class PythonModule {}
