"use client";
import React, { useState, useEffect } from 'react';
import { loadWasm, WasmExports, AESVisualization } from '../../lib/wasm';
import { Panel } from '../../components/Panel';
import { Navigation } from '../../components/Navigation';

export default function AESPage() {
  const [wasm, setWasm] = useState<WasmExports | null>(null);
  const [status, setStatus] = useState('Loading WASM...');
  
  // AES Parameters
  const [plaintext, setPlaintext] = useState('00112233445566778899aabbccddeeff');
  const [key, setKey] = useState('000102030405060708090a0b0c0d0e0f');
  
  // Encryption results
  const [encryption, setEncryption] = useState<AESVisualization | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  
  // Animation
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.5);

  useEffect(() => {
    let mounted = true;
    loadWasm()
      .then((mod) => { 
        if (!mounted) return; 
        setWasm(mod); 
        setStatus('Ready'); 
      })
      .catch((err) => { 
        console.error(err); 
        setStatus('Using JS stub.'); 
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!wasm) return;
    try {
      const result = wasm.aes_encrypt_visualize(plaintext, key);
      setEncryption(result);
      setCurrentRound(0);
    } catch (err) {
      console.error('AES encryption error:', err);
      setEncryption(null);
    }
  }, [wasm, plaintext, key]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !encryption) return;
    
    const interval = setInterval(() => {
      setCurrentRound(round => {
        if (round >= encryption.rounds.length - 1) {
          setIsPlaying(false);
          return encryption.rounds.length - 1;
        }
        return round + 1;
      });
    }, (1 - speed) * 2000 + 500);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, encryption]);

  const generateRandomData = () => {
    const randomHex = (bytes: number) => {
      return Array.from({length: bytes}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    };
    setPlaintext(randomHex(16));
    setKey(randomHex(16));
  };

  const resetAnimation = () => {
    setCurrentRound(0);
    setIsPlaying(false);
  };

  const currentRoundData = encryption?.rounds[currentRound];
  const visibleRounds = encryption?.rounds.slice(0, currentRound + 1) || [];

  const StateMatrix = ({ state, title, highlight = false }: { state: number[][], title: string, highlight?: boolean }) => {
    return (
      <div className={`border rounded-lg p-3 ${highlight ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/5' : 'border-[var(--ui-border)]'}`}>
        <h4 className="text-sm font-medium mb-2 text-[var(--ui-text)]">{title}</h4>
        <div className="grid grid-cols-4 gap-1 text-xs font-mono">
          {state.map((row, i) => 
            row.map((byte, j) => (
              <div key={`${i}-${j}`} className="bg-[var(--ui-surface-2)] p-1 text-center rounded">
                {byte.toString(16).padStart(2, '0')}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Navigation title="AES Encryption" showBackButton />
      
      <div className="mb-6">
        <p className="text-sm text-[var(--ui-muted)]">Visualize AES-128 encryption round by round</p>
      </div>
      
      <div className="text-xs text-[var(--ui-muted)]">Status: {status}</div>

      {/* Input Panel */}
      <Panel title="Input Data" subtitle="Set the plaintext and key for AES encryption">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
              Plaintext (32 hex characters)
            </label>
            <input
              type="text"
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              placeholder="00112233445566778899aabbccddeeff"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
              Key (32 hex characters)
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              placeholder="000102030405060708090a0b0c0d0e0f"
            />
          </div>
          <button
            onClick={generateRandomData}
            className="px-4 py-2 bg-[var(--ui-accent)] text-white rounded-md text-sm hover:bg-[var(--ui-accent)]/90"
          >
            Generate Random Data
          </button>
        </div>
      </Panel>

      {/* Animation Controls */}
      {encryption && (
        <Panel title="Round Visualization" subtitle="Step through AES encryption rounds">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isPlaying
                    ? 'bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent)]/90'
                    : 'bg-[var(--ui-surface-2)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-3)]'
                }`}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button
                onClick={resetAnimation}
                className="px-4 py-2 bg-[var(--ui-surface-2)] text-[var(--ui-muted)] rounded-md text-sm hover:bg-[var(--ui-surface-3)]"
              >
                Reset
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--ui-muted)]">Speed</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-24"
                />
              </div>
              
              <div className="text-sm text-[var(--ui-muted)]">
                Round {currentRound + 1} of {encryption.rounds.length}
              </div>
            </div>

            {/* Round Selector */}
            <div className="flex gap-2 flex-wrap">
              {encryption.rounds.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentRound(idx)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    idx === currentRound
                      ? 'bg-[var(--ui-accent)] text-white'
                      : 'bg-[var(--ui-surface-2)] text-[var(--ui-muted)] hover:bg-[var(--ui-surface-3)]'
                  }`}
                >
                  {idx === 0 ? 'Initial' : `Round ${idx}`}
                </button>
              ))}
            </div>

            {/* Current Round Display */}
            {currentRoundData && (
              <div className="space-y-4">
                <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
                  <h4 className="font-medium mb-2">Round {currentRoundData.round}: {currentRoundData.step}</h4>
                  <p className="text-sm text-[var(--ui-muted)] mb-3">{currentRoundData.description}</p>
                  <StateMatrix 
                    state={currentRoundData.state} 
                    title="Current State" 
                    highlight
                  />
                  {currentRoundData.intermediate_values.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-2">Intermediate Values:</h5>
                      <div className="space-y-1">
                        {currentRoundData.intermediate_values.map((value, idx) => (
                          <div key={idx} className="text-xs font-mono bg-[var(--ui-surface-2)] p-2 rounded">
                            {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Final Result */}
      {encryption && (
        <Panel title="Encryption Result" subtitle="Final ciphertext and key schedule">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-[var(--ui-muted)]">Plaintext:</span>
              <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border">
                {plaintext}
              </div>
            </div>
            <div>
              <span className="text-sm text-[var(--ui-muted)]">Ciphertext:</span>
              <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border text-[var(--ui-accent)]">
                {encryption.ciphertext.map((byte: number) => byte.toString(16).padStart(2, '0')).join('')}
              </div>
            </div>
            <div>
              <span className="text-sm text-[var(--ui-muted)]">Original Key:</span>
              <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border">
                {encryption.key.map((byte: number) => byte.toString(16).padStart(2, '0')).join('')}
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Round Details */}
      {encryption && visibleRounds.length > 0 && (
        <Panel title="Round History" subtitle="Detailed view of all completed rounds">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {visibleRounds.map((round, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border transition-all ${
                  idx === currentRound 
                    ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/5' 
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">
                    Round {round.round}: {round.step}
                  </h4>
                  {idx === currentRound && (
                    <span className="text-xs bg-[var(--ui-accent)] text-white px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--ui-muted)] mb-2">
                  {round.description}
                </div>
                <StateMatrix state={round.state} title="State" />
                {round.intermediate_values.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-[var(--ui-muted)] mb-1">Intermediate Values:</div>
                    {round.intermediate_values.slice(0, 3).map((value, valueIdx) => (
                      <div key={valueIdx} className="text-xs font-mono bg-[var(--ui-surface-2)] p-1 rounded mb-1">
                        {value.length > 50 ? `${value.slice(0, 50)}...` : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}