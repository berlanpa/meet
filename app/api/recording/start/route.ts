import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const { password, roomName } = await request.json();

    // Check password
    if (password !== 'johnjohn') {
      return NextResponse.json(
        { error: 'Invalid recording password' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      );
    }

    // Generate recording token with special permissions
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: 'recorder',
        ttl: '24h',
      }
    );

    // Add recording grants
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canPublishData: false,
      canSubscribe: true,
      roomRecord: true,
      roomAdmin: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      roomName,
      message: 'Recording token generated successfully'
    });

  } catch (error) {
    console.error('Error generating recording token:', error);
    return NextResponse.json(
      { error: 'Failed to generate recording token' },
      { status: 500 }
    );
  }
}
