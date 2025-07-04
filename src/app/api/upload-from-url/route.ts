import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ error: 'Cloudinary is not configured on the server.' }, { status: 500 });
  }

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided.' }, { status: 400 });
    }

    // Tell Cloudinary to fetch the file from the URL
    const result = await cloudinary.uploader.upload(url, {
      resource_type: "auto",
      folder: "jti-gallery",
    });

    return NextResponse.json({ secure_url: result.secure_url, public_id: result.public_id });
  } catch (error) {
    console.error('Upload from URL to Cloudinary failed:', error);
    return NextResponse.json({ error: 'Upload from URL failed. The URL might be invalid or inaccessible.' }, { status: 500 });
  }
}
