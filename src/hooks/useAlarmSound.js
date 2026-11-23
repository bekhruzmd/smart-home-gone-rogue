import { useEffect, useRef } from 'react';

// Kept from the original assignment: a repeating Web Audio beep while the alarm is sounding.
// Off by default; browsers only allow audio after the user has clicked something.
export function useAlarmSound(enabled, sounding) {
  const ctxRef = useRef(null);

  useEffect(() => {
    if (!enabled || !sounding) return undefined;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return undefined;
    ctxRef.current ??= new AudioCtx();
    const ctx = ctxRef.current;

    const beep = () => {
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    };
    beep();
    const timer = setInterval(beep, 1600);
    return () => clearInterval(timer);
  }, [enabled, sounding]);

  useEffect(() => () => void ctxRef.current?.close(), []);
}
