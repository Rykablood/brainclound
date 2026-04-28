import { S3Client } from "@aws-sdk/client-s3";

// Используем сам класс S3Client как токен для инъекции
export const S3_CLIENT_TOKEN = S3Client;
