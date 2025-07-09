
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: 'Cloudinary configuration is missing. Check server environment variables.' }, { status: 500 });
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

  // We need to re-create the form data to add the upload preset
  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', file);
  cloudinaryFormData.append('upload_preset', uploadPreset);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      // Pass Cloudinary's error message to the client
      const errorMessage = data?.error?.message || 'Upload to Cloudinary failed.';
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ secure_url: data.secure_url, public_id: data.public_id });
  } catch (error: any) {
    console.error('Upload to Cloudinary failed', error);
    return NextResponse.json({ error: 'Upload failed. Check server logs for details.' }, { status: 500 });
  }
}
