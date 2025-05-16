export interface DeploymentUpdate {
    deploymentId: number;
    status: string;
    timestamp: string;
  }
  
export interface NewDeployment {
    deploymentId: number;
    branch: string;
    timestamp: string;
  }
  