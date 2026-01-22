import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  private version: string;
  private timestamp: Date;

  constructor() {
    this.loadVersion();
  }
  private loadVersion() {
    try {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const versionParts = packageJson.version.split('-');

      this.version = versionParts[0]; // The version without the timestamp
      this.timestamp = new Date(); // The timestamp part in ISO format
    } catch (error) {
      console.error('Failed to load version from package.json:', error);
    }
  }

  getVersion(): string {
    // Ensure timestamp is correctly formatted in ISO 8601
    return `Version: ${this.version}, Last Updated: ${this.timestamp}`;
  }
}
