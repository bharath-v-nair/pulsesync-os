export function triggerHaptic(durationMs: number = 15): void {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore errors if vibration is disabled or unpermitted
    }
  }
}
