export type FrameworkKey = "React" | "Vue" | "Angular" | "NestJS" | "Express" | "FastAPI" | "Docker"

export interface FrameworkDefinition {
  file: string;
  dependencies?: string[];
  name : string;
}

export const FrameworkMap: Record<FrameworkKey, FrameworkDefinition> = {
  Docker: { name: "Docker", file: "Dockerfile", dependencies: []},
  React: {name : "React", file: "package.json", dependencies: ["react"] },
  Vue: {name : "Vue", file: "package.json", dependencies: ["vue"] },
  Angular: {name : "Angular", file: "package.json", dependencies: ["@angular/core"] },
  NestJS: {name : "NestJS", file: "package.json", dependencies: ["@nestjs/core"] },
  Express: {name : "Express", file: "packagde.json", dependencies: ["express"] },
  FastAPI: {  name: "FastAPI", file: "requirements.txt", dependencies: ["fastapi"]}
};
