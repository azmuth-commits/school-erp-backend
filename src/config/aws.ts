export const awsConfig = {
  region: process.env.AWS_REGION ?? "ap-south-1",
  bucket: process.env.AWS_S3_BUCKET ?? "school-erp-files",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
};

export function isS3Configured(): boolean {
  return Boolean(awsConfig.accessKeyId && awsConfig.secretAccessKey && awsConfig.bucket);
}
