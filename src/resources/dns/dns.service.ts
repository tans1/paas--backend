import { Injectable } from '@nestjs/common';
import axios from 'axios';
// import fs from 'fs/promises';
// import path from 'path';
// import { exec } from 'child_process';
// import { promisify } from 'util';
import { CloudflareDNSRecord, CloudflareZone } from './types';
import { exec } from 'child_process';
import * as fs from 'fs';

import { Client } from 'ssh2';
// import * as fs from 'fs';
// import * as path from 'path';

// const execAsync = promisify(exec);
import Cloudflare from 'cloudflare';

@Injectable()
export class DnsService {
  private cloudflareApi;
  constructor() {
    // console.log('Cloudflare email:', process.env.CLOUDFLARE_EMAIL);
    this.cloudflareApi = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'], // This is the default and can be omitted
      apiKey: process.env['CLOUDFLARE_API_KEY'], // This is the default and can be omitted
      // apiToken: process.env.CLOUDFLARE_API_TOKEN,
    });

    // console.log('Cloudflare API:', this.cloudflareApi);
    // process.env.CLOUDFLARE_EMAIL as string,
    //     'X-Auth-Key': process.env.CLOUDFLARE_API_KEY as string,
  }

  async createZone(domain: string): Promise<CloudflareZone | null> {
    try {
      const response = await this.cloudflareApi.zones.create({
        // account: {},
        name: domain,
        jump_start: true,
      });

      // console.log('Create zone response:', response);
      return response;
    } catch (error: any) {
      console.error(`Error creating zone for ${domain}:`, error);
      return null;
    }
  }

  async createDNSRecord(
    zoneId: string,
    domain: string,
    SERVER_IP: string,
  ): Promise<CloudflareDNSRecord | null> {
    try {
      const response = await this.cloudflareApi.dns.records.create({
        zone_id: zoneId,
        type: 'A',
        name: domain,
        content: SERVER_IP,
        ttl: 1,
        proxied: true,
      });
      return response;
    } catch (error: any) {
      console.error(
        `Error creating DNS record for ${domain}:`,
        error.response ? error.response.data : error.message,
      );
      return null;
    }
  }

  //   async updateNginxConfig(domain: string, port: number): Promise<void> {
  //     // Example: const localPath = '/home/yourusername/path/to/project/nginx/conf';
  //     const localPath: string = path.join(process.cwd(), 'nginx', 'conf');
  //     const filePath: string = path.join(localPath, `${domain}.conf`);

  //     const configText: string = `
  // server {
  //     listen 80;
  //     server_name ${domain};
  //     return 301 https://$host$request_uri;  # Redirect HTTP to HTTPS
  // }

  // server {
  //     listen 443 ssl;
  //     server_name ${domain};

  //     # SSL certificate and key paths.
  //     # When running your nginx container, mount your local "nginx/certificate" folder to "/etc/nginx/ssl".
  //      ssl_certificate /etc/nginx/ssl/${domain}.crt;
  //      ssl_certificate_key /etc/nginx/ssl/${domain}.key;

  //     location / {
  //         proxy_pass http://127.0.0.1:${port};
  //         proxy_set_header Host $host;
  //         proxy_set_header X-Real-IP $remote_addr;
  //         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  //         proxy_set_header X-Forwarded-Proto $scheme;
  //     }
  // }
  // `;

  //     try {
  //       await fs.writeFile(filePath, configText, 'utf8');
  //       console.log(`Nginx configuration updated for ${domain} at ${filePath}`);
  //     } catch (err) {
  //       console.error(`Error writing config file ${filePath}:`, err);
  //       throw err;
  //     }
  //   }

  async generateAndUploadCertificate(domain: string): Promise<void> {
    // Remove sudo since we're connected as root
    const certbotCmd = `certbot certonly --webroot -w /var/www/html -d ${domain} --non-interactive --agree-tos --email tofikabdu2002@gmail.com`;

    const conn = new Client();

    conn
      .on('ready', () => {
        console.log('SSH Connection ready for certificate generation');
        conn.exec(certbotCmd, (err, stream) => {
          if (err) throw err;

          let stdout = '';
          let stderr = '';

          stream
            .on('data', (data: Buffer) => {
              stdout += data.toString();
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            })
            .on('close', (code) => {
              if (code !== 0) {
                console.error(`Certbot failed: ${stderr}`);
                conn.end();
                return;
              }
              console.log(`Certbot succeeded: ${stdout}`);

              // Create directory if missing and copy certificates
              const copyCmd = `
                mkdir -p /etc/nginx/certificate/ && 
                cp /etc/letsencrypt/live/${domain}/fullchain.pem /etc/nginx/certificate/${domain}.crt && 
                cp /etc/letsencrypt/live/${domain}/privkey.pem /etc/nginx/certificate/${domain}.key
              `;

              conn.exec(copyCmd, (copyErr, copyStream) => {
                if (copyErr) throw copyErr;

                let copyStdout = '';
                let copyStderr = '';

                copyStream
                  .on('data', (data: Buffer) => {
                    copyStdout += data.toString();
                  })
                  .stderr.on('data', (data: Buffer) => {
                    copyStderr += data.toString();
                  })
                  .on('close', (copyCode) => {
                    if (copyCode !== 0) {
                      console.error(`Copy failed: ${copyStderr}`);
                    } else {
                      console.log('Certificates copied successfully');
                    }
                    conn.end();
                  });
              });
            });
        });
      })
      .connect({
        host: '95.182.115.218',
        port: 22,
        username: 'root',
        password: '50P6#wRPQ2s1EDlGi',
      });
  }

  async updateNginxConfigRemote(domain: string, port: number): Promise<void> {
    const configText: string = `
server {
    listen 80;
    server_name ${domain};
    return 301 https://$host$request_uri;  # Redirect HTTP to HTTPS
}

server {
    listen 443 ssl;
    server_name ${domain};

    # SSL certificate and key paths.
    ssl_certificate /etc/nginx/ssl/${domain}.crt;
    ssl_certificate_key /etc/nginx/ssl/${domain}.key;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

    // Create a new SSH client instance.
    const conn = new Client();

    conn
      .on('ready', () => {
        console.log('SSH Connection ready');
        // Open an SFTP session.
        conn.sftp((err, sftp) => {
          if (err) {
            console.error('Error opening SFTP session:', err);
            conn.end();
            return;
          }
          // Define the remote file path where you want to save the config.
          const remoteFilePath = `/etc/nginx/conf/${domain}.conf`;

          // Open the remote file for writing.
          sftp.open(remoteFilePath, 'w', (err, handle) => {
            if (err) {
              console.error('Error opening remote file:', err);
              conn.end();
              return;
            }
            // Write the file content.
            const buffer = Buffer.from(configText, 'utf8');
            sftp.write(handle, buffer, 0, buffer.length, 0, (err) => {
              if (err) {
                console.error('Error writing to remote file:', err);
              } else {
                console.log(
                  `Nginx configuration updated for ${domain} on remote server at ${remoteFilePath}`,
                );
              }
              // Close the file handle and end the connection.
              sftp.close(handle, (err) => {
                if (err) console.error('Error closing remote file:', err);
                conn.end();
              });
            });
          });
        });
      })
      .connect({
        host: '95.182.115.218', // Replace with your remote server's address.
        port: 22, // The SSH port (usually 22).
        username: 'root', // Your remote server username.
        password: '50P6#wRPQ2s1EDlGi', // Or use password: 'your-password'
      });
  }

  // async reloadNginxContainer(): Promise<void> {
  //   const containerName: string = 'nginx';
  //   const command: string = `docker exec ${containerName} nginx -s reload`;

  //   try {
  //     const { stdout, stderr } = await execAsync(command);
  //     if (stderr) {
  //       console.error(`Error reloading nginx container: ${stderr}`);
  //     } else {
  //       console.log(`Nginx container reloaded successfully: ${stdout}`);
  //     }
  //   } catch (err) {
  //     console.error('Error executing nginx reload command:', err);
  //     throw err;
  //   }
  // }

  async reloadNginxContainerRemote(): Promise<void> {
    const containerName: string = 'nginx';
    const command: string = `docker exec ${containerName} nginx -s reload`;

    const conn = new Client();

    conn
      .on('ready', () => {
        console.log('SSH connection ready for container reload');
        // Execute the command on the remote server.
        conn.exec(command, (err, stream) => {
          if (err) {
            console.error('Error executing remote command:', err);
            conn.end();
            return;
          }
          let stdout = '';
          let stderr = '';
          stream
            .on('close', (code, signal) => {
              if (stderr) {
                console.error(`Error reloading nginx container: ${stderr}`);
              } else {
                console.log(`Nginx container reloaded successfully: ${stdout}`);
              }
              conn.end();
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString();
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });
        });
      })
      .on('error', (err) => {
        console.error('SSH connection error:', err);
      })
      .connect({
        host: '95.182.115.218', // Replace with your remote server's address.
        port: 22, // SSH port (usually 22).
        username: 'root', // Your remote server username.
        password: '50P6#wRPQ2s1EDlGi', // Or use privateKey: fs.readFileSync('/path/to/private-key')
      });
  }
}
