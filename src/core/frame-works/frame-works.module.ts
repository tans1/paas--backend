import { Module } from '@nestjs/common';
import { ReactModule } from './react/react.module';
import { VueModule } from './vue/vue.module';
import { AngularModule } from './angular/angular.module';
import { NestJsModule } from './nestjs/nestjs.module';
import { DockerModule } from './Docker/docker.module';
import { NextJsModule } from './nextjs/nextjs.module';
import { CRAModule } from './create-react-app/react.module';
import { ViteModule } from './vite/vite.module';

@Module({
  imports: [
    ReactModule,
    VueModule,
    AngularModule,
    NestJsModule,
    DockerModule,
    NextJsModule,
    CRAModule,
    ViteModule,
  ],
})
export class FrameWorksModule {}
