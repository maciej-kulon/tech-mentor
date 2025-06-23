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
    const angle = Math.atan2(dy, dx);
    // Normalize angle to [0, 2π]
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

    // Normalize start and end angles to [0, 2π]
    const startAngle =
      this.startAngle < 0 ? this.startAngle + 2 * Math.PI : this.startAngle;
    const endAngle =
      this.endAngle < 0 ? this.endAngle + 2 * Math.PI : this.endAngle;

    console.log('Arc hit testing:', {
      point: { x: point.x, y: point.y },
      center: { x: this.x, y: this.y },
      distance,
      radius: this.radius,
      angle: normalizedAngle * (180 / Math.PI),
      startAngle: startAngle * (180 / Math.PI),
      endAngle: endAngle * (180 / Math.PI),
      counterclockwise: this.counterclockwise,
      fillStyle: this.fillStyle,
      lineWidth: this.lineWidth,
    });

    // Check if point is within the arc's angle range
    let isWithinAngleRange = false;
    if (this.counterclockwise) {
      if (startAngle <= endAngle) {
        isWithinAngleRange =
          normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      } else {
        // Handle case where arc crosses 0/2π boundary
        isWithinAngleRange =
          normalizedAngle >= startAngle || normalizedAngle <= endAngle;
      }
    } else {
      if (startAngle >= endAngle) {
        isWithinAngleRange =
          normalizedAngle <= startAngle && normalizedAngle >= endAngle;
      } else {
        // Handle case where arc crosses 0/2π boundary
        isWithinAngleRange =
          normalizedAngle <= startAngle || normalizedAngle >= endAngle;
      }
    }

    console.log('Angle range check:', {
      isWithinAngleRange,
      counterclockwise: this.counterclockwise,
      startAngle: startAngle * (180 / Math.PI),
      endAngle: endAngle * (180 / Math.PI),
      normalizedAngle: normalizedAngle * (180 / Math.PI),
    });

    // If point is not within angle range, it's not over the arc
    if (!isWithinAngleRange) {
      return false;
    }

    // For filled arcs, check if point is inside the sector
    if (this.fillStyle !== 'none') {
      const isInside = distance <= this.radius;
      console.log('Filled arc check:', {
        isInside,
        distance,
        radius: this.radius,
      });
      return isInside;
    }

    // For stroked arcs, check if point is within lineWidth/2 of the radius
    const halfLineWidth = this.lineWidth / 2;
    const distanceFromRadius = Math.abs(distance - this.radius);
    const isOverStroke = distanceFromRadius <= halfLineWidth;
    console.log('Stroked arc check:', {
      isOverStroke,
      distanceFromRadius,
      halfLineWidth,
      distance,
      radius: this.radius,
    });
    return isOverStroke;
  }
}
