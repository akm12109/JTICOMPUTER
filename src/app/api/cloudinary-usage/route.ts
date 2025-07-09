import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get('account'); // 'main' or 'profile'

  let cloudName, apiKey, apiSecret;

  if (account === 'profile') {
    cloudName = process.env.CLOUDINARY_CLOUD_NAME_PROFILE;
    apiKey = process.env.CLOUDINARY_API_KEY_PROFILE;
    apiSecret = process.env.CLOUDINARY_API_SECRET_PROFILE;
  } else {
    // Default to main account
    cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    apiKey = process.env.CLOUDINARY_API_KEY;
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  }

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: `Cloudinary API credentials for the '${account || 'main'}' account are not configured.` },
      { status: 500 }
    );
  }

  try {
    const result = await cloudinary.api.usage({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    const toGB = (bytes: number) => parseFloat((bytes / (1024 * 1024 * 1024)).toFixed(2));

    const usageData = {
      used: toGB(result.storage.usage),
      limit: 5, // Set a default limit of 5GB for display purposes
      unit: 'GB',
    };

    return NextResponse.json(usageData);
  } catch (error: any) {
    console.error(`Failed to fetch Cloudinary usage for ${account}:`, error);
    return NextResponse.json({ error: `Could not fetch Cloudinary usage data for the '${account}' account.` }, { status: 500 });
  }
}
