import { EgressClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomName = searchParams.get('roomName');

    if (!roomName) {
      return new NextResponse('Missing roomName parameter', { status: 400 });
    }

    const {
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      LIVEKIT_URL,
    } = process.env;

    const hostURL = new URL(LIVEKIT_URL!);
    hostURL.protocol = 'https:';

    const egressClient = new EgressClient(hostURL.origin, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    // List all active egresses for this room
    const existingEgresses = await egressClient.listEgress({ roomName });
    
    if (existingEgresses.length === 0) {
      return new NextResponse('No active recordings found for this room', { status: 404 });
    }

    // Stop all active recordings for this room
    const stopPromises = existingEgresses
      .filter(egress => egress.status < 2) // Only stop active recordings (status < 2 means active)
      .map(egress => egressClient.stopEgress(egress.egressId));

    if (stopPromises.length === 0) {
      return new NextResponse('No active recordings to stop', { status: 404 });
    }

    await Promise.all(stopPromises);

    return NextResponse.json({ 
      message: 'Recording stopped successfully',
      roomName,
      stoppedCount: stopPromises.length
    });

  } catch (error) {
    console.error('Stop recording error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}