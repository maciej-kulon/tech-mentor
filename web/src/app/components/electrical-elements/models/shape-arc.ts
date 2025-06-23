import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';
import { IClickable } from '../interfaces/clickable.interface';
import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

export interface ShapeArcContructOptions {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  counterclockwise?: boolean;
}

export class ShapeArc
  implements IDrawable2D, ICommonShapeProperties, IClickable
{
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  counterclockwise: boolean;

  constructor(contructOptions: ShapeArcContructOptions) {
    this.x = contructOptions.x;
    this.y = contructOptions.y;
    this.radius = contructOptions.radius;
    this.startAngle = contructOptions.startAngle;
    this.endAngle = contructOptions.endAngle;
    this.lineWidth = contructOptions.lineWidth;
    this.minLineWidth = contructOptions.minLineWidth;
    this.maxLineWidth = contructOptions.maxLineWidth;
    this.strokeStyle = contructOptions.strokeStyle;
    this.fillStyle = contructOptions.fillStyle;
    this.counterclockwise = contructOptions.counterclockwise || false;
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    ctx.beginPath();
    ctx.strokeStyle = lineColor || this.strokeStyle || '#000000';
    ctx.lineWidth = lineWidthMultiplier
      ? this.lineWidth * lineWidthMultiplier * scale
      : this.lineWidth * scale;

    // Use normalized coordinates (0-1 range) multiplied by scale
    const x = this.x * scale;
    const y = this.y * scale;
    const radius = this.radius * scale;

    ctx.arc(
      x,
      y,
      radius,
      this.startAngle,
      this.endAngle,
      this.counterclockwise
    );

    if (this.fillStyle !== 'none') {
      ctx.fillStyle = this.fillStyle || '#FFFFFF';
      ctx.fill();
    }
    ctx.stroke();
  }

  getBoundingBox() {
    // For simplicity, use the full bounding box of the circle
    const minX = this.x - this.radius;
    const minY = this.y - this.radius;
    const maxX = this.x + this.radius;
    const maxY = this.y + this.radius;
    return { minX, minY, maxX, maxY };
  }

  isPointOver(point: Point): boolean {
    // Calculate distance from point to arc center
    const dx = point.x - this.x;
    const dy = point.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate angle of point relative to arc center
    // In HTML5 Canvas, Y increases downward, so we need to negate dy for correct angle calculation
    const angle = Math.atan2(-dy, dx);

    // Check if point is within the arc's angle range
    // Use the same logic as canvas arc drawing
    let isWithinAngleRange = false;

    // Normalize angles to handle negative values and 2π crossings
    const normalizeAngle = (a: number) => {
      while (a < 0) a += 2 * Math.PI;
      while (a >= 2 * Math.PI) a -= 2 * Math.PI;
      return a;
    };

    const normalizedAngle = normalizeAngle(angle);
    const normalizedStart = normalizeAngle(this.startAngle);
    const normalizedEnd = normalizeAngle(this.endAngle);

    if (this.counterclockwise) {
      // For counterclockwise arcs
      if (normalizedStart > normalizedEnd) {
        // Arc crosses 0/2π boundary
        isWithinAngleRange =
          normalizedAngle >= normalizedStart ||
          normalizedAngle <= normalizedEnd;
      } else {
        isWithinAngleRange =
          normalizedAngle >= normalizedStart &&
          normalizedAngle <= normalizedEnd;
      }
    } else {
      // For clockwise arcs (default)
      if (normalizedStart > normalizedEnd) {
        // Arc goes from start to end clockwise, crossing 0
        isWithinAngleRange =
          normalizedAngle >= normalizedEnd &&
          normalizedAngle <= normalizedStart;
      } else {
        // Normal clockwise arc
        isWithinAngleRange =
          normalizedAngle <= normalizedStart &&
          normalizedAngle >= normalizedEnd;
      }
    }

    // If point is not within angle range, it's not over the arc
    if (!isWithinAngleRange) {
      return false;
    }

    // For filled arcs, check if point is inside the sector
    if (this.fillStyle !== 'none') {
      return distance <= this.radius;
    }

    // For stroked arcs, check if point is within lineWidth/2 of the radius
    const halfLineWidth = this.lineWidth / 2;
    const distanceFromRadius = Math.abs(distance - this.radius);
    return distanceFromRadius <= halfLineWidth;
  }
}
