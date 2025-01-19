// frameworks.constants.ts
export const FrameworkMap = {
  react: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'react-scripts',
    buildCommand: 'npm run build -- --output-path=dist',
    startCommand: 'react-scripts start',
  },
  vue: {
    
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'vue',
    buildCommand: 'npm run build -- --dest=dist',
    startCommand: 'vue-cli-service serve',
  },
  angular: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: '@angular/core',
    buildCommand: 'npm run build -- --output-path=dist --verbose',
    startCommand: 'ng serve',
  },
  next: {
    type: 'frontend',
    dockerFile: 'Dockerfile.frontend.ejs',
    dependency: 'next',
    buildCommand: 'npm run build -- --dist-dir=dist',
    startCommand: 'next start',
  },
  express: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: 'express',
    buildCommand: 'npm run build',
    startCommand: 'node index.js',
  },
  nest: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: '@nestjs/core',
    buildCommand: 'npm run build -- --output-path=dist',
    startCommand: 'nest start',
  },
  default: {
    type: 'backend',
    dockerFile: 'Dockerfile.backend.ejs',
    dependency: '',
    buildCommand: 'npm run build',
    startCommand: 'node index.js',
  },
};
