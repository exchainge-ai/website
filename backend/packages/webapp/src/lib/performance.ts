/**
 * Performance monitoring stubs
 * These are empty functions to replace the deleted performance monitoring code
 */

export function logPerformance(message: string, startTime?: number): number {
  console.log(`[Performance] ${message}${startTime ? ` (${performance.now() - startTime}ms)` : ''}`);
  return performance.now();
}

export function markPerformance(markName: string): void {
  console.log(`[Performance] Mark: ${markName}`);
}

export function measurePerformance(measureName: string, startMark: string, endMark: string): void {
  console.log(`[Performance] Measure: ${measureName} (from ${startMark} to ${endMark})`);
}

export function clearPerformanceMarks(): void {
  console.log('[Performance] Clearing marks');
}

export function markNavigationStart(url: string): void {
  console.log(`[Performance] Navigation start: ${url}`);
}

export function markNavigationEnd(url: string): void {
  console.log(`[Performance] Navigation end: ${url}`);
}

export function markComponentRendered(componentName: string): void {
  console.log(`[Performance] Component rendered: ${componentName}`);
}