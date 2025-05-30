import { FrameworkDefinition } from '../framework.config';
import { parse } from '@iarna/toml';

type FileHandler = (content: string, criteria: FrameworkDefinition) => boolean;

export const packageJsonHandler: FileHandler = (content, criteria) => {
  try {
    const pkg = JSON.parse(content);
    const deps = pkg.dependencies ?? {};
    const devDeps = pkg.devDependencies ?? {};

    return criteria.dependencies.some(
      (d) => deps.hasOwnProperty(d) || devDeps.hasOwnProperty(d),
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

export const pyprojectHandler: FileHandler = (content, criteria) => {
  try {
    // Locate the [tool.poetry.dependencies] section
    const depsSectionMatch = content.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(\n\s*\[|\Z)/);
    if (!depsSectionMatch) return false;

    const depsSection = depsSectionMatch[1];
    // Extract package names from each line in the section
    const packages = depsSection
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')) // Ignore comments and empty lines
      .map(line => line.split('=')[0].trim()); // Get the package name before '='

    return criteria.dependencies.some(dep => packages.includes(dep));
  } catch (error) {
    console.error('Error parsing pyproject.toml:', error);
    return false;
  }
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
  'pyproject.toml': pyprojectHandler,
  Dockerfile: dockerHandler,
};
