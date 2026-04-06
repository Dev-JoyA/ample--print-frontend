import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { filename } = await params;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001/api/v1';
  
  try {
    const response = await fetch(`${backendUrl}/receipts/${filename}`, {
      headers: {
        'Accept': 'image/*,application/pdf',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    const blob = await response.blob();
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    return new NextResponse(blob, { headers, status: 200 });
  } catch (error) {
    console.error('Receipt proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}