import { NextResponse } from "next/server";
import { uploadToWalrus } from "@/lib/walrus/client";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToWalrus({
      fileBuffer: buffer,
      filename: file.name,
    });

    return NextResponse.json({
      blobId: result.blobId,
      size: result.size,
      filename: file.name,
      title,
      description,
      epochs: result.epochs,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to upload to Walrus",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
