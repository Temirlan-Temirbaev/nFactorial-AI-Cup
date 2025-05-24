import { Injectable, Logger } from '@nestjs/common';
import { Storage, Bucket } from '@google-cloud/storage';

export interface UploadOptions {
  destination?: string;
  metadata?: Record<string, any>;
  makePublic?: boolean;
}

export interface FileInfo {
  name: string;
  bucket: string;
  size: number;
  timeCreated: string;
  updated: string;
  metadata?: Record<string, any>;
  publicUrl?: string;
}

@Injectable()
export class GoogleCloudStorageService {
  private readonly logger = new Logger(GoogleCloudStorageService.name);
  private storage: Storage;
  private bucket: Bucket;

  constructor() {
    this.storage = new Storage({
      keyFilename: './google-key.json',
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
    
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      throw new Error('BUCKET_NAME environment variable is required');
    }
    
    this.bucket = this.storage.bucket(bucketName);
  }

  /**
   * Upload a file to Google Cloud Storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<FileInfo> {
    try {
      const file = this.bucket.file(options.destination || fileName);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: 'application/octet-stream',
          ...options.metadata,
        },
        resumable: false,
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          this.logger.error(`Upload failed: ${error.message}`);
          reject(error);
        });

        stream.on('finish', async () => {
          try {
            if (options.makePublic) {
              await file.makePublic();
            }

            const fileInfo = await this.getFileInfo(file.name);
            this.logger.log(`File uploaded successfully: ${file.name}`);
            resolve(fileInfo);
          } catch (error) {
            reject(error);
          }
        });

        stream.end(fileBuffer);
      });
    } catch (error) {
      this.logger.error(`Upload error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const file = this.bucket.file(fileName);
      await file.delete();
      
      this.logger.log(`File deleted: ${fileName}`);
    } catch (error) {
      this.logger.error(`Delete error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const file = this.bucket.file(fileName);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      this.logger.error(`File exists check error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileName: string): Promise<FileInfo> {
    try {
      const file = this.bucket.file(fileName);
      const [metadata] = await file.getMetadata();
      
      return {
        name: metadata.name,
        bucket: metadata.bucket,
        size: Number(metadata.size),
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        metadata: metadata.metadata,
        publicUrl: `https://storage.googleapis.com/${metadata.bucket}/${metadata.name}`,
      };
    } catch (error) {
      this.logger.error(`Get file info error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async generateSignedUrl(
    fileName: string,
    action: 'read' | 'write' | 'delete' = 'read',
    expiresIn: number = 60 * 60 * 1000 // 1 hour in milliseconds
  ): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const expires = new Date(Date.now() + expiresIn);
      
      const [signedUrl] = await file.getSignedUrl({
        action,
        expires,
      });

      this.logger.log(`Generated signed URL for: ${fileName}`);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Generate signed URL error: ${error.message}`);
      throw error;
    }
  }
} 