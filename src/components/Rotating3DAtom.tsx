import React, { useState, useRef, useEffect } from 'react';
import { THEME_HEX_MAP, ThemeId } from '../core/themeConfig';

export interface Rotating3DAtomProps {
  size?: number;
  interactive?: boolean;
  monochrome?: boolean;
  themeId?: string;
}

function hexToRgb(hex: string): string {
  try {
    const sanitized = hex.replace('#', '');
    const r = parseInt(sanitized.substring(0, 2), 16);
    const g = parseInt(sanitized.substring(2, 4), 16);
    const b = parseInt(sanitized.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  } catch (e) {
    return '255, 255, 255';
  }
}

export const Rotating3DAtom: React.FC<Rotating3DAtomProps> = ({ 
  size = 260, 
  interactive = false,
  monochrome = false,
  themeId = 'silk'
}) => {
  const [rotX, setRotX] = useState(20);
  const [rotY, setRotY] = useState(0);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const sceneRef = useRef<HTMLDivElement>(null);

  const hex = THEME_HEX_MAP[themeId as ThemeId] || THEME_HEX_MAP['silk'];
  const pRgb = hexToRgb(hex.primaryHex);
  const sRgb = hexToRgb(hex.secondaryHex);
  const aRgb = hexToRgb(hex.accentHex || '#FFFFFF');

  const nucleusSize = size * (50 / 260);
  const electronSize = size * (18 / 260);
  const blurSmall = size * (20 / 260);
  const blurLarge = size * (40 / 260);
  const eBlurSmall = size * (12 / 260);
  const eBlurLarge = size * (24 / 260);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    sceneRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + dx * 0.4);
    setRotX((prev) => {
      let next = prev - dy * 0.4;
      if (next > 80) next = 80;
      if (next < -80) next = -80;
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    isDragging.current = false;
    try {
      sceneRef.current?.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={sceneRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: size,
        height: size,
        perspective: size * 3.5,
        userSelect: 'none',
        touchAction: interactive ? 'none' : 'auto',
        display: 'inline-block',
        marginTop: size >= 40 ? 6 : 3,
      }}
    >
      <style>{`
        .r3d-atom-${size} {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.05s ease-out;
          transform: translateY(3px) rotateX(${rotX}deg) rotateY(${rotY}deg);
        }
        .r3d-nucleus-${size} {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${nucleusSize}px;
          height: ${nucleusSize}px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle at 30% 30%, ${hex.primaryHex}, ${hex.secondaryHex});
          box-shadow: 0 0 ${blurSmall}px rgba(${pRgb}, 0.9), 0 0 ${blurLarge}px rgba(${pRgb}, 0.6);
          z-index: 10;
        }
        .r3d-orbit-${size} {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          transform-style: preserve-3d;
          border: 1px dashed rgba(${pRgb}, 0.45);
        }
        .r3d-electron-${size} {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${electronSize}px;
          height: ${electronSize}px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, ${hex.accentHex || '#FFFFFF'}, ${hex.secondaryHex});
          box-shadow: 0 0 ${eBlurSmall}px rgba(${aRgb}, 0.9), 0 0 ${eBlurLarge}px rgba(${pRgb}, 0.6);
          transform-origin: 50% 50%;
        }

        /* 8 Orbits setup (North, South, East, West, NE, NW, SE, SW) */
        .r3d-orbit-${size}:nth-child(2) { --rx: 0deg; --ry: 90deg; animation: spinOrbitCW-${size} 14s linear infinite; } /* N/S plane */
        .r3d-orbit-${size}:nth-child(3) { --rx: 90deg; --ry: 0deg; animation: spinOrbitCCW-${size} 15s linear infinite; } /* E/W plane */
        .r3d-orbit-${size}:nth-child(4) { --rx: 45deg; --ry: 45deg; animation: spinOrbitCW-${size} 12s linear infinite; } /* NE/SW */
        .r3d-orbit-${size}:nth-child(5) { --rx: -45deg; --ry: 45deg; animation: spinOrbitCCW-${size} 13s linear infinite; } /* NW/SE */
        .r3d-orbit-${size}:nth-child(6) { --rx: 22.5deg; --ry: 67.5deg; animation: spinOrbitCW-${size} 16s linear infinite; }
        .r3d-orbit-${size}:nth-child(7) { --rx: -22.5deg; --ry: 67.5deg; animation: spinOrbitCCW-${size} 17s linear infinite; }
        .r3d-orbit-${size}:nth-child(8) { --rx: 67.5deg; --ry: 22.5deg; animation: spinOrbitCW-${size} 18s linear infinite; }
        .r3d-orbit-${size}:nth-child(9) { --rx: -67.5deg; --ry: 22.5deg; animation: spinOrbitCCW-${size} 19s linear infinite; }

        .r3d-orbit-${size} .r3d-electron-${size} {
          transform: translate(-50%, -50%) rotateZ(0deg) translateX(calc(${size}px / 2));
        }
        
        .r3d-orbit-${size}:nth-child(2) .r3d-electron-${size} { animation: moveAlongOrbitCW-${size} 5s linear infinite; }
        .r3d-orbit-${size}:nth-child(3) .r3d-electron-${size} { animation: moveAlongOrbitCCW-${size} 6s linear infinite; }
        .r3d-orbit-${size}:nth-child(4) .r3d-electron-${size} { animation: moveAlongOrbitCW-${size} 5.5s linear infinite; }
        .r3d-orbit-${size}:nth-child(5) .r3d-electron-${size} { animation: moveAlongOrbitCCW-${size} 6.5s linear infinite; }
        .r3d-orbit-${size}:nth-child(6) .r3d-electron-${size} { animation: moveAlongOrbitCW-${size} 7s linear infinite; }
        .r3d-orbit-${size}:nth-child(7) .r3d-electron-${size} { animation: moveAlongOrbitCCW-${size} 7.5s linear infinite; }
        .r3d-orbit-${size}:nth-child(8) .r3d-electron-${size} { animation: moveAlongOrbitCW-${size} 8s linear infinite; }
        .r3d-orbit-${size}:nth-child(9) .r3d-electron-${size} { animation: moveAlongOrbitCCW-${size} 8.5s linear infinite; }

        @keyframes spinOrbitCW-${size} {
          from { transform: translate(-50%, -50%) rotateY(var(--ry)) rotateX(var(--rx)) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateY(var(--ry)) rotateX(var(--rx)) rotateZ(360deg); }
        }
        @keyframes spinOrbitCCW-${size} {
          from { transform: translate(-50%, -50%) rotateY(var(--ry)) rotateX(var(--rx)) rotateZ(360deg); }
          to   { transform: translate(-50%, -50%) rotateY(var(--ry)) rotateX(var(--rx)) rotateZ(0deg); }
        }

        @keyframes moveAlongOrbitCW-${size} {
          from { transform: translate(-50%, -50%) rotateZ(0deg) translateX(calc(${size}px / 2)) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateZ(360deg) translateX(calc(${size}px / 2)) rotateZ(-360deg); }
        }
        @keyframes moveAlongOrbitCCW-${size} {
          from { transform: translate(-50%, -50%) rotateZ(360deg) translateX(calc(${size}px / 2)) rotateZ(-360deg); }
          to   { transform: translate(-50%, -50%) rotateZ(0deg) translateX(calc(${size}px / 2)) rotateZ(0deg); }
        }
      `}</style>
      <div
        className={`r3d-atom-${size}`}
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        <div className={`r3d-nucleus-${size}`}></div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
        <div className={`r3d-orbit-${size}`}>
          <div className={`r3d-electron-${size}`}></div>
        </div>
      </div>
    </div>
  );
};
