// src/deployment-utils/deployment-utils.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DeploymentUtilsService {
  /**
   * Build a unique deployed URL for a project.
   */
  getDeployedUrl(projectName: string): string {
    const randomString = Math.random().toString(36).substring(2, 8); // 6 chars
    return `${projectName}-${randomString}.${process.env.DOMAIN_NAME}`;
  }

  /**
   * Return the containerName of the most recent deployment, or null if none.
   */
  getLatestContainerName(
    deployments: { createdAt: Date; containerName?: string | null }[],
  ): string | null {
    if (!deployments?.length) return null;

    const latest = deployments.reduce((prev, curr) =>
      new Date(curr.createdAt) > new Date(prev.createdAt) ? curr : prev,
    );
    return latest.containerName ?? null;
  }

  /**
   * Return the imageName of the most recent deployment, or null if none.
   */
  getLatestImageName(
    deployments: { createdAt: Date; imageName?: string | null }[],
  ): string | null {
    if (!deployments?.length) return null;

    const latest = deployments.reduce((prev, curr) =>
      new Date(curr.createdAt) > new Date(prev.createdAt) ? curr : prev,
    );
    return latest.imageName ?? null;
  }

  getLatestDeployment(
    deployments: { createdAt: Date; containerName?: string | null }[],
  ): any {
    if (!deployments?.length) return null;

    const latest = deployments.reduce((prev, curr) =>
      new Date(curr.createdAt) > new Date(prev.createdAt) ? curr : prev,
    );
    return latest
  }
}
