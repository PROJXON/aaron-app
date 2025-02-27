"use client";
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Batch {
  id: number;
  size: number;
  status: string;
  arrivalTime: number;
  mixStartTime?: number;
  bakeStartTime?: number;
  packStartTime?: number;
  completionTime?: number;
}

interface Log {
  time: number;
  message: string;
}

interface TransferAnimation {
  from: string;
  to: string;
  batch: Batch;
  startTime: number;
}

const BakerySimulation: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [logs, setLogs] = useState<Log[]>([]);
  const [mixerQueue, setMixerQueue] = useState<Batch[]>([]);
  const [ovenQueue, setOvenQueue] = useState<Batch[]>([]);
  const [packerQueue, setPackerQueue] = useState<Batch[]>([]);
  const [mixerBusy, setMixerBusy] = useState<boolean>(false);
  const [ovenBusy, setOvenBusy] = useState<boolean>(false);
  const [packerBusy, setPackerBusy] = useState<boolean>(false);
  const [completedBatches, setCompletedBatches] = useState<Batch[]>([]);
  const [nextBatchId, setNextBatchId] = useState<number>(1);
  const [transferAnimation, setTransferAnimation] = useState<TransferAnimation | null>(null);

  // Define process times
  const mixTime = 10;
  const bakeTime = 30;
  const packTime = 5;

  // Initialize the simulation
  useEffect(() => {
    if (isRunning) {
      const timer = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000 / speed);
      
      return () => clearInterval(timer);
    }
  }, [isRunning, speed]);

  // Add initial batches
  const addInitialBatches = () => {
    // Reset simulation
    setTime(0);
    setLogs([]);
    setMixerQueue([]);
    setOvenQueue([]);
    setPackerQueue([]);
    setMixerBusy(false);
    setOvenBusy(false);
    setPackerBusy(false);
    setCompletedBatches([]);
    setNextBatchId(1);
    setTransferAnimation(null);
    
    // Add 6 batches (3 iterations of small and large)
    const initialBatches: Batch[] = [];
    for (let i = 0; i < 3; i++) {
      initialBatches.push({
        id: nextBatchId + (i * 2),
        size: 50,
        status: 'waiting',
        arrivalTime: 0
      });
      initialBatches.push({
        id: nextBatchId + (i * 2) + 1,
        size: 100,
        status: 'waiting',
        arrivalTime: 0
      });
    }
    setMixerQueue(initialBatches);
    setNextBatchId(nextBatchId + 6);
    addLog(0, "Simulation started with 6 batches");
  };

  // Add a log entry
  const addLog = (time: number, message: string) => {
    setLogs(prevLogs => [...prevLogs, { time, message }]);
  };

  // Show animation of cookies moving between stations
  const showTransferAnimation = (from: string, to: string, batch: Batch) => {
    setTransferAnimation({ from, to, batch, startTime: time });
    
    // Clear animation after 2 seconds
    setTimeout(() => {
      setTransferAnimation(null);
    }, 2000 / speed);
  };

  // Process simulation step
  useEffect(() => {
    if (!isRunning) return;
  
    // Process packing (from oven)
    if (!packerBusy && ovenQueue.length > 0 && ovenQueue[0].status === 'baked') {
      const batch: Batch = ovenQueue[0];
      showTransferAnimation('oven', 'packer', batch);
      
      setTimeout(() => {
        // Move batch to packing
        setOvenQueue(prev => prev.slice(1));
        setPackerBusy(true);
        batch.packStartTime = time;
        batch.status = 'packing';
        setPackerQueue(prev => [...prev, batch]);
        addLog(time, `Batch #${batch.id} (${batch.size} cookies) moved from oven to packing`);
      }, 1000 / speed);
    }
  
    // Process oven (from mixer)
    if (!ovenBusy && mixerQueue.length > 0 && mixerQueue[0].status === 'mixed') {
      const batch: Batch = mixerQueue[0];
      showTransferAnimation('mixer', 'oven', batch);
  
      setTimeout(() => {
        // Move batch to oven
        setMixerQueue(prev => prev.slice(1));
        setOvenBusy(true);
        batch.bakeStartTime = time;
        batch.status = 'baking';
        setOvenQueue(prev => [...prev, batch]);
        addLog(time, `Batch #${batch.id} (${batch.size} cookies) moved from mixer to oven`);
      }, 1000 / speed);
    }
  
    // Process mixer (from waiting to mixing)
    if (!mixerBusy && mixerQueue.length > 0 && mixerQueue[0].status === 'waiting') {
      const batch: Batch = mixerQueue[0];
      setMixerBusy(true);
      batch.mixStartTime = time;
      batch.status = 'mixing';
      addLog(time, `Batch #${batch.id} (${batch.size} cookies) started mixing`);
    }
  
    // Check for completed mixing
    if (mixerBusy && mixerQueue.length > 0 && mixerQueue[0].status === 'mixing') {
      const batch: Batch = mixerQueue[0];
      if (batch.mixStartTime !== undefined && time - batch.mixStartTime >= mixTime) {
        batch.status = 'mixed';
        setMixerBusy(false); // Reset mixer
        addLog(time, `Batch #${batch.id} (${batch.size} cookies) finished mixing`);
      }
    }
  
    // Check for completed baking
    if (ovenBusy && ovenQueue.length > 0 && ovenQueue[0].status === 'baking') {
      const batch: Batch = ovenQueue[0];
      if (batch.bakeStartTime !== undefined && time - batch.bakeStartTime >= bakeTime) {
        batch.status = 'baked';
        setOvenBusy(false); // Reset oven
        addLog(time, `Batch #${batch.id} (${batch.size} cookies) finished baking`);
      }
    }
  
    // Check for completed packing
    if (packerBusy && packerQueue.length > 0) {
      const batch: Batch = packerQueue[0];
      if (batch.packStartTime !== undefined && time - batch.packStartTime >= packTime) {
        batch.status = 'completed';
        batch.completionTime = time;
        setPackerBusy(false); // Reset packer
        setPackerQueue([]); // Clear packing queue
        showTransferAnimation('packer', 'completed', batch);
  
        setTimeout(() => {
          setCompletedBatches(prev => [...prev, batch]); // Add to completed batches
          addLog(time, `Batch #${batch.id} (${batch.size} cookies) completed and ready for shipping!`);
        }, 1000 / speed);
      }
    }
  
    // Process subsequent batches (to keep the flow moving)
    if (mixerQueue.length === 0 && !mixerBusy && ovenQueue.length === 0 && !ovenBusy && packerQueue.length === 0 && !packerBusy) {
      // Reset and start processing the next batch
      addInitialBatches();
    }
  
    // Check if all batches are completed
    if (mixerQueue.length === 0 && ovenQueue.length === 0 && packerQueue.length === 0 &&
        !mixerBusy && !ovenBusy && !packerBusy) {
      setIsRunning(false);
      addLog(time, "All batches completed! Simulation finished.");
    }
  
  }, [time, isRunning, mixerQueue, ovenQueue, packerQueue, mixerBusy, ovenBusy, packerBusy]);
  
  

  // Get status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'waiting': return 'bg-gray-200';
      case 'mixing': return 'bg-blue-400';
      case 'mixed': return 'bg-blue-200';
      case 'baking': return 'bg-orange-400';
      case 'baked': return 'bg-orange-200';
      case 'packing': return 'bg-green-400';
      case 'completed': return 'bg-green-200';
      default: return 'bg-gray-200';
    }
  };

  // Cookie icon (simplified)
  const CookieIcon: React.FC<{ size?: string }> = ({ size = "small" }) => {
    const dimensions = size === "small" ? "w-3 h-3" : "w-6 h-6";
    return (
      <div className={`${dimensions} rounded-full bg-yellow-600 relative flex items-center justify-center`}>
        <div className="absolute w-1/3 h-1/3 bg-yellow-800 rounded-full"></div>
      </div>
    );
  };

  // Batch visualization with cookies
  const BatchVisual: React.FC<{ batch: Batch, status?: string }> = ({ batch, status }) => {
    const small = batch.size === 50;
    return (
      <div className={`relative w-full h-12 rounded flex items-center justify-center ${getStatusColor(status || batch.status)}`}>
        <div className="absolute top-1 left-1 text-xs font-bold">#{batch.id}</div>
        <div className="flex items-center">
            <div className="flex">
            {[...Array(3)].map((_, i) => (
                <CookieIcon key={`${batch.id}-${batch.arrivalTime}-${i}`} />
            ))}
            </div>
          <span className="ml-2 font-bold">{batch.size}</span>
        </div>
      </div>
    );
  };

  // Progress bar for stations
  const ProgressBar: React.FC<{ current: number, total: number, status: string }> = ({ current, total, status }) => {
    const percent = Math.min((current / total) * 100, 100);
    let color;
    switch(status) {
      case 'mixing': color = 'bg-blue-500'; break;
      case 'baking': color = 'bg-orange-500'; break;
      case 'packing': color = 'bg-green-500'; break;
      default: color = 'bg-gray-500';
    }
    
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
        <div 
          className={`h-full rounded-full ${color}`} 
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  // Transfer animation component
  const TransferAnimationComponent: React.FC = () => {
    if (!transferAnimation) return null;
  
    const { from, to, batch } = transferAnimation;
  
    const getClassName = () => {
      let className = "fixed z-10 animate-pulse";
  
      // Position based on from/to
      if (from === 'mixer' && to === 'oven') {
        className += " top-1/4 left-1/3 animate-bounce";
      } else if (from === 'oven' && to === 'packer') {
        className += " top-1/4 left-2/3 animate-bounce";
      } else if (from === 'packer' && to === 'completed') {
        className += " top-1/2 left-2/3 animate-bounce";
      }
  
      return className;
    };
  
    return (
      <div className={getClassName()} style={{ width: '100%' }}>
        <div className="bg-white p-2 rounded shadow-lg">
          <div className="text-xs font-bold">Moving Batch #{batch.id}</div>
          <div className="flex items-center justify-center my-1">
            {[...Array(3)].map((_, i) => (
                <CookieIcon key={`${batch.id}-${batch.arrivalTime}-${i}`} />
            ))}
            </div>
          <div className="text-xs text-center">From {from} to {to}</div>
        </div>
      </div>
    );
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Bakery Production Simulation</h1>
      
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => {
            if (!isRunning) {
              if (time === 0 || completedBatches.length === 6) {
                addInitialBatches();
              }
              setIsRunning(true);
            } else {
              setIsRunning(false);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isRunning ? 'Pause' : (time === 0 || completedBatches.length === 6) ? 'Start' : 'Resume'}
        </button>
        
        <button 
          onClick={addInitialBatches}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
        
        <div className="ml-4">
          <label className="mr-2">Speed:</label>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="border rounded p-1"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
        
        <div className="ml-4 font-bold">
          Time: {time} minutes
        </div>
      </div>
      
      {/* Process flow diagram */}
      <div className="relative border rounded-lg p-4 mb-6 bg-gray-50">
        <h2 className="font-bold mb-4">Process Flow</h2>
        <div className="flex justify-between items-center">
          <div className="w-1/4 p-2 border rounded-lg bg-white shadow">
            <div className="text-center font-bold mb-2">Raw Ingredients</div>
            <div className="flex justify-center">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg mr-2"></div>
              <div className="w-8 h-8 bg-yellow-700 rounded-lg mr-2"></div>
              <div className="w-8 h-8 bg-white border border-gray-300 rounded-lg"></div>
            </div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="h-0.5 w-full bg-gray-400 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">→</div>
            </div>
          </div>
          
          <div className="w-1/4 p-2 border rounded-lg bg-white shadow">
            <div className="text-center font-bold mb-2">Mixer</div>
            <div className="h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
            <div className="mt-1 text-xs text-center">{mixTime} min</div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="h-0.5 w-full bg-gray-400 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">→</div>
            </div>
          </div>
          
          <div className="w-1/4 p-2 border rounded-lg bg-white shadow">
            <div className="text-center font-bold mb-2">Oven</div>
            <div className="h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 relative">
                <div className="absolute inset-0 bg-orange-500 opacity-70 rounded animate-pulse"></div>
                <div className="absolute inset-2 bg-yellow-500 opacity-70 rounded"></div>
              </div>
            </div>
            <div className="mt-1 text-xs text-center">{bakeTime} min (Bottleneck)</div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="h-0.5 w-full bg-gray-400 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">→</div>
            </div>
          </div>
          
          <div className="w-1/4 p-2 border rounded-lg bg-white shadow">
            <div className="text-center font-bold mb-2">Packer</div>
            <div className="h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-green-500 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-green-500"></div>
              </div>
            </div>
            <div className="mt-1 text-xs text-center">{packTime} min</div>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="h-0.5 w-full bg-gray-400 relative">
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">→</div>
            </div>
          </div>
          
          <div className="w-1/4 p-2 border rounded-lg bg-white shadow">
            <div className="text-center font-bold mb-2">Shipping</div>
            <div className="h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-4 border border-gray-400 relative">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-gray-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workstations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold mb-2 flex justify-between">
            <span>Mixer {mixerBusy ? '(Busy)' : '(Available)'}</span>
            <span className="text-sm bg-blue-100 px-2 rounded">{mixTime} min</span>
          </h2>
          
          <div className="h-16 mb-2">
            {mixerBusy && mixerQueue.length > 0 && (
              <>
                <BatchVisual batch={mixerQueue[0]} status="mixing" />
                <ProgressBar 
                  current={time - (mixerQueue[0]?.mixStartTime ?? 0)} 
                  total={mixTime} 
                  status="mixing" 
                />
              </>
            )}
          </div>
          
          <h3 className="font-bold mt-4">Queue:</h3>
          <div className="max-h-32 overflow-y-auto">
            {mixerQueue.filter((_, i) => i > 0 || !mixerBusy).map((batch, index) => (
              <div key={`${batch.id}-${index}`} className="my-1">
                <BatchVisual batch={batch} />
              </div>
            ))}
            {mixerQueue.filter((_, i) => i > 0 || !mixerBusy).length === 0 && (
              <div className="text-gray-500 italic">No batches in queue</div>
            )}
          </div>
        </div>
        
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold mb-2 flex justify-between">
            <span>Oven {ovenBusy ? '(Busy)' : '(Available)'}</span>
            <span className="text-sm bg-orange-100 px-2 rounded">{bakeTime} min</span>
          </h2>
          
          <div className="h-16 mb-2">
            {ovenBusy && ovenQueue.length > 0 && ovenQueue[0].status === 'baking' && (
              <>
                <BatchVisual batch={ovenQueue[0]} status="baking" />
                <ProgressBar 
                  current={time - (ovenQueue[0]?.bakeStartTime ?? 0)}
                  total={bakeTime} 
                  status="baking" 
                />
              </>
            )}
          </div>
          
          <h3 className="font-bold mt-4">Queue:</h3>
          <div className="max-h-32 overflow-y-auto">
            {ovenQueue.filter((_, i) => i > 0 || !mixerBusy).map((batch, index) => (
              <div key={`${batch.id}-${index}`} className="my-1">
                <BatchVisual batch={batch} />
              </div>
            ))}
            {ovenQueue.filter((batch, i) => !(i === 0 && batch.status === 'baking')).length === 0 && (
              <div className="text-gray-500 italic">No batches in queue</div>
            )}
          </div>
        </div>
        
        <div className="border p-4 rounded shadow">
          <h2 className="font-bold mb-2 flex justify-between">
            <span>Packer {packerBusy ? '(Busy)' : '(Available)'}</span>
            <span className="text-sm bg-green-100 px-2 rounded">{packTime} min</span>
          </h2>
          
          <div className="h-16 mb-2">
            {packerBusy && packerQueue.length > 0 && (
              <>
                <BatchVisual batch={packerQueue[0]} status="packing" />
                <ProgressBar 
                  current={time - (packerQueue[0]?.packStartTime ?? 0)}
                  total={packTime} 
                  status="packing" 
                />
              </>
            )}
          </div>
          
          <h3 className="font-bold mt-4">Completed & Shipped:</h3>
          <div className="max-h-32 overflow-y-auto">
          {completedBatches.map((batch, index) => (
            <div key={`${batch.id}-${index}`} className="my-1">
                <div className={`w-full p-2 rounded flex justify-between items-center ${getStatusColor('completed')}`}>
                <div className="flex items-center">
                    <div className="flex">
                    <CookieIcon key={`${batch.id}-${index}-1`} />
                    <CookieIcon key={`${batch.id}-${index}-2`} />
                    </div>
                    <span className="ml-1">#{batch.id} ({batch.size})</span>
                </div>
                <span className="text-xs">Completed: {batch.completionTime}m</span>
                </div>
            </div>
            ))}
            {completedBatches.length === 0 && (
              <div className="text-gray-500 italic">No completed batches yet</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Production statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="border p-4 rounded shadow bg-gray-50">
          <h3 className="font-bold text-center">Total Production</h3>
          <div className="text-2xl text-center mt-2">
            {completedBatches.reduce((sum, batch) => sum + batch.size, 0)} cookies
          </div>
        </div>
        <div className="border p-4 rounded shadow bg-gray-50">
          <h3 className="font-bold text-center">Average Throughput</h3>
          <div className="text-2xl text-center mt-2">
            {time > 0 ? (completedBatches.reduce((sum, batch) => sum + batch.size, 0) / time).toFixed(1) : "0"} cookies/min
          </div>
        </div>
        <div className="border p-4 rounded shadow bg-gray-50">
          <h3 className="font-bold text-center">Completed Batches</h3>
          <div className="text-2xl text-center mt-2">
            {completedBatches.length} of 6
          </div>
        </div>
        <div className="border p-4 rounded shadow bg-gray-50">
          <h3 className="font-bold text-center">Machine Utilization</h3>
          <div className="text-2xl text-center mt-2">
            <span className={mixerBusy ? "text-green-500" : "text-red-500"}>M</span> | 
            <span className={ovenBusy ? "text-green-500" : "text-red-500"}> O</span> | 
            <span className={packerBusy ? "text-green-500" : "text-red-500"}> P</span>
          </div>
        </div>
      </div>
      
      {/* Event Log */}
      <div className="border p-4 rounded shadow">
        <h2 className="font-bold mb-2">Event Log</h2>
        <div className="max-h-64 overflow-y-auto">
          {logs.slice().reverse().map((log, index) => (
            <div key={index} className="border-b py-1">
              <span className="font-mono font-bold">[{log.time}m]</span> {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Transfer animation */}
      {transferAnimation && <TransferAnimationComponent />}
    </div>
  );
};

export default BakerySimulation;
