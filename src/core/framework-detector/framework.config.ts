export type FrameworkKey =
  | 'React'
  | 'Vue'
  | 'Angular'
  | 'NestJS'
  | 'FastAPI'
  | 'Docker'
  | 'NextJs'
  | 'CreateReactApp'
  | 'Vite';

export interface FrameworkDefinition {
  file: string;
  name: string;
  dependencies?: string[];
  sort: number;
  settings?: {
    installCommand: {
      placeholder: string;
      value: string;
    };
    buildCommand: {
      placeholder: string;
      value: string;
    };
    runCommand: {
      value: string;
      placeholder: string;
    };
    outputDirectory: {
      placeholder: string;
      value: string;
    };
  };
}

export const FrameworkMap: Record<FrameworkKey, FrameworkDefinition> = {
  Docker: {
    name: 'Docker',
    file: 'Dockerfile',
    sort: 1,
    dependencies: [],
  },
  React: {
    name: 'React',
    file: 'package.json',
    sort: 10,
    dependencies: ['react'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: 'npm run build',
        value: 'npm run build',
      },
      runCommand: {
        value: 'npm run start',
        placeholder: 'npm run start',
      },
      outputDirectory: {
        placeholder: 'build',
        value: 'build',
      },
    },
  },
  CreateReactApp: {
    name: 'CreateReactApp',
    file: 'package.json',
    sort: 4,
    dependencies: ['react-scripts'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `react-scripts build`',
        value: 'npx react-scripts build',
      },
      runCommand: {
        placeholder: 'npm run start',
        value: 'react-scripts start',
      },
      outputDirectory: {
        placeholder: 'build',
        value: 'build',
      },
    },
  },
  Vite: {
    name: 'Vite',
    sort: 2,
    file: 'package.json',
    dependencies: ['vite'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `vite build`',
        value: 'npx vite build',
      },
      runCommand: {
        placeholder: 'npm run start',
        value: 'vite --port $PORT',
      },
      outputDirectory: {
        placeholder: 'dist',
        value: 'dist',
      },
    },
  },
  NextJs: {
    name: 'NextJs',
    file: 'package.json',
    sort: 3,
    dependencies: ['next'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `next build`',
        value: 'next build',
      },
      runCommand: {
        placeholder: 'next dev --port $PORT',
        value: 'next dev --port $PORT',
      },
      outputDirectory: {
        placeholder: 'Next.js default',
        value: '.next',
      },
    },
  },
  Vue: {
    name: 'Vue',
    file: 'package.json',
    sort: 5,
    dependencies: ['vue'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `vue-cli-service build`',
        value: 'npx vue-cli-service build',
      },
      runCommand: {
        placeholder: 'vue-cli-service serve',
        value: 'vue-cli-service serve --port $PORT',
      },
      outputDirectory: {
        placeholder: 'dist',
        value: 'dist',
      },
    },
  },
  Angular: {
    name: 'Angular',
    file: 'package.json',
    sort: 6,
    dependencies: ['@angular/core'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `ng build`',
        value: 'ng build',
      },
      runCommand: {
        placeholder: 'ng serve',
        value: 'ng serve --port $PORT',
      },
      outputDirectory: {
        placeholder: 'dist',
        value: 'dist',
      },
    },
  },
  NestJS: {
    name: 'NestJS',
    file: 'package.json',
    sort: 7,
    dependencies: ['@nestjs/core'],
    settings: {
      installCommand: {
        placeholder:
          '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
        value: 'npm install',
      },
      buildCommand: {
        placeholder: '`npm run build` or `nest build`',
        value: 'npx nest build',
      },
      runCommand: {
        placeholder: '`npm run start:dev` or `nest start --watch`',
        value: 'node',
      },
      outputDirectory: {
        placeholder: 'dist',
        value: 'dist',
      },
    },
  },

  FastAPI: {
    name: 'FastAPI',
    file: 'requirements.txt',
    sort: 8,
    dependencies: ['fastapi'],
    settings: {
      installCommand: {
        placeholder: '`pip install -r requirements.txt`',
        value: 'pip install -r requirements.txt',
      },
      buildCommand: {
        placeholder: '`(no build step required)`',
        value: '',
      },
      runCommand: {
        placeholder: '`uvicorn main:app --reload --port $PORT`',
        value: 'uvicorn main:app --reload --port $PORT',
      },
      outputDirectory: {
        placeholder: '`(no output directory)`',
        value: '',
      },
    },
  },
};
