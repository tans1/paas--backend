export const FrameworkMap = {
  react: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'react-scripts',
    buildCommand: 'npm run build',
    defaultBuildLocation: 'build', 
  },
  vite: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'vite',
    buildCommand: 'npm run build',
    defaultBuildDir: 'dist', 
  },
  vue: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: '@vue/cli-service',
    buildCommand: 'npm run build',
    startCommand: 'vue-cli-service serve',
    defaultBuildLocation: 'dist',
  },
  angular: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: '@angular/cli',
    buildCommand: 'npm run build',
    startCommand: 'ng serve',
    defaultBuildLocation: 'dist', 
  },
  next: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'next',
    buildCommand: 'npm run build',
    startCommand: 'next start',
    defaultBuildLocation: '.next', // Next.js uses ".next" as the default build folder
  },
  express: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: 'express',
    buildCommand: 'npm run build',
    startCommand: 'node index.js',
    defaultBuildLocation: 'dist', // Customizable, depends on build setup
  },
  nest: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: '@nestjs/core',
    buildCommand: 'npm run build',
    startCommand: 'nest start',
    defaultBuildLocation: 'dist', // NestJS uses "dist" as the default build folder
  },
  default: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: '',
    buildCommand: 'npm run build',
    startCommand: 'node index.js',
    defaultBuildLocation: 'dist', // Default fallback build location
  },
};
