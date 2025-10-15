import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { roomName } = await req.json();

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

    const existingEgresses = await egressClient.listEgress({ roomName });
    if (existingEgresses.length > 0 && existingEgresses.some((e) => e.status < 2)) {
      return new NextResponse('Meeting is already being recorded', { status: 409 });
    }

    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(process.cwd(), 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${roomName}.mp4`;
    const filepath = path.join(recordingsDir, filename);

    // For local storage, we'll use a simple file output
    // In a real implementation, you might want to use a different approach
    const fileOutput = new EncodedFileOutput({
      filepath: filename,
      output: {
        case: 's3',
        value: new S3Upload({
          endpoint: 'http://localhost:9000', // Local MinIO or similar
          accessKey: 'minioadmin',
          secret: 'minioadmin',
          region: 'us-east-1',
          bucket: 'recordings',
        }),
      },
    });

    await egressClient.startRoomCompositeEgress(
      roomName,
      {
        file: fileOutput,
      },
      {
        layout: 'speaker',
      },
    );

    // Save recording info to a local file
    const recordingInfo = {
      roomName,
      filename,
      filepath,
      startTime: new Date().toISOString(),
      status: 'recording'
    };

    const infoFile = path.join(recordingsDir, `${timestamp}-${roomName}-info.json`);
    fs.writeFileSync(infoFile, JSON.stringify(recordingInfo, null, 2));

    return NextResponse.json({ 
      message: 'Recording started successfully',
      filename,
      filepath: filepath
    });

  } catch (error) {
    console.error('Recording error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
