import '@testing-library/jest-dom';
import { createCanvas } from 'canvas';

// jsdom doesn't implement Canvas getContext — patch it with the `canvas` package
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (contextId === '2d') {
    const c = createCanvas(this.width || 300, this.height || 150);
    Object.defineProperty(this, 'width', {
      get: () => c.width,
      set: (v: number) => { c.width = v; },
      configurable: true,
    });
    Object.defineProperty(this, 'height', {
      get: () => c.height,
      set: (v: number) => { c.height = v; },
      configurable: true,
    });
    return c.getContext('2d', ...args);
  }
  return null;
};
