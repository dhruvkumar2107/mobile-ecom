'use client';

import { useEffect, useRef } from 'react';

export function LottieAnimation({ type, size = 200, className }: { type: 'loading' | 'success' | 'empty'; size?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId: number;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, 200, 200);

      if (type === 'loading') {
        // Spinning rings
        const angle1 = (frame * 2) * Math.PI / 180;
        const angle2 = (-frame * 2) * Math.PI / 180;
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.05));

        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(angle1);
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 1.5);
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.setLineDash([160, 100]);
        ctx.lineDashOffset = -frame * 0.5;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.translate(100, 100);
        ctx.rotate(angle2);
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 1.2);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(100, 100, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#22d3ee';
        ctx.globalAlpha = pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (type === 'success') {
        const progress = Math.min(1, frame / 60);
        ctx.beginPath();
        ctx.arc(100, 100, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([283]);
        ctx.lineDashOffset = 283 * (1 - progress);
        ctx.lineCap = 'round';
        ctx.stroke();

        if (progress > 0.4) {
          const checkProgress = Math.min(1, (frame - 24) / 30);
          ctx.beginPath();
          ctx.setLineDash([60]);
          ctx.lineDashOffset = 60 * (1 - checkProgress);
          ctx.moveTo(75, 100);
          ctx.lineTo(92, 117);
          ctx.lineTo(125, 83);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }

      if (type === 'empty') {
        const bob = Math.sin(frame * 0.03) * 3;
        ctx.strokeStyle = '#1b2537';
        ctx.lineWidth = 2;

        // Bag body
        ctx.beginPath();
        ctx.roundRect(70, 55 + bob, 60, 80, 10);
        ctx.stroke();

        // Handles
        ctx.beginPath();
        ctx.moveTo(82, 55 + bob);
        ctx.quadraticCurveTo(82, 35 + bob, 100, 35 + bob);
        ctx.quadraticCurveTo(118, 35 + bob, 118, 55 + bob);
        ctx.stroke();

        // Sad face
        ctx.fillStyle = '#44506b';
        ctx.beginPath();
        ctx.arc(88, 85 + bob, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(112, 85 + bob, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(100, 110 + bob, 8, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.strokeStyle = '#44506b';
        ctx.stroke();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
