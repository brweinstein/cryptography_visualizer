"use client";
import React, { useState, useEffect } from 'react';
import { loadWasm, WasmExports, DiscreteLogVisualization } from '../../lib/wasm';
import { Panel } from '../../components/Panel';
import { Navigation } from '../../components/Navigation';

export default function DiscreteLogPage() {
  const [wasm, setWasm] = useState<WasmExports | null>(null);
  const [status, setStatus] = useState('Loading WASM...');
  
  // Discrete Log Parameters
  const [base, setBase] = useState('3');
  const [target, setTarget] = useState('13');
  const [modulus, setModulus] = useState('17');
  const [maxSteps, setMaxSteps] = useState('100');
  const [algorithm, setAlgorithm] = useState<'brute-force' | 'bsgs'>('brute-force');
  
  // Computation results
  const [result, setResult] = useState<DiscreteLogVisualization | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComputing, setIsComputing] = useState(false);
  
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

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !result) return;
    
    const interval = setInterval(() => {
      setCurrentStep(step => {
        if (step >= result.steps.length - 1) {
          setIsPlaying(false);
          return result.steps.length - 1;
        }
        return step + 1;
      });
    }, (1 - speed) * 1000 + 200);
    
    return () => clearInterval(interval);
  }, [isPlaying, speed, result]);

  const computeDiscreteLog = async () => {
    if (!wasm) return;
    setIsComputing(true);
    try {
      const result = algorithm === 'brute-force' 
        ? wasm.discrete_log_brute_force(base, target, modulus, parseInt(maxSteps))
        : wasm.discrete_log_bsgs(base, target, modulus, parseInt(maxSteps));
      setResult(result);
      setCurrentStep(0);
    } catch (err) {
      console.error('Discrete log computation error:', err);
      setResult(null);
    } finally {
      setIsComputing(false);
    }
  };

  const generateExample = () => {
    // Generate a known solvable discrete log problem with varied primes and generators
    const primes = [17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
    const p = primes[Math.floor(Math.random() * primes.length)];

    // Factor p-1 into small prime factors (sufficient for small primes above)
    const factors = (() => {
      const res: number[] = [];
      let n = p - 1;
      for (let f = 2; f * f <= n; f++) {
        if (n % f === 0) {
          res.push(f);
          while (n % f === 0) n = Math.floor(n / f);
        }
      }
      if (n > 1) res.push(n);
      return res;
    })();

    const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
      if (mod === 1n) return 0n;
      let result = 1n;
      let b = ((base % mod) + mod) % mod;
      let e = exp;
      while (e > 0n) {
        if (e & 1n) result = (result * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
      }
      return result;
    };

    // Find a primitive root mod p: g^( (p-1)/q ) != 1 for all prime factors q of p-1
    const findGenerator = (): number => {
      for (let g = 2; g < p; g++) {
        let ok = true;
        for (const q of factors) {
          const exp = BigInt((p - 1) / q);
          if (modPow(BigInt(g), exp, BigInt(p)) === 1n) { ok = false; break; }
        }
        if (ok) return g;
      }
      return 2;
    };

    const g = findGenerator();
    const x = Math.floor(Math.random() * (p - 2)) + 1; // 1..p-2
    const y = Number(modPow(BigInt(g), BigInt(x), BigInt(p)));

    setModulus(p.toString());
    setBase(g.toString());
    setTarget(y.toString());
  };

  const resetAnimation = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const currentStepData = result?.steps[currentStep];
  const visibleSteps = result?.steps.slice(0, currentStep + 1) || [];

  return (
    <div className="space-y-6">
      <Navigation title="Discrete Logarithm" showBackButton />
      
      <div className="mb-6">
        <p className="text-sm text-[var(--ui-muted)]">
          Find x such that base^x ≡ target (mod modulus) using different algorithms
        </p>
      </div>
      
      <div className="text-xs text-[var(--ui-muted)]">Status: {status}</div>

      {/* Problem Setup Panel */}
      <Panel title="Problem Setup" subtitle="Define the discrete logarithm problem">
        <div className="space-y-4">
          <div className="text-center p-4 bg-[var(--ui-surface)] rounded-lg border">
            <div className="text-lg font-mono">
              <span className="text-[var(--ui-accent)]">{base}</span>
              <sup className="text-[var(--ui-positive)]">x</sup>
              {' ≡ '}
              <span className="text-[var(--ui-accent)]">{target}</span>
              {' (mod '}
              <span className="text-[var(--ui-accent)]">{modulus}</span>
              {')'}
            </div>
            <div className="text-sm text-[var(--ui-muted)] mt-2">
              Find the value of x
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Base (g)
              </label>
              <input
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Target (y)
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Modulus (p)
              </label>
              <input
                type="text"
                value={modulus}
                onChange={(e) => setModulus(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'brute-force' | 'bsgs')}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm"
              >
                <option value="brute-force">Brute Force</option>
                <option value="bsgs">Baby-Step Giant-Step</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ui-muted)] mb-1">
                Max Steps
              </label>
              <input
                type="text"
                value={maxSteps}
                onChange={(e) => setMaxSteps(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--ui-border)] rounded-md text-sm font-mono"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={computeDiscreteLog}
              disabled={isComputing}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isComputing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[var(--ui-accent)] text-white hover:bg-[var(--ui-accent)]/90'
              }`}
            >
              {isComputing ? 'Computing...' : 'Solve'}
            </button>
            <button
              onClick={generateExample}
              className="px-4 py-2 bg-[var(--ui-positive)] text-white rounded-md text-sm hover:bg-[var(--ui-positive)]/90"
            >
              Generate Example
            </button>
          </div>

          {/* Long-running computation advisory */}
          <div className="text-xs text-[var(--ui-muted)]">
            {algorithm === 'brute-force' && (parseInt(maxSteps || '0', 10) > 5000 || parseInt(modulus || '0', 10) > 2000) && (
              <span>
                Hint: Brute Force with large modulus or high max steps can be slow. Consider using Baby-Step Giant-Step or lowering parameters.
              </span>
            )}
          </div>
        </div>
      </Panel>

      {/* Notices / Warnings */}
      {result?.warnings && result.warnings.length > 0 && (
        <Panel title="Notes" subtitle="Input validation and search hints">
          <ul className="list-disc pl-5 text-sm text-[var(--ui-muted)]">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Algorithm Explanation */}
      <Panel title="Algorithm Information" subtitle="Understanding the chosen algorithm">
        <div className="space-y-3">
          {algorithm === 'brute-force' ? (
            <div>
              <h4 className="font-medium text-sm mb-2">Brute Force Method</h4>
              <p className="text-sm text-[var(--ui-muted)] mb-2">
                Tests each possible value of x sequentially: 1, 2, 3, ... until base^x ≡ target (mod modulus).
              </p>
              <div className="text-xs bg-[var(--ui-surface)] p-3 rounded border">
                <div className="font-mono">
                  for x = 1 to modulus-1:<br/>
                  &nbsp;&nbsp;if base^x mod modulus == target:<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;return x
                </div>
              </div>
              <p className="text-xs text-[var(--ui-muted)] mt-2">
                Time complexity: O(p) where p is the modulus. Simple but inefficient for large moduli.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-sm mb-2">Baby-Step Giant-Step Method</h4>
              <p className="text-sm text-[var(--ui-muted)] mb-2">
                More efficient algorithm that reduces time complexity by using a meet-in-the-middle approach.
              </p>
              <div className="text-xs bg-[var(--ui-surface)] p-3 rounded border">
                <div className="font-mono">
                  m = ceil(sqrt(p))<br/>
                  Baby steps: compute base^j mod p for j = 0,1,...,m-1<br/>
                  Giant steps: compute target * (base^-m)^i for i = 0,1,...,m-1<br/>
                  Find match: x = im + j
                </div>
              </div>
              <p className="text-xs text-[var(--ui-muted)] mt-2">
                Time complexity: O(√p). Uses more memory but significantly faster for large moduli.
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* Animation Controls */}
      {result && (
        <Panel title="Solution Steps" subtitle="Step through the algorithm execution">
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
                Step {currentStep + 1} of {result.steps.length}
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
                <div className="text-sm text-[var(--ui-muted)] mb-2">
                  Method: {currentStepData.method}
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    <span className="text-[var(--ui-muted)]">Exponent:</span> {currentStepData.exponent}
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-[var(--ui-muted)]">Value:</span> {currentStepData.current_value}
                  </div>
                  <div className="font-mono text-sm">
                    <span className="text-[var(--ui-muted)]">Found:</span> {currentStepData.found ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* Results Panel */}
      {result && (
        <Panel title="Solution" subtitle="Final result and algorithm performance">
          <div className="space-y-4">
            {result.solution !== null ? (
              <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-[var(--ui-text)]">Solution Found!</h4>
                </div>
                <div className="text-sm text-[var(--ui-muted)]">
                  <div className="font-mono text-lg mb-2 text-[var(--ui-text)]">
                    x = <span className="text-xl font-bold">{result.solution}</span>
                  </div>
                  <div className="text-xs">
                    Verification: {base}^{result.solution} ≡ {target} (mod {modulus})
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[var(--ui-surface)] border border-[var(--ui-border)] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[var(--ui-warning)] text-lg"></span>
                  <h4 className="font-medium text-[var(--ui-text)]">No Solution Found</h4>
                </div>
                <div className="text-sm text-[var(--ui-muted)]">
                  {result.truncated
                    ? 'Search stopped at the maximum number of steps. Increase "Max Steps" or choose Baby-Step Giant-Step for large moduli.'
                    : 'The algorithm did not find a solution. This may mean the discrete logarithm does not exist in the chosen group (e.g., gcd(base, modulus) ≠ 1 or modulus not prime).'}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-[var(--ui-muted)]">Algorithm:</span>
                <div className="font-medium">{algorithm === 'brute-force' ? 'Brute Force' : 'Baby-Step Giant-Step'}</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Steps Taken:</span>
                <div className="font-mono">{result.steps.length}</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Max Steps:</span>
                <div className="font-mono">{maxSteps}</div>
              </div>
              <div>
                <span className="text-[var(--ui-muted)]">Success:</span>
                <div className={result.solution !== null ? 'text-green-600' : 'text-yellow-600'}>
                  {result.solution !== null ? 'Yes' : 'No'}
                </div>
              </div>
              {typeof result.truncated === 'boolean' && (
                <div>
                  <span className="text-[var(--ui-muted)]">Truncated:</span>
                  <div className={result.truncated ? 'text-yellow-600' : 'text-green-600'}>
                    {result.truncated ? 'Yes (hit step limit)' : 'No'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      {/* Steps History */}
      {result && visibleSteps.length > 0 && (
        <Panel title="Algorithm Steps" subtitle="Detailed execution trace">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {visibleSteps.map((step: any, idx: number) => (
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
                  Method: {step.method} | Exponent: {step.exponent}
                </div>
                <div className="font-mono text-sm text-[var(--ui-text)]">
                  Value: {step.current_value} | Found: {step.found ? 'Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}