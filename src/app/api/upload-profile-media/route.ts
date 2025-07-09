
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME_PROFILE;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET_PROFILE;
  
  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: 'Profile media Cloudinary configuration is missing.' }, { status: 500 });
  }

  try {
    const { file } = await request.json();

    if (!file) {
      return NextResponse.json({ error: 'No file data provided.' }, { status: 400 });
    }

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: file, // This will be the data URI
        upload_preset: uploadPreset,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data?.error?.message || 'Upload from data URI to Cloudinary failed.';
        return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ secure_url: data.secure_url, public_id: data.public_id });
  } catch (error: any) {
    console.error('Upload from data URI to Cloudinary failed:', error);
    return NextResponse.json({ error: 'Upload from data URI failed.' }, { status: 500 });
  }
}
