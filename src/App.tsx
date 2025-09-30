import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, X, Upload, Volume2 } from 'lucide-react';

interface SoundOption {
  id: string;
  name: string;
  type: 'single' | 'sequence' | 'decay' | 'pulse' | 'fade';
  frequency?: number;
  frequencies?: number[];
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'beep', name: 'Classic Beep', type: 'single', frequency: 800 },
  { id: 'chime', name: 'Soft Chime', type: 'sequence', frequencies: [523.25, 659.25, 783.99] },
  { id: 'bell', name: 'Bell', type: 'decay', frequency: 659.25 },
  { id: 'alarm', name: 'Alarm', type: 'pulse', frequency: 1000 },
  { id: 'gentle', name: 'Gentle Tone', type: 'fade', frequency: 440 }
];

function App() {
  console.log('🎯 Timer App is loading...');
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [totalTime, setTotalTime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customHeading, setCustomHeading] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timerHeading') || 'Illinois Tech';
    }
    return 'Illinois Tech';
  });
  const [backgroundImage, setBackgroundImage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timerBackground') || '';
    }
    return '';
  });
  const [selectedSound, setSelectedSound] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timerSound') || 'bell';
    }
    return 'bell';
  });
  const [showConfetti, setShowConfetti] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timerConfetti') === 'true';
    }
    return true;
  });
  const [completionMessage, setCompletionMessage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('timerCompletionMessage') || '🎉 Time\'s up! Great work!';
    }
    return '🎉 Time\'s up! Great work!';
  });
  const [isConfettiActive, setIsConfettiActive] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<{ play: () => void } | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerHeading', customHeading);
    }
  }, [customHeading]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerBackground', backgroundImage);
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerSound', selectedSound);
    }
  }, [selectedSound]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerConfetti', showConfetti.toString());
    }
  }, [showConfetti]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('timerCompletionMessage', completionMessage);
    }
  }, [completionMessage]);

  // Initialize audio for completion sound
  useEffect(() => {
    // Create sound based on selected option - repeat 3 times for completion
    const createSound = () => {
      const soundOption = SOUND_OPTIONS.find(s => s.id === selectedSound) || SOUND_OPTIONS[0];
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Play the sound 3 times with spacing
      for (let repeat = 0; repeat < 3; repeat++) {
        const baseDelay = repeat * 1.5; // 1.5 second spacing between repetitions
        
        if (soundOption.type === 'single') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = soundOption.frequency!;
          oscillator.type = 'sine';
          
          const startTime = audioContext.currentTime + baseDelay;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
          
        } else if (soundOption.type === 'sequence') {
          const frequencies = soundOption.frequencies!;
          frequencies.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            
            const startTime = audioContext.currentTime + baseDelay + (index * 0.15);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
          });
          
        } else if (soundOption.type === 'decay') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = soundOption.frequency!;
          oscillator.type = 'triangle';
          
          const startTime = audioContext.currentTime + baseDelay;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2); // Shorter for repetition
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 1.2);
          
        } else if (soundOption.type === 'pulse') {
          for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = soundOption.frequency!;
            oscillator.type = 'square';
            
            const startTime = audioContext.currentTime + baseDelay + (i * 0.35);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
          }
          
        } else if (soundOption.type === 'fade') {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = soundOption.frequency!;
          oscillator.type = 'sine';
          
          const startTime = audioContext.currentTime + baseDelay;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.4);
          gainNode.gain.linearRampToValueAtTime(0, startTime + 1.0); // Shorter for repetition
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 1.0);
        }
      }
    };
    
    audioRef.current = { 
      play: () => {
        createSound();
      }
    };
  }, [selectedSound]);

  const startTimer = useCallback(() => {
    const totalSeconds = minutes * 60 + seconds;
    if (totalSeconds <= 0) return;
    
    setTotalTime(totalSeconds);
    setTimeLeft(totalSeconds);
    setIsRunning(true);
    setIsEditing(false);
  }, [minutes, seconds]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsEditing(true);
    setTimeLeft(0);
    setTotalTime(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const editTimer = useCallback(() => {
    setIsRunning(false);
    setIsEditing(true);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const playTestSound = (soundId: string) => {
    const soundOption = SOUND_OPTIONS.find(s => s.id === soundId);
    if (!soundOption) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    
    if (soundOption.type === 'single') {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = soundOption.frequency!;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
    } else if (soundOption.type === 'sequence') {
      const frequencies = soundOption.frequencies!;
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (index * 0.15);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
      
    } else if (soundOption.type === 'decay') {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = soundOption.frequency!;
      oscillator.type = 'triangle';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2.0);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 2.0);
      
    } else if (soundOption.type === 'pulse') {
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = soundOption.frequency!;
        oscillator.type = 'square';
        
        const startTime = audioContext.currentTime + (i * 0.35);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      }
      
    } else if (soundOption.type === 'fade') {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = soundOption.frequency!;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.8);
    }
  };

  // Confetti animation function
  const triggerConfetti = useCallback(() => {
    try {
      console.log('🎉 Triggering confetti...');
      setIsConfettiActive(true);
      
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        const canvas = confettiCanvasRef.current;
        if (!canvas) {
          console.warn('❌ Canvas not found');
          setIsConfettiActive(false);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('❌ Canvas context not available');
          setIsConfettiActive(false);
          return;
        }

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        console.log(`📏 Canvas size: ${canvas.width}x${canvas.height}`);

    interface ConfettiPiece {
      x: number;
      y: number;
      dx: number;
      dy: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      size: number;
    }

    const confettiPieces: ConfettiPiece[] = [];
    const colors = ['#DC143C', '#FF6B6B', '#FFD93D', '#6BCF7F', '#4D96FF', '#9B59B6', '#E67E22'];

    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      confettiPieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        dx: (Math.random() - 0.5) * 6,
        dy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4
      });
    }

        const animate = () => {
          try {
            if (!canvas || !ctx) {
              setIsConfettiActive(false);
              return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = confettiPieces.length - 1; i >= 0; i--) {
              const piece = confettiPieces[i];
              
              // Update position
              piece.x += piece.dx;
              piece.y += piece.dy;
              piece.rotation += piece.rotationSpeed;
              piece.dy += 0.1; // gravity

              // Draw confetti piece
              ctx.save();
              ctx.translate(piece.x, piece.y);
              ctx.rotate(piece.rotation * Math.PI / 180);
              ctx.fillStyle = piece.color;
              ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
              ctx.restore();

              // Remove if off screen
              if (piece.y > canvas.height + 10) {
                confettiPieces.splice(i, 1);
              }
            }

            if (confettiPieces.length > 0) {
              requestAnimationFrame(animate);
            } else {
              console.log('✅ Confetti animation completed');
              setIsConfettiActive(false);
            }
          } catch (error) {
            console.error('❌ Confetti animation error:', error);
            setIsConfettiActive(false);
          }
        };

        console.log(`🎊 Starting animation with ${confettiPieces.length} pieces`);
        animate();
      }, 50); // 50ms delay to ensure canvas is ready
    } catch (error) {
      console.error('❌ Confetti setup error:', error);
      setIsConfettiActive(false);
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play completion sound
            if (audioRef.current) {
              audioRef.current.play();
            }
            // Trigger haptic feedback
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            // Trigger confetti if enabled
            if (showConfetti) {
              triggerConfetti();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, showConfetti, triggerConfetti]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? (Math.max(0, timeLeft - 1) / totalTime) * 100 : (isEditing ? 100 : 0);
  const strokeDasharray = 2 * Math.PI * 120; // circumference
  const strokeDashoffset = strokeDasharray * (1 - progress / 100);

  const displayTime = isEditing ? formatTime(minutes * 60 + seconds) : formatTime(timeLeft);
  const isCompleted = !isEditing && timeLeft === 0 && totalTime > 0;

  const backgroundStyle = backgroundImage 
    ? { 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(139, 69, 19, 0.8)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};



  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4 relative"
      style={backgroundStyle}
    >
      {/* Confetti Canvas */}
      {isConfettiActive && (
        <canvas
          ref={confettiCanvasRef}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ 
            width: '100vw', 
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0
          }}
        />
      )}
      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="absolute top-6 right-6 p-3 bg-gray-800/50 hover:bg-gray-700/70 text-white rounded-xl backdrop-blur-sm border border-red-500/20 transition-all duration-200 transform hover:scale-105"
      >
        <Settings size={20} />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-red-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Custom Heading */}
              <div>
                <label className="block text-red-300 text-sm font-medium mb-2">
                  Timer Heading
                </label>
                <input
                  type="text"
                  value={customHeading}
                  onChange={(e) => setCustomHeading(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-red-500/30 rounded-xl text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                  placeholder="Enter custom heading"
                />
              </div>

              {/* Background Image */}
              <div>
                <label className="block text-red-300 text-sm font-medium mb-2">
                  Background Image
                </label>
                <div className="flex items-center space-x-3">
                  <label className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-700 border border-red-500/30 rounded-xl text-white cursor-pointer hover:bg-gray-600 transition-colors">
                    <Upload size={16} className="mr-2" />
                    <span className="text-sm">Choose Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {backgroundImage && (
                    <button
                      onClick={() => {
                        setBackgroundImage('');
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('timerBackground', '');
                        }
                      }}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {backgroundImage && (
                  <div className="mt-2 text-xs text-green-400">
                    ✓ Background image uploaded
                  </div>
                )}
              </div>

              {/* Completion Message */}
              <div>
                <label className="block text-red-300 text-sm font-medium mb-2">
                  Completion Message
                </label>
                <input
                  type="text"
                  value={completionMessage}
                  onChange={(e) => setCompletionMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-red-500/30 rounded-xl text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                  placeholder="Enter completion message"
                  maxLength={50}
                />
                <div className="mt-1 text-xs text-gray-400">
                  Max 50 characters
                </div>
              </div>

              {/* Confetti Toggle */}
              <div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-red-300 text-sm font-medium">Confetti Animation</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showConfetti}
                      onChange={(e) => setShowConfetti(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${showConfetti ? 'bg-red-600' : 'bg-gray-600'} relative`}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${showConfetti ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Sound Selection */}
              <div>
                <label className="block text-red-300 text-sm font-medium mb-2">
                  Completion Sound
                </label>
                <div className="space-y-2">
                  {SOUND_OPTIONS.map((sound) => (
                    <label key={sound.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="sound"
                        value={sound.id}
                        checked={selectedSound === sound.id}
                        onChange={(e) => setSelectedSound(e.target.value)}
                        className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 focus:ring-red-500"
                      />
                      <span className="text-white text-sm flex-1">{sound.name}</span>
                      <button
                        onClick={() => playTestSound(sound.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                        type="button"
                      >
                        <Volume2 size={14} className="text-gray-400" />
                      </button>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowSettings(false)}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{customHeading}</h1>
          <p className="text-red-300 text-lg">Focus Timer</p>
        </div>

        {/* Main Timer Display */}
        <div className="relative">
          {/* Background Circle */}
          <div className="w-80 h-80 mx-auto relative bg-gray-800/30 rounded-full backdrop-blur-sm border border-red-500/20 shadow-2xl">
            {/* SVG Progress Circle */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 280 280">
              {/* Background circle */}
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="rgba(220, 20, 60, 0.2)"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="140"
                cy="140"
                r="120"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className={`transition-all duration-1000 ease-linear ${isCompleted ? 'animate-pulse' : ''}`}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#DC143C" stopOpacity="1" />
                  <stop offset="50%" stopColor="#FF6B6B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#DC143C" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl font-mono font-bold transition-colors duration-300 ${
                isCompleted ? 'text-red-400 animate-pulse' : 'text-white'
              }`}>
                {displayTime}
              </div>
              <div className="text-red-300 text-sm mt-2 uppercase tracking-wider">
                {isCompleted ? 'Complete!' : isRunning ? 'Running' : isEditing ? 'Set Time' : 'Paused'}
              </div>
            </div>
          </div>
        </div>

        {/* Time Input Controls */}
        {isEditing && (
          <div className="mt-8 bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-red-500/20">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <label className="block text-red-300 text-sm font-medium mb-2">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 h-14 text-2xl font-mono text-center bg-gray-700 border border-red-500/30 rounded-xl text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                />
              </div>
              <div className="text-white text-3xl font-bold self-end pb-2">:</div>
              <div className="text-center">
                <label className="block text-red-300 text-sm font-medium mb-2">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-20 h-14 text-2xl font-mono text-center bg-gray-700 border border-red-500/30 rounded-xl text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          {isEditing ? (
            <button
              onClick={startTimer}
              disabled={minutes === 0 && seconds === 0}
              className="flex items-center space-x-2 px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
            >
              <Play size={20} />
              <span>Start Timer</span>
            </button>
          ) : (
            <>
              <button
                onClick={isRunning ? pauseTimer : () => setIsRunning(true)}
                className="flex items-center space-x-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </button>
              
              <button
                onClick={resetTimer}
                className="flex items-center space-x-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <RotateCcw size={20} />
                <span>Reset</span>
              </button>
              
              <button
                onClick={editTimer}
                className="flex items-center space-x-2 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <Settings size={20} />
                <span>Edit</span>
              </button>
            </>
          )}
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-red-600/20 border border-red-500/50 rounded-xl px-6 py-3 animate-pulse">
              <p className="text-red-300 font-medium">{completionMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;