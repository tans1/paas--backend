import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

@Injectable()
export class NextJsProjectScannerService {
  private readonly logger = new Logger(NextJsProjectScannerService.name);

  constructor() {}

  async scan(payload: any): Promise<{
    projectPath: string;
    nodeVersion: string;
    nextConfig: {
      output: 'standalone' | 'export' | null;
      useAppRouter: boolean;
      hasServerComponents: boolean;
    };
  }> {
    const { projectPath, configFile = 'package.json' } = payload;
    const packageJsonPath = path.join(projectPath, configFile);
    let packageJson: any;
    let nextConfig: any = {};
    let useAppRouter = false;
    let outputMode: 'standalone' | 'export' | null = null;

    try {
      // Read next.config.js
      const nextConfigPath = await this.findNextConfig(projectPath);
      if (nextConfigPath) {
        const configContent = await fs.promises.readFile(
          nextConfigPath,
          'utf-8',
        );
        // nextConfig = await this.parseNextConfig(configContent, nextConfigPath);
        // outputMode = nextConfig.output || null;
      }

      // Detect App Router (v13+ feature)
      useAppRouter = await this.detectAppRouter(projectPath);

      // Detect server components
      const hasServerComponents =
        await this.detectServerComponents(projectPath);

      return {
        projectPath,
        nodeVersion: packageJson.engines?.node || '18',
        nextConfig: {
          output: outputMode,
          useAppRouter,
          hasServerComponents,
        },
      };
    } catch (err: any) {
      this.logger.error(`Next.js project scan failed: ${err.message}`);
      throw new Error(`Next.js validation failed: ${err.message}`);
    }
  }

  private async findNextConfig(projectPath: string): Promise<string | null> {
    const configNames = [
      'next.config.mjs',
      'next.config.js',
      'next.config.ts',
      'next.config.cjs',
    ];

    for (const name of configNames) {
      const configPath = path.join(projectPath, name);
      if (fs.existsSync(configPath)) return configPath;
    }
    return null;
  }

  // private async parseNextConfig(
  //   configContent: string,
  //   configPath: string,
  // ): Promise<Record<string, any>> {
  //   try {
  //     const isTypeScript = configPath.endsWith('.ts');
  //     const transpiled = isTypeScript
  //       ? transpile(configContent, { module: ts.ModuleKind.CommonJS })
  //       : configContent.replace(/export default/g, 'module.exports =');

  //     const tempFile = `${tmpdir()}/next-config-${Date.now()}.cjs`;
  //     writeFileSync(tempFile, transpiled);

  //     const url = pathToFileURL(tempFile).href;
  //     const config = await import(/* @vite-ignore */ url);

  //     // Clean up temp file
  //     try {
  //       fs.unlinkSync(tempFile);
  //     } catch (err) {
  //       this.logger.warn(`Failed to delete temp file: ${err.message}`);
  //     }

  //     return isTypeScript ? config.default || config : config;
  //   } catch (err) {
  //     this.logger.warn(`Failed to parse next.config.js: ${err.message}`);
  //     return {};
  //   }
  // }

  private async detectAppRouter(projectPath: string): Promise<boolean> {
    const appDir = path.join(projectPath, 'app');
    const srcAppDir = path.join(projectPath, 'src', 'app');

    return fs.existsSync(appDir) || fs.existsSync(srcAppDir);
  }

  private async detectServerComponents(projectPath: string): Promise<boolean> {
    const serverComponentPatterns = [
      path.join(projectPath, '**', 'page.server.tsx'),
      path.join(projectPath, '**', 'layout.server.tsx'),
      path.join(projectPath, '**', '*.server.tsx'),
    ];

    for (const pattern of serverComponentPatterns) {
      const files = await glob(pattern);
      if (files.length > 0) return true;
    }
    return false;
  }
}
