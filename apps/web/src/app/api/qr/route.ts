import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getAuthContext, isAuthenticated } from '@/server/auth/request';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') ?? 'menu';

  const ctx = await getAuthContext();
  const restaurant = ctx.restaurantId
    ? await prisma.restaurant.findUnique({
        where: { id: ctx.restaurantId },
      })
    : null;

  let content: string;
  if (type === 'wifi') {
    const ssid = restaurant?.wifiSsid || process.env.WIFI_SSID || 'BurgerHouse';
    const password = restaurant?.wifiPassword || process.env.WIFI_PASSWORD || 'burgerhouse';
    content = `WIFI:T:WPA;S:${ssid};P:${password};;`;
  } else {
    const lanIp = process.env.LAN_IP || '192.168.1.50';
    content = `http://${lanIp}:3000/`;
  }

  const dataUrl = await QRCode.toDataURL(content, { margin: 2, width: 512 });

  if (type === 'wifi') {
    // Return the Wi-Fi pairing payload alongside the QR image.
    return NextResponse.json({
      type: 'wifi',
      content,
      qrDataUrl: dataUrl,
    });
  }

  const pngBuffer = await QRCode.toBuffer(content, { type: 'png', width: 512 });

  return new NextResponse(new Uint8Array(pngBuffer), {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'no-store',
    },
  });
}
