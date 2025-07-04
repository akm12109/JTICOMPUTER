import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Make sure your Cloudinary environment variables are set in .env.local
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to convert a readable stream to a buffer
async function streamToBuffer(readable: ReadableStream<Uint8Array>): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = readable.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        if (value) {
            chunks.push(value);
        }
    }
    return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  // Check for Cloudinary configuration
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  // Check file size (max 25 MB)
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 25 MB.' }, { status: 413 }); // 413 Payload Too Large
  }

  try {
    const fileBuffer = await streamToBuffer(file.stream());

    const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ 
            resource_type: "auto", // Automatically detect if it's an image or video
            folder: "jti-gallery" // Optional: specify a folder in Cloudinary
        }, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        });

        const readable = new Readable();
        readable._read = () => {};
        readable.push(fileBuffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
    
    // Return the secure URL and public ID from Cloudinary
    return NextResponse.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Upload to Cloudinary failed', error);
    return NextResponse.json({ error: 'Upload failed. Check server logs for details.' }, { status: 500 });
  }
}
