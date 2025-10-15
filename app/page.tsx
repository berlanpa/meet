'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { randomString } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

function ConnectionForm() {
  const router = useRouter();
  const [participantName, setParticipantName] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Hackathon ready - all participants join the same room

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setError('');
    setIsConnecting(true);

    try {
      const roomName = 'geome-hackathon'; // Fixed room name for all participants
      
      // Generate token from backend
      const response = await fetch('/api/generate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          participantName,
          roomName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate token');
      }

      // Redirect to room with generated token
      router.push(`/custom/?liveKitUrl=wss://buildathon-bo96a3yr.livekit.cloud&token=${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
    }
  };

  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Enter your name"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '0.25rem',
            outline: 'none',
          }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="password"
          placeholder="Enter meeting password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '0.25rem',
            outline: 'none',
          }}
        />
      </div>

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

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ 
          paddingInline: '1.25rem', 
          width: '100%',
          opacity: isConnecting || !participantName.trim() || !password.trim() ? 0.6 : 1,
          cursor: isConnecting || !participantName.trim() || !password.trim() ? 'not-allowed' : 'pointer',
        }}
        className="lk-button"
        type="submit"
        disabled={isConnecting || !participantName.trim() || !password.trim()}
      >
        {isConnecting ? 'Connecting...' : 'Join Meeting'}
      </button>
    </form>
  );
}

export default function Page() {
  return (
    <>
      <main className={styles.main} data-lk-theme="default">
        <div className="header">
          <img src="/logotype.svg" alt="Geome" width="350" />
          <h2>
            Live beyond limits.
          </h2>
          <p style={{ 
            color: '#666', 
            fontSize: '0.9rem', 
            marginTop: '0.5rem',
            backgroundColor: '#f8f9fa',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #e9ecef'
          }}>
            📺 Screen sharing will be required to join this meeting
          </p>
        </div>
        <ConnectionForm />
      </main>
      <footer data-lk-theme="default">
        Geome, Inc 2025, for more information{' '}
        <a href="https://geomelab.com" rel="noopener">
          click here
        </a>
        .
      </footer>
    </>
  );
}
