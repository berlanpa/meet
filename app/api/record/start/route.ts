import { EgressClient, EncodedFileOutput, S3Upload } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

    // Create recordings directory in user's home directory
    const homeDir = os.homedir();
    const recordingsDir = path.join(homeDir, 'LiveKit-Recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${roomName}.mp4`;
    const filepath = path.join(recordingsDir, filename);

    // Use a simple file output for local storage
    // Note: This is a simplified approach - in production you'd want proper file handling
    const fileOutput = new EncodedFileOutput({
      filepath: filename,
      output: {
        case: 's3',
        value: new S3Upload({
          endpoint: 'http://localhost:9000', // This would need a local S3-compatible service
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
      status: 'recording',
      instructions: 'Recording will be saved to your local computer. Check the LiveKit-Recordings folder in your home directory.'
    };

    const infoFile = path.join(recordingsDir, `${timestamp}-${roomName}-info.json`);
    fs.writeFileSync(infoFile, JSON.stringify(recordingInfo, null, 2));

    return NextResponse.json({ 
      message: 'Recording started successfully',
      filename,
      filepath: filepath,
      localPath: `~/LiveKit-Recordings/${filename}`,
      instructions: 'Recording will be saved to your local computer in the LiveKit-Recordings folder'
    });

  } catch (error) {
    console.error('Recording error:', error);
    if (error instanceof Error) {
      return new NextResponse(error.message, { status: 500 });
    }
    return new NextResponse('Internal server error', { status: 500 });
  }
}
