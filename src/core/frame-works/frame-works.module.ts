import { Module } from '@nestjs/common';
import { NodeModule } from './node/node.module';
import { GoModule } from './go/go.module';
import { PythonModule } from './python/python.module';
import { NextModule } from './next/next.module';
import { NuxtModule } from './nuxt/nuxt.module';

@Module({
  imports: [NodeModule, GoModule, PythonModule, NextModule, NuxtModule]
})
export class FrameWorksModule {}
