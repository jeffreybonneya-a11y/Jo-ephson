import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb807HG6mYPM5A6jPL1j';
const STORAGE_KEY = 'kingj_whatsapp_channel_btn_pos';
const DRAG_THRESHOLD = 6; // Pixels required to differentiate a drag from a tap/click

interface Position {
  x: number;
  y: number;
}

export default function WhatsAppChannelButton() {
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const buttonRef = useRef<HTMLDivElement>(null);
  const dragInfoRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);
  const recentlyDraggedRef = useRef<boolean>(false);

  // Helper to calculate button dimensions based on current screen size
  const getButtonSize = useCallback(() => {
    if (typeof window === 'undefined') return { width: 56, height: 56 };
    const isMobile = window.innerWidth < 640;
    return isMobile ? { width: 50, height: 50 } : { width: 56, height: 56 };
  }, []);

  // Clamps coordinates strictly within the visible viewport, considering safe areas
  const clampCoordinates = useCallback((x: number, y: number): Position => {
    if (typeof window === 'undefined') return { x, y };

    const { width, height } = getButtonSize();
    const margin = 12;
    // Mobile navigation bar height (80px) + bottom safe spacing
    const isMobile = window.innerWidth < 768;
    const bottomNavMargin = isMobile ? 86 : 14;

    const minX = margin;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const minY = margin;
    const maxY = Math.max(minY, window.innerHeight - height - bottomNavMargin);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, [getButtonSize]);

  // Initialize position from localStorage or calculate clean default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { width, height } = getButtonSize();
    const isMobile = window.innerWidth < 768;

    let initialPos: Position | null = null;

    // Try loading remembered position
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed.x === 'number' &&
          typeof parsed.y === 'number' &&
          !isNaN(parsed.x) &&
          !isNaN(parsed.y)
        ) {
          initialPos = clampCoordinates(parsed.x, parsed.y);
        }
      }
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }

    // If no saved position, compute default floating bottom-right position
    if (!initialPos) {
      if (isMobile) {
        // Above the bottom navigation bar and any promo widget
        initialPos = clampCoordinates(
          window.innerWidth - width - 16,
          window.innerHeight - height - 176
        );
      } else {
        // Desktop bottom-right
        initialPos = clampCoordinates(
          window.innerWidth - width - 28,
          window.innerHeight - height - 28
        );
      }
    }

    setPosition(initialPos);

    // Keep within bounds if window resizes or device rotates
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        return clampCoordinates(prev.x, prev.y);
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [clampCoordinates, getButtonSize]);

  // Open the official WhatsApp Channel in a new tab
  const handleOpenChannel = useCallback(() => {
    try {
      window.open(WHATSAPP_CHANNEL_URL, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // Fallback
      window.location.href = WHATSAPP_CHANNEL_URL;
    }
  }, []);

  // Pointer Down (Mouse, Touch, Pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!position) return;

    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture might fail on some older webviews
    }
  };

  // Pointer Move (Mouse drag, Touch drag)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current) return;

    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;
    const distance = Math.hypot(dx, dy);

    if (distance > DRAG_THRESHOLD) {
      dragInfoRef.current.moved = true;
      setIsDragging(true);

      const newPos = clampCoordinates(
        dragInfoRef.current.initialX + dx,
        dragInfoRef.current.initialY + dy
      );
      setPosition(newPos);
    }
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const wasMoved = dragInfoRef.current.moved;
    dragInfoRef.current = null;

    if (wasMoved) {
      recentlyDraggedRef.current = true;
      setTimeout(() => {
        recentlyDraggedRef.current = false;
        setIsDragging(false);
      }, 100);

      // Save user's preferred position to localStorage
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // Ignore storage quota/access errors
        }
      }
    } else {
      setIsDragging(false);
      // Clean intentional click / tap!
      handleOpenChannel();
    }
  };

  // Pointer Cancel
  const handlePointerCancel = () => {
    dragInfoRef.current = null;
    setIsDragging(false);
  };

  // Keyboard accessibility (Enter or Space to activate)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpenChannel();
    }
  };

  // Compute tooltip placement so it never bleeds offscreen
  const isNearRight = position ? position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 300) : true;
  const isNearTop = position ? position.y < 100 : false;

  if (!position) return null;

  return (
    <motion.div
      ref={buttonRef}
      role="button"
      tabIndex={0}
      aria-label="Join King J Deals WhatsApp Channel"
      title="Join our WhatsApp Channel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        zIndex: 998,
      }}
      className={`group select-none flex items-center justify-center outline-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Floating Button Body */}
      <div
        className={`relative flex items-center justify-center rounded-full bg-[#25D366] text-white transition-all duration-200 shadow-[0_6px_20px_rgba(37,211,102,0.4),0_2px_8px_rgba(0,0,0,0.3)] border-2 border-white/30 hover:border-white/50 hover:bg-[#20bd5a] hover:shadow-[0_8px_25px_rgba(37,211,102,0.55),0_4px_12px_rgba(0,0,0,0.35)] active:scale-95 focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
          isDragging ? 'scale-105 ring-2 ring-white/60' : 'hover:scale-105'
        } w-[50px] h-[50px] sm:w-[56px] sm:h-[56px]`}
      >
        {/* Official WhatsApp Logo Icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 sm:w-7 sm:h-7 fill-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] pointer-events-none"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>

        {/* Small verified badge icon pip */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#0B132B] border-2 border-emerald-400 text-[8px] font-black text-emerald-400 items-center justify-center">
            ✓
          </span>
        </span>
      </div>

      {/* Desktop Tooltip on Hover or Keyboard Focus */}
      <AnimatePresence>
        {(isHovered || isFocused) && !isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: isNearTop ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`hidden md:flex absolute items-center gap-2 pointer-events-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#0B132B]/95 text-white border border-emerald-500/30 shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-md text-xs font-bold z-50 ${
              isNearRight
                ? 'right-full mr-3.5'
                : 'left-full ml-3.5'
            } ${
              isNearTop
                ? 'top-full mt-2'
                : 'top-1/2 -translate-y-1/2'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Join our WhatsApp Channel</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
