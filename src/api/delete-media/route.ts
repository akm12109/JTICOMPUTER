
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

function determineResourceType(publicId: string, resourceType: 'image' | 'video' | 'raw' | undefined): 'image' | 'video' | 'raw' {
  if (resourceType && ['image', 'video', 'raw'].includes(resourceType)) {
    return resourceType;
  }
  if (publicId.startsWith('notes/')) {
    return 'raw';
  }
  
  const extension = publicId.split('.').pop()?.toLowerCase();
  const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'mkv', 'webm'];
  
  if (extension && videoExtensions.includes(extension)) {
    return 'video';
  }
  
  return 'image';
}

export async function POST(request: Request) {
  try {
    const { publicId, account, resourceType: providedResourceType } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required.' }, { status: 400 });
    }

    let cloudName, apiKey, apiSecret;

    if (account === 'profile') {
        cloudName = process.env.CLOUDINARY_CLOUD_NAME_PROFILE;
        apiKey = process.env.CLOUDINARY_API_KEY_PROFILE;
        apiSecret = process.env.CLOUDINARY_API_SECRET_PROFILE;
    } else {
        cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        apiKey = process.env.CLOUDINARY_API_KEY;
        apiSecret = process.env.CLOUDINARY_API_SECRET;
    }

    if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json({ error: `Cloudinary API credentials for deletion on '${account || 'main'}' account are not configured.` }, { status: 500 });
    }
    
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
    });
    
    const resourceType = determineResourceType(publicId, providedResourceType);
    
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    
    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true, message: `Deletion successful for ${publicId}` });
    } else {
      throw new Error(result.result || 'Unknown error from Cloudinary');
    }
  } catch (error: any) {
    console.error('Failed to delete from Cloudinary:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete media.' }, { status: 500 });
  }
}
