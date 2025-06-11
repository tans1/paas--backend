export interface InvoiceType {
  id: string;
  amount: string;
  email: string;
  first_name: string;
}

export interface ContainerMetric {
  id: string;
  spec: {
    labels: Record<string, string>;
  };
  aliases: string[];
  stats: {
    timestamp: string;
    cpu: {
      usage: {
        total: number;
      };
    };
    memory: {
      usage: number;
    };
    network: {
      interfaces: {
        rx_bytes: number;
        tx_bytes: number;
      }[];
    };
  }[];
}

export interface MonthlyAggregate {
  containerName: string;
  // periodStart: Date;
  // periodEnd: Date;
  amount: number;
  // userId: number;
  totalCpuSecs: number;
  totalMemGbHrs: number;
  totalNetBytes: number;
}

export interface UsedResourceMetrics {
  totalCpuSecs: number;
  totalMemGbHrs: number;
  totalNetBytes: number;
}
