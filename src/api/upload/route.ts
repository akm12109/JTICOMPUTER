
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const isNote = formData.get('isNote') === 'true';
  const account = formData.get('account') as 'main' | 'profile' | null;

  let cloudName, uploadPreset;

  if (account === 'profile') {
      cloudName = process.env.CLOUDINARY_CLOUD_NAME_PROFILE;
      uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET_PROFILE;
  } else {
      // Default to main account
      cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  }


  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: `Cloudinary configuration is missing for the '${account || 'main'}' account.` }, { status: 500 });
  }

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }
  
  // Check file size (max 50 MB for notes, 25MB for others)
  const MAX_FILE_SIZE_NOTE = 50 * 1024 * 1024;
  const MAX_FILE_SIZE_GENERAL = 25 * 1024 * 1024;

  if (isNote && file.size > MAX_FILE_SIZE_NOTE) {
    return NextResponse.json({ error: `File size exceeds 50 MB.` }, { status: 413 });
  }
  if (!isNote && file.size > MAX_FILE_SIZE_GENERAL) {
      return NextResponse.json({ error: 'File size exceeds 25 MB.' }, { status: 413 }); // 413 Payload Too Large
  }

  let resourceType = 'auto';
  let folder = 'general'; // Default folder

  if (isNote) {
    resourceType = 'raw';
    folder = 'notes'
  } else if (file.type.startsWith('video')) {
    resourceType = 'video';
    folder = 'gallery'
  } else if (file.type.startsWith('image')) {
    resourceType = 'image';
    folder = 'gallery'
  }


  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append('file', file);
  cloudinaryFormData.append('upload_preset', uploadPreset);
  cloudinaryFormData.append('folder', folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Upload to Cloudinary failed.';
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    return NextResponse.json({ secure_url: data.secure_url, public_id: data.public_id });
  } catch (error: any) {
    console.error('Upload to Cloudinary failed', error);
    return NextResponse.json({ error: 'Upload failed. Check server logs for details.' }, { status: 500 });
  }
}
