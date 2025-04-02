import { Module } from '@nestjs/common';
import { ReactModule } from './react/react.module';
import { VueModule } from './vue/vue.module';
import { AngularModule } from './angular/angular.module';
import { NestJsModule } from './nestjs/nestjs.module';

// TODO: This module needs to be updated
@Module({
  imports: [
    ReactModule,
    VueModule,
    AngularModule,
    NestJsModule,
  ],
})
export class FrameWorksModule {}
