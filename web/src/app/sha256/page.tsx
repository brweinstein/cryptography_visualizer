"use client";
import React, { useState, useEffect } from 'react';
import { loadWasm, WasmExports, SHA256Visualization } from '../../lib/wasm';
import { Panel } from '../../components/Panel';
import { Navigation } from '../../components/Navigation';

export default function SHA256Page() {
  const [wasm, setWasm] = useState<WasmExports | null>(null);
  const [status, setStatus] = useState('Loading WASM...');
  
  // SHA-256 Parameters
  const [message, setMessage] = useState('Hello, World!');
  
  // Hash results
  const [hashResult, setHashResult] = useState<SHA256Visualization | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
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
      const result = wasm.sha256_visualize(message);
      setHashResult(result);
      setCurrentStep(0);
    } catch (err) {
      console.error('SHA-256 error:', err);
      setHashResult(null);
    }
  }, [wasm, message]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !hashResult) return;
    
    const interval = setInterval(() => {
      setCurrentStep(step => {
        if (step >= hashResult.steps.length - 1) {
          setIsPlaying(false);
          return hashResult.steps.length - 1;
        }
        return step + 1;
      });
    }, (1 - speed) * 2000 + 500);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, hashResult]);

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const currentStepData = hashResult?.steps[currentStep];
  const visibleSteps = hashResult?.steps.slice(0, currentStep + 1) || [];

  // Format a 32-bit number as a 32-bit binary string
  const formatBits32 = (value: number) => {
    const v = value >>> 0;
    return v.toString(2).padStart(32, '0');
  };

  // Format a 32-bit number as 8-hex-digit string
  const formatHex32 = (value: number) => {
    const v = value >>> 0;
    return v.toString(16).padStart(8, '0');
  };

  // Pretty print a word for the message schedule (hex + bits)
  const formatHash = (value: number) => {
    return `0x${formatHex32(value)} (${formatBits32(value)})`;
  };

  // Convert array of bytes to a continuous bit string
  const bytesToBits = (bytes: number[]) => {
    return bytes.map((b) => (b & 0xff).toString(2).padStart(8, '0')).join('');
  };

  const WorkingVariables = ({ step }: { step: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div className="space-y-2">
        <div>
          <span className="text-[var(--ui-muted)]">a:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.a)}
          </div>
        </div>
        <div>
          <span className="text-[var(--ui-muted)]">b:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.b)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-[var(--ui-muted)]">c:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.c)}
          </div>
        </div>
        <div>
          <span className="text-[var(--ui-muted)]">d:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.d)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-[var(--ui-muted)]">e:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.e)}
          </div>
        </div>
        <div>
          <span className="text-[var(--ui-muted)]">f:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.f)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-[var(--ui-muted)]">g:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.g)}
          </div>
        </div>
        <div>
          <span className="text-[var(--ui-muted)]">h:</span>
          <div className="font-mono text-xs bg-[var(--ui-surface-2)] p-1 rounded">
            {formatBits32(step.h)}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Navigation title="SHA-256 Hash Function" showBackButton />
      
      <div className="mb-6">
        <p className="text-sm text-[var(--ui-muted)]">Visualize SHA-256 cryptographic hash function step by step</p>
      </div>
      
      <div className="text-xs text-[var(--ui-muted)]">Status: {status}</div>

      {/* Input Panel */}
      <Panel title="Message Input" subtitle="Enter the message to hash">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm"
              rows={3}
              placeholder="Enter message to hash..."
            />
          </div>
          <div className="text-xs text-[var(--ui-muted)]">
            Message length: {message.length} characters ({message.length * 8} bits)
          </div>
        </div>
      </Panel>

      {/* Animation Controls */}
      {hashResult && (
        <Panel title="Hash Computation" subtitle="Step through SHA-256 compression rounds">
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
                Step {currentStep + 1} of {hashResult.steps.length}
              </div>
            </div>

            {/* Current Step Display */}
            {currentStepData && (
              <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-[var(--ui-text)]">
                    Step {currentStepData.step}: {currentStepData.description}
                  </h4>
                  <span className="text-xs bg-[var(--ui-accent)] text-white px-2 py-1 rounded">
                    Current
                  </span>
                </div>
                <div className="space-y-3">
                  <WorkingVariables step={currentStepData} />
                  {currentStepData.w && (
                    <div>
                      <span className="text-sm text-[var(--ui-muted)]">Message Schedule Word (W):</span>
                      <div className="font-mono text-sm mt-1 bg-[var(--ui-surface-2)] p-2 rounded">
                        {formatHash(currentStepData.w)}
                      </div>
                    </div>
                  )}
                  {currentStepData.k && (
                    <div>
                      <span className="text-sm text-[var(--ui-muted)]">Round Constant (K):</span>
                      <div className="font-mono text-sm mt-1 bg-[var(--ui-surface-2)] p-2 rounded">
                        {formatBits32(currentStepData.k)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Results Panel */}
      {hashResult && (
        <Panel title="Hash Result" subtitle="Final SHA-256 digest and message processing">
          <div className="space-y-4">
            <div>
              <span className="text-sm text-[var(--ui-muted)]">Original Message:</span>
              <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border">
                {message}
              </div>
            </div>
                <div>
                  <span className="text-sm text-[var(--ui-muted)]">SHA-256 Hash (bits):</span>
                  <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border text-[var(--ui-accent)] break-all leading-5">
                    {hashResult.hash.map((word: number) => formatBits32(word)).join('')}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-[var(--ui-muted)]">Padded Message (bits):</span>
                  <div className="font-mono text-sm mt-1 p-2 bg-[var(--ui-surface)] rounded border text-[var(--ui-accent)] break-all leading-5">
                    {bytesToBits(hashResult.padded_message)}
                  </div>
                </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[var(--ui-muted)]">Message Length:</span>
                <div className="font-mono text-sm">{message.length} chars</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Padded Length:</span>
                <div className="font-mono text-sm">{hashResult.padded_message.length} bytes</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Total Rounds:</span>
                <div className="font-mono text-sm">{hashResult.steps.length}</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Hash Length:</span>
                <div className="font-mono text-sm">256 bits</div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Steps History */}
      {hashResult && visibleSteps.length > 0 && (
        <Panel title="Compression Rounds" subtitle="Detailed view of SHA-256 compression function">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {visibleSteps.map((step: any, idx: number) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  idx === currentStep 
                    ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/5' 
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Step {step.step}: {step.description}</span>
                  {idx === currentStep && (
                    <span className="text-xs bg-[var(--ui-accent)] text-white px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
                  <div>
                    <div className="text-[var(--ui-muted)]">a:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.a).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">b:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.b).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">c:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.c).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">d:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.d).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">e:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.e).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">f:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.f).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">g:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.g).slice(0, 12)}...
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--ui-muted)]">h:</div>
                    <div className="font-mono bg-[var(--ui-surface-2)] p-1 rounded">
                      {formatBits32(step.h).slice(0, 12)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}