
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url, account } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'No URL provided.' }, { status: 400 });
    }
    
    let cloudName, uploadPreset;

    if (account === 'profile') {
        cloudName = process.env.CLOUDINARY_CLOUD_NAME_PROFILE;
        uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET_PROFILE;
    } else {
        cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    }

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: `Cloudinary configuration is missing for the '${account || 'main'}' account.` }, { status: 500 });
    }

    // For URL uploads, Cloudinary can auto-detect resource type, but we default to image.
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: url,
        upload_preset: uploadPreset,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data?.error?.message || 'Upload from URL to Cloudinary failed.';
        return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ secure_url: data.secure_url, public_id: data.public_id });
  } catch (error: any) {
    console.error('Upload from URL to Cloudinary failed:', error);
    return NextResponse.json({ error: 'Upload from URL failed. The URL might be invalid or inaccessible.' }, { status: 500 });
  }
}

    