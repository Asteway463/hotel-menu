import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic liveness probe for the local server / deployment checks.
    return NextResponse.json(
      { status: 'ok', service: 'burger-house-menu', uptime: process.uptime() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Health check failed' },
      { status: 500 }
    );
  }
}
