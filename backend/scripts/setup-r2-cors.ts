#!/usr/bin/env bun

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const corsConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        // Add your production domain here when deploying
        // "https://yourdomain.com"
      ],
      // Removed POST - only allow GET, PUT, HEAD for security
      AllowedMethods: ["GET", "PUT", "HEAD"],
      // Restricted headers - only allow necessary headers
      AllowedHeaders: [
        "Content-Type",
        "Content-Length",
        "x-amz-acl",
        "x-amz-meta-*",
      ],
      ExposeHeaders: ["ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

async function setupCORS() {
  try {
    const command = new PutBucketCorsCommand({
      Bucket: process.env.R2_BUCKET_NAME || "datasets",
      CORSConfiguration: corsConfiguration,
    });

    await r2Client.send(command);
    console.log("✅ CORS configuration applied successfully!");
  } catch (error) {
    console.error("❌ Failed to apply CORS:", error);
    process.exit(1);
  }
}

setupCORS();
