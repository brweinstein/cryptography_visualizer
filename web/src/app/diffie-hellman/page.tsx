"use client";
import React, { useState, useEffect } from 'react';
import { loadWasm, WasmExports, DiffieHellmanExchange } from '../../lib/wasm';
import { Panel } from '../../components/Panel';
import { Navigation } from '../../components/Navigation';

export default function DiffieHellmanPage() {
  const [wasm, setWasm] = useState<WasmExports | null>(null);
  const [status, setStatus] = useState('Loading WASM...');
  
  // DH Parameters
  const [p, setP] = useState('23');
  const [g, setG] = useState('5');
  const [alicePrivate, setAlicePrivate] = useState('6');
  const [bobPrivate, setBobPrivate] = useState('15');
  
  // Exchange results
  const [exchange, setExchange] = useState<DiffieHellmanExchange | null>(null);
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
      const result = wasm.dh_exchange(p, g, alicePrivate, bobPrivate);
      setExchange(result);
      setCurrentStep(0);
    } catch (err) {
      console.error('DH exchange error:', err);
      setExchange(null);
    }
  }, [wasm, p, g, alicePrivate, bobPrivate]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !exchange) return;
    
    const interval = setInterval(() => {
      setCurrentStep(step => {
        if (step >= exchange.steps.length - 1) {
          setIsPlaying(false);
          return exchange.steps.length - 1;
        }
        return step + 1;
      });
    }, (1 - speed) * 2000 + 500); // 500ms to 2.5s delay
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, exchange]);

  const generateParameters = () => {
    if (!wasm) return;
    try {
      const params = wasm.generate_dh_params(16); // Small bit size for demo
      setP(params.p);
      setG(params.g);
    } catch (err) {
      console.error('Parameter generation error:', err);
    }
  };

  const generatePrivateKeys = () => {
    const alice = Math.floor(Math.random() * 20) + 1;
    const bob = Math.floor(Math.random() * 20) + 1;
    setAlicePrivate(alice.toString());
    setBobPrivate(bob.toString());
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const currentStepData = exchange?.steps[currentStep];
  const visibleSteps = exchange?.steps.slice(0, currentStep + 1) || [];

  return (
    <div className="space-y-6">
      <Navigation title="Diffie-Hellman Key Exchange" showBackButton />
      
      <div className="mb-6">
        <p className="text-sm text-[var(--ui-muted)]">Visualize the Diffie-Hellman key exchange protocol</p>
      </div>
      
      <div className="text-xs text-[var(--ui-muted)]">Status: {status}</div>

      {/* Parameters Panel */}
      <Panel title="Parameters" subtitle="Set the public parameters and private keys">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <h3 className="font-medium text-[var(--ui-text)]">Public Parameters</h3>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Prime p (modulus)
              </label>
              <input
                type="text"
                value={p}
                onChange={(e) => setP(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Generator g
              </label>
              <input
                type="text"
                value={g}
                onChange={(e) => setG(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <button
              onClick={generateParameters}
              className="px-4 py-2 bg-[var(--ui-accent)] text-white rounded-md text-sm hover:bg-[var(--ui-accent)]/90"
            >
              Generate Parameters
            </button>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium text-[var(--ui-text)]">Private Keys</h3>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Alice's private key (a)
              </label>
              <input
                type="text"
                value={alicePrivate}
                onChange={(e) => setAlicePrivate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Bob's private key (b)
              </label>
              <input
                type="text"
                value={bobPrivate}
                onChange={(e) => setBobPrivate(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <button
              onClick={generatePrivateKeys}
              className="px-4 py-2 bg-[var(--ui-positive)] text-white rounded-md text-sm hover:bg-[var(--ui-positive)]/90"
            >
              Generate Private Keys
            </button>
          </div>
        </div>
      </Panel>

      {/* Animation Controls */}
      {exchange && (
        <Panel title="Key Exchange Visualization" subtitle="Step through the Diffie-Hellman protocol">
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
                Step {currentStep + 1} of {exchange.steps.length}
              </div>
            </div>

            {/* Current Step Highlight */}
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
                <div className="text-sm text-[var(--ui-muted)] mb-2">
                  {currentStepData.computation}
                </div>
                <div className="font-mono text-sm text-[var(--ui-accent)]">
                  Result: {currentStepData.value}
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Results Panel */}
      {exchange && (
        <Panel title="Exchange Results" subtitle="Public keys and shared secret">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--ui-text)]">Alice</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Private key (a):</span>
                  <span className="ml-2 font-mono">{exchange.alice_private}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Public key (A):</span>
                  <span className="ml-2 font-mono text-[var(--ui-accent)]">{exchange.alice_public}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Shared secret:</span>
                  <span className="ml-2 font-mono text-[var(--ui-positive)]">{exchange.alice_shared}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-[var(--ui-text)]">Bob</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Private key (b):</span>
                  <span className="ml-2 font-mono">{exchange.bob_private}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Public key (B):</span>
                  <span className="ml-2 font-mono text-[var(--ui-accent)]">{exchange.bob_public}</span>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--ui-muted)]">Shared secret:</span>
                  <span className="ml-2 font-mono text-[var(--ui-positive)]">{exchange.bob_shared}</span>
                </div>
              </div>
            </div>
          </div>
          
          {exchange.alice_shared === exchange.bob_shared && (
            <div className="mt-4 p-3 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
              <div className="text-sm text-[var(--ui-text)]">
                <span className="mr-2 text-[var(--ui-positive)]">✔</span>
                Success! Both Alice and Bob computed the same shared secret: <span className="font-mono text-[var(--ui-positive)]">{exchange.alice_shared}</span>
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Steps History */}
      {exchange && visibleSteps.length > 0 && (
        <Panel title="Protocol Steps" subtitle="History of computations performed">
          <div className="space-y-3">
            {visibleSteps.map((step, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border transition-all ${
                  idx === currentStep 
                    ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)]/5' 
                    : 'border-[var(--ui-border)] bg-[var(--ui-surface)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">Step {step.step}: {step.description}</span>
                  {idx === currentStep && (
                    <span className="text-xs bg-[var(--ui-accent)] text-white px-2 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--ui-muted)] mb-1">
                  {step.computation}
                </div>
                <div className="font-mono text-sm text-[var(--ui-text)]">
                  = {step.value}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}