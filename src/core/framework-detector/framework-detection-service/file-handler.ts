import { FrameworkDefinition } from '../framework.config';

type FileHandler = (content: string, criteria: FrameworkDefinition) => boolean;
export const packageJsonHandler: FileHandler = (content, criteria) => {
  try {
    const pkg = JSON.parse(content);
    const deps = pkg.dependencies  ?? {};
    const devDeps = pkg.devDependencies ?? {};

    return criteria.dependencies.some((d) =>
      deps.hasOwnProperty(d) || devDeps.hasOwnProperty(d),
    );
  } catch (error) {
    console.error('Error parsing package.json:', error);
    return false;
  }
};


export const requirementsHandler: FileHandler = (content, criteria) => {
  const packages = content
    .split('\n')
    .map((line) => line.trim().split(/[=<>]/)[0]);
  return criteria.dependencies.some((dep) => packages.includes(dep));
};

export const dockerHandler: FileHandler = (content, criteria) => {
  if (criteria.dependencies.length === 0) {
    return true;
  }

  return criteria.dependencies.some((dep) => content.includes(dep));
};

export const FileHandlers = {
  'package.json': packageJsonHandler,
  'requirements.txt': requirementsHandler,
  Dockerfile: dockerHandler,
};
