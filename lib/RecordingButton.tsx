'use client';

import { useState, useEffect } from 'react';
import { Room } from 'livekit-client';

interface RecordingButtonProps {
  room: Room;
  roomName: string;
}

export function RecordingButton({ room, roomName }: RecordingButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startRecording = async () => {
    if (!password) {
      setError('Please enter the recording password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          roomName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start recording');
      }

      // Start recording using LiveKit's recording capabilities
      // Note: This would typically be handled by the LiveKit server
      // For now, we'll simulate the recording start
      console.log('Recording started for room:', roomName);

      setIsRecording(true);
      setShowPasswordModal(false);
      setPassword('');
      console.log('Recording started successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      // Note: This would typically be handled by the LiveKit server
      // For now, we'll simulate the recording stop
      console.log('Recording stopped for room:', roomName);
      setIsRecording(false);
      console.log('Recording stopped successfully');
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      setShowPasswordModal(true);
      setError('');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startRecording();
  };

  if (showPasswordModal) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '0.5rem',
          maxWidth: '400px',
          width: '90%',
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#333' }}>
            Start Recording
          </h3>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Enter the recording password to start recording all participants:
          </p>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Recording password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginBottom: '1rem',
                border: '1px solid #ddd',
                borderRadius: '0.25rem',
                fontSize: '1rem',
              }}
              required
            />
            
            {error && (
              <div style={{
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '0.25rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: isLoading ? '#6c757d' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Starting...' : 'Start Recording'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggleRecording}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        padding: '0.75rem 1.5rem',
        backgroundColor: isRecording ? '#dc3545' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>
        {isRecording ? '⏹️' : '⏺️'}
      </span>
      {isRecording ? 'Stop Recording' : 'Start Recording'}
    </button>
  );
}
