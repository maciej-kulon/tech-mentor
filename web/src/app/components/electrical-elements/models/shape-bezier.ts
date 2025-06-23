import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';
import { IClickable } from '../interfaces/clickable.interface';
import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

export interface ShapeBezierContructOptions {
  x1: number;
  y1: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  x2: number;
  y2: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

export class ShapeBezier
  implements IDrawable2D, ICommonShapeProperties, IClickable
{
  x1: number;
  y1: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  x2: number;
  y2: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;

  constructor(contructOptions: ShapeBezierContructOptions) {
    this.x1 = contructOptions.x1;
    this.y1 = contructOptions.y1;
    this.cp1x = contructOptions.cp1x;
    this.cp1y = contructOptions.cp1y;
    this.cp2x = contructOptions.cp2x;
    this.cp2y = contructOptions.cp2y;
    this.x2 = contructOptions.x2;
    this.y2 = contructOptions.y2;
    this.lineWidth = contructOptions.lineWidth;
    this.minLineWidth = contructOptions.minLineWidth;
    this.maxLineWidth = contructOptions.maxLineWidth;
    this.strokeStyle = contructOptions.strokeStyle;
    this.fillStyle = contructOptions.fillStyle;
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    ctx.beginPath();
    ctx.strokeStyle = lineColor || this.strokeStyle || '#000000';

    // Ensure line width is at least 1 pixel after scaling
    ctx.lineWidth = lineWidthMultiplier
      ? Math.max(1, this.lineWidth * lineWidthMultiplier * scale)
      : Math.max(1, this.lineWidth * scale);

    // Use normalized coordinates (0-1 range) multiplied by scale directly
    const x1 = this.x1 * scale;
    const y1 = this.y1 * scale;
    const cp1x = this.cp1x * scale;
    const cp1y = this.cp1y * scale;
    const cp2x = this.cp2x * scale;
    const cp2y = this.cp2y * scale;
    const x2 = this.x2 * scale;
    const y2 = this.y2 * scale;

    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.stroke();
  }

  getBoundingBox() {
    // Simple bounding box: min/max of all control and end points
    const xs = [this.x1, this.cp1x, this.cp2x, this.x2];
    const ys = [this.y1, this.cp1y, this.cp2y, this.y2];
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { minX, minY, maxX, maxY };
  }

  isPointOver(point: Point): boolean {
    const halfLineWidth = this.lineWidth / 2;

    // Function to calculate point on Bezier curve at parameter t
    const bezierPoint = (t: number) => {
      const mt = 1 - t;
      return {
        x:
          mt * mt * mt * this.x1 +
          3 * mt * mt * t * this.cp1x +
          3 * mt * t * t * this.cp2x +
          t * t * t * this.x2,
        y:
          mt * mt * mt * this.y1 +
          3 * mt * mt * t * this.cp1y +
          3 * mt * t * t * this.cp2y +
          t * t * t * this.y2,
      };
    };

    // Binary search to find closest point on curve
    let t = 0.5;
    let step = 0.25;
    let minDist = Infinity;

    // Iterate a few times to find closest point
    for (let i = 0; i < 8; i++) {
      const p = bezierPoint(t);
      const dist = Math.sqrt(
        Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)
      );

      if (dist < minDist) {
        minDist = dist;
      }

      // Try points on both sides
      const p1 = bezierPoint(t - step);
      const p2 = bezierPoint(t + step);
      const dist1 = Math.sqrt(
        Math.pow(p1.x - point.x, 2) + Math.pow(p1.y - point.y, 2)
      );
      const dist2 = Math.sqrt(
        Math.pow(p2.x - point.x, 2) + Math.pow(p2.y - point.y, 2)
      );

      if (dist1 < dist2) {
        t -= step;
      } else {
        t += step;
      }
      step *= 0.5;
    }

    // Check if closest point is within lineWidth/2
    return minDist <= halfLineWidth;
  }
}
