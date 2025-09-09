import { Client } from 'minio';
import 'dotenv/config';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio12345',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'tms-files';

// Initialize bucket if it doesn't exist
export const initializeMinIO = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`✅ MinIO bucket '${BUCKET_NAME}' already exists`);
    }
  } catch (error) {
    console.error('❌ Error initializing MinIO:', error);
  }
};

// Upload file to MinIO
export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'uploads'
): Promise<{ path: string; url: string }> => {
  try {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    await minioClient.putObject(
      BUCKET_NAME,
      fileName,
      file.buffer,
      file.size,
      {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
      }
    );

    const fileUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;
    
    return {
      path: fileName,
      url: fileUrl,
    };
  } catch (error) {
    console.error('❌ Error uploading file to MinIO:', error);
    throw new Error('Failed to upload file');
  }
};

// Delete file from MinIO
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await minioClient.removeObject(BUCKET_NAME, filePath);
  } catch (error) {
    console.error('❌ Error deleting file from MinIO:', error);
    throw new Error('Failed to delete file');
  }
};

// Get file URL
export const getFileUrl = (filePath: string): string => {
  return `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${filePath}`;
};

// List files in a folder
export const listFiles = async (folder: string = ''): Promise<string[]> => {
  try {
    const objectsList: string[] = [];
    const stream = minioClient.listObjects(BUCKET_NAME, folder, true);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj.name) {
          objectsList.push(obj.name);
        }
      });
      
      stream.on('end', () => {
        resolve(objectsList);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    throw new Error('Failed to list files');
  }
};

export default minioClient;
















