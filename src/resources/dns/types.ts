export interface CloudflareResponse<T> {
  success: boolean;
  errors: any[];
  messages: any[];
  result: T;
}

// Interface for a Cloudflare Zone (simplified; add properties as needed)
export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  name_servers: string[];
}

// Interface for a Cloudflare DNS Record (simplified)
export interface CloudflareDNSRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
}
