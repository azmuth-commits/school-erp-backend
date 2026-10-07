import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsConfig, isS3Configured } from "../config/aws.js";
import { extensionForMime } from "../utils/file.util.js";
import type { UploadedFileMeta } from "../types/index.js";

const s3 = isS3Configured()
  ? new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    })
  : null;

export async function uploadFile(params: {
  folder: "report-cards" | "e-learning";
  buffer: Buffer;
  mimetype: string;
  originalName: string;
}): Promise<UploadedFileMeta> {
  const ext = extensionForMime(params.mimetype);
  const key = `${params.folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: awsConfig.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.mimetype,
      }),
    );
    return {
      key,
      url: `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
    };
  }

  const dest = path.join(process.cwd(), "uploads", key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, params.buffer);
  return { key, url: `/files/${key}` };
}

export async function deleteFile(key: string): Promise<void> {
  if (s3) {
    await s3.send(new DeleteObjectCommand({ Bucket: awsConfig.bucket, Key: key }));
    return;
  }
  const dest = path.join(process.cwd(), "uploads", key);
  await unlink(dest).catch(() => undefined);
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (s3) {
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: awsConfig.bucket, Key: key }),
      { expiresIn: 60 * 15 },
    );
  }
  return `/files/${key}`;
}
