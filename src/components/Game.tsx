'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export const Game = () => {
  const [isJumping, setIsJumping] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 0 });
  const [direction, setDirection] = useState<'right' | 'left'>('right');
  const [isMoving, setIsMoving] = useState(true); 
  const [currentFrame, setCurrentFrame] = useState(1);
  const [canJump, setCanJump] = useState(true);
  const [debug, setDebug] = useState(false);
  const [gatePosition, setGatePosition] = useState({ x: window.innerWidth - 200, y: 20 }); 
  const [backgroundPosition, setBackgroundPosition] = useState(0);
  const [hasReachedWall, setHasReachedWall] = useState(false);

  const GAME_SPEED = 8; 
  const MOVE_SPEED = 15;
  const JUMP_HEIGHT = 300; 
  const CHARACTER_SIZE = 200;
  const ANIMATION_SPEED = 50;
  const JUMP_DURATION = 500;
  const CROUCH_HEIGHT = CHARACTER_SIZE / 2; 
  const GATE_SPEED = GAME_SPEED * 4; 
  const INVISIBLE_WALL_X = window.innerWidth * 0.35;

  const FRAMES = {
    idle: 11,
    run: 11,
    jump: 11,
    crouch: 11
  };

  const getFrameNumber = (frame: number): string => {
    const num = (frame * 2 - 1).toString().padStart(4, '0');
    return num;
  };

  const getSpritePath = () => {
    if (isJumping) {
      return `/raccoon/jump/jump${getFrameNumber(currentFrame)}.png`;
    }
    if (isCrouching) {
      return `/raccoon/crouch/crouch${getFrameNumber(currentFrame)}.png`;
    }
    if (isMoving) {
      return `/raccoon/run/run${getFrameNumber(currentFrame)}.png`;
    }
    return `/raccoon/idle/${getFrameNumber(currentFrame)}.png`;
  };

  const handleJump = () => {
    if (!canJump) return;
    
    setIsJumping(true);
    setCanJump(false);

    setTimeout(() => {
      setIsJumping(false);
      setTimeout(() => {
        setCanJump(true);
      }, 100);
    }, JUMP_DURATION);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const maxFrames = isJumping ? FRAMES.jump : isMoving ? FRAMES.run : isCrouching ? FRAMES.crouch : FRAMES.idle;
        const next = prev + 1;
        return next > maxFrames ? 1 : next;
      });
    }, ANIMATION_SPEED);

    return () => clearInterval(interval);
  }, [isJumping, isMoving, isCrouching, ANIMATION_SPEED, FRAMES.jump, FRAMES.run, FRAMES.crouch, FRAMES.idle]);

  useEffect(() => {
    const gameLoop = setInterval(() => {
      setBackgroundPosition(prev => prev - GAME_SPEED);
      
      setGatePosition(prev => {
        let newX = prev.x;
        const distanceToCharacter = prev.x - position.x;
        const speedMultiplier = Math.max(1, (1000 / distanceToCharacter) * 2);
        newX += (GATE_SPEED * speedMultiplier - GAME_SPEED);

        if (newX >= window.innerWidth - 200) {
          newX = window.innerWidth - 200;
        } else if (newX <= window.innerWidth * 0.7) {
          newX = window.innerWidth * 0.7;
        }

        return { ...prev, x: newX };
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [position.x, GAME_SPEED, GATE_SPEED]);

  useEffect(() => {
    const updatePosition = () => {
      if (!hasReachedWall) {
        setPosition(({ x }) => {
          const newX = x + GAME_SPEED;
          
          if (newX >= INVISIBLE_WALL_X) {
            setHasReachedWall(true);
            return {
              x: INVISIBLE_WALL_X,
              y: isJumping ? 100 : isCrouching ? CROUCH_HEIGHT : 0
            };
          }

          return {
            x: newX,
            y: isJumping ? 100 : isCrouching ? CROUCH_HEIGHT : 0
          };
        });
      } else {
        setPosition(() => ({
          x: INVISIBLE_WALL_X,
          y: isJumping ? 100 : isCrouching ? CROUCH_HEIGHT : 0
        }));
      }
    };

    const animationFrame = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrame);
  }, [isJumping, isCrouching, hasReachedWall, INVISIBLE_WALL_X, CROUCH_HEIGHT, GAME_SPEED]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebug(prev => !prev);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [setDebug]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {      
      switch (e.code) {
        case 'ArrowLeft':
          setDirection('left');
          setIsMoving(true);
          setPosition(prev => ({ ...prev, x: Math.max(0, prev.x - MOVE_SPEED) }));
          break;
        case 'ArrowRight':
          setDirection('right');
          setIsMoving(true);
          setPosition(prev => ({ ...prev, x: Math.min(window.innerWidth - CHARACTER_SIZE, prev.x + MOVE_SPEED) }));
          break;
        case 'ArrowUp':
        case 'Space':
          handleJump();
          break;
        case 'ArrowDown':
          if (!isJumping) {
            setIsCrouching(true);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        setIsMoving(false);
      }
      if (e.code === 'ArrowDown') {
        setIsCrouching(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, MOVE_SPEED, CHARACTER_SIZE]);

  useEffect(() => {
    const audio = document.getElementById('bgMusic') as HTMLAudioElement;
    if (audio) {
      audio.play().catch(error => {
        console.log("Audio playback failed:", error);
      });
    }
  }, [isJumping]);

  const characterHeight = isCrouching ? CHARACTER_SIZE * 0.5 : CHARACTER_SIZE * 0.8;

  return (
    <div className="game-container" style={{ overflow: 'hidden', position: 'relative', width: '100vw', height: '100vh', background: '#000' }}>
      {/* Background */}
      <div
        className="game-background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('/background.jpg')`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: `${backgroundPosition}px 0`,
          imageRendering: 'pixelated',
        }}
      />

      {/* Rain effect */}
      <div className="rain-container">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.5 + Math.random() * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Ground */}
      <div
        className="ground"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '130px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.5)',
          zIndex: 5,
        }}
      >
        {/* Ground details */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: '#2a2a2a',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: 0,
          width: '100%',
          height: '2px',
          background: 'rgba(255,255,255,0.1)',
        }} />
      </div>

      {/* Invisible wall */}
      {debug && (
        <div
          style={{
            position: 'absolute',
            left: `${INVISIBLE_WALL_X}px`,
            top: 0,
            width: '2px',
            height: '100%',
            backgroundColor: 'red',
            zIndex: 1000,
          }}
        />
      )}

      {/* Character */}
      <motion.div
        className="character"
        style={{ 
          position: 'absolute',
          left: `${Math.min(position.x, INVISIBLE_WALL_X)}px`, 
          bottom: `${position.y + 60}px`, 
          width: `${CHARACTER_SIZE}px`,
          height: `${characterHeight}px`,
        }}
        animate={{
          y: isJumping ? -JUMP_HEIGHT : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        <Image
          src={getSpritePath()}
          alt="Character"
          width={200}
          height={200}
          className={`absolute ${isJumping ? 'transform translate-y-[-100px]' : ''}`}
          style={{
            bottom: isCrouching ? '10px' : '20px',
            transform: `scaleX(${direction === 'right' ? 1 : -1})`,
          }}
        />
      </motion.div>

      {/* Background music */}
      <audio id="bgMusic" autoPlay loop>
        <source src="/arcade.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Portal */}
      <div
        className="portal-container"
        style={{
          position: 'absolute',
          left: `${gatePosition.x}px`,
          bottom: `${gatePosition.y + 3}px`,
          width: '240px',
          height: '370px',
          zIndex: 10,
        }}
      >
        {/* Portal text */}
        <div
          style={{
            position: 'absolute',
            bottom: '370px',
            right: '50px',
            color: '#FF0000',
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '0 0 10px rgba(255,0,0,0.5), 0 0 20px rgba(255,0,0,0.3)',
            whiteSpace: 'nowrap',
            fontFamily: 'fantasy',
            animation: 'textGlow 2s ease-in-out infinite',
            zIndex: 1000,
          }}
        >
          Raccoonlist Heaven
        </div>

        {/* Portal image */}
        <div
          className="gate"
          style={{
            width: '100%',
            height: '100%',
            right: "60px",
            backgroundImage: `url('/portal.png')`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Black hole effect */}
          <div
            className="black-hole-effect"
            style={{
              position: 'absolute',
              right: '15%',
              top: '50%',
              transform: 'translate(50%, -50%)',
              width: '150px',
              height: '150px',
              background: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 70%)',
              animation: 'blackHolePulse 4s ease-in-out infinite',
              filter: 'blur(8px)',
              opacity: 0.8,
            }}
          />

          {/* Particles */}
          <div className="particles">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  right: `${Math.random() * 60 + 20}%`,
                  top: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  width: `${Math.random() * 3 + 2}px`,
                  height: `${Math.random() * 3 + 2}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blackHolePulse {
          0% { transform: translate(50%, -50%) scale(0.9); opacity: 0.7; }
          50% { transform: translate(50%, -50%) scale(1.1); opacity: 0.9; }
          100% { transform: translate(50%, -50%) scale(0.9); opacity: 0.7; }
        }

        .particles {
          position: absolute;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          animation: particleFloat 2s ease-in infinite;
        }

        @keyframes particleFloat {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          50% {
            transform: translate(-20px, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-40px, 0);
            opacity: 0;
          }
        }

        @keyframes textGlow {
          0% { text-shadow: 0 0 10px rgba(255,0,0,0.5), 0 0 20px rgba(255,0,0,0.3); }
          50% { text-shadow: 0 0 20px rgba(255,0,0,0.8), 0 0 30px rgba(255,0,0,0.5); }
          100% { text-shadow: 0 0 10px rgba(255,0,0,0.5), 0 0 20px rgba(255,0,0,0.3); }
        }

        .rain-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .rain-drop {
          position: absolute;
          width: 1px;
          height: 15px;
          background: linear-gradient(transparent, rgba(255, 255, 255, 0.7));
          animation: rain linear infinite;
        }

        @keyframes rain {
          0% {
            transform: translateY(-100px);
          }
          100% {
            transform: translateY(100vh);
          }
        }
      `}</style>
    </div>
  );
};
