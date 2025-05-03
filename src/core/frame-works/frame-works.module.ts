import { Module } from '@nestjs/common';
import { ReactModule } from './react/react.module';
import { VueModule } from './vue/vue.module';
import { AngularModule } from './angular/angular.module';
import { NestJsModule } from './nestjs/nestjs.module';
import { DockerModule } from './Docker/docker.module';

@Module({
  imports: [
    ReactModule,
    VueModule,
    AngularModule,
    NestJsModule,
    DockerModule
  ],
})
export class FrameWorksModule {}
