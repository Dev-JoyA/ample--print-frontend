import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { filename } = await params;
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4001/api/v1' ||
    'https://ample-printhub-backend-latest.onrender.com/api/v1';

  try {
    const response = await fetch(`${backendUrl}/attachments/download/${filename}`, {
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(blob, { headers, status: 200 });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
