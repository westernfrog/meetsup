import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (!image) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const serverUploadUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/upload`;

    const serverResponse = await fetch(serverUploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!serverResponse.ok) {
      const errorData = await serverResponse.json();
      return NextResponse.json({ error: errorData.error || 'Failed to upload image to server' }, { status: serverResponse.status });
    }

    const data = await serverResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in upload API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
