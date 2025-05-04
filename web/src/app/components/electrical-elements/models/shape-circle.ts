import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';

export interface ShapeCircleContructOptions {
  x: number;
  y: number;
  radius: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;
  stroke: boolean;
  fill: boolean;
}

export class ShapeCircle implements IDrawable2D, ICommonShapeProperties {
  x: number;
  y: number;
  radius: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;
  stroke: boolean;
  fill: boolean;

  constructor(contructOptions: ShapeCircleContructOptions) {
    this.x = contructOptions.x || 0;
    this.y = contructOptions.y || 0;

    // Ensure positive radius, default to 10 if invalid
    this.radius =
      typeof contructOptions.radius === 'number' && contructOptions.radius > 0
        ? contructOptions.radius
        : 10;

    this.lineWidth = contructOptions.lineWidth || 1;
    this.minLineWidth = contructOptions.minLineWidth || 0.5;
    this.maxLineWidth = contructOptions.maxLineWidth || 2;
    this.strokeStyle = contructOptions.strokeStyle || '#000000';
    this.fillStyle = contructOptions.fillStyle || '#FFFFFF';
    this.stroke = contructOptions.stroke !== false;
    this.fill = contructOptions.fill !== false;
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    try {
      ctx.beginPath();
      ctx.fillStyle = this.fillStyle || '#FFFFFF';
      ctx.strokeStyle = lineColor || this.strokeStyle || '#000000';
      ctx.lineWidth = lineWidthMultiplier
        ? this.lineWidth * lineWidthMultiplier * scale
        : this.lineWidth * scale;

      // Calculate scaled dimensions
      const x = this.x * scale;
      const y = this.y * scale;
      const radius = this.radius * scale;

      // Draw the circle
      ctx.arc(x, y, radius, 0, Math.PI * 2);

      if (this.fillStyle !== 'none') {
        ctx.fill();
      }
      ctx.stroke();
    } catch (error) {
      // Draw a fallback shape if something goes wrong
      ctx.beginPath();
      ctx.strokeStyle = lineColor || '#FF0000';
      ctx.lineWidth = 1;

      // Draw a smaller circle as fallback
      ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  getBoundingBox() {
    // Circle is defined by its center (x, y) and radius
    const minX = this.x - this.radius;
    const minY = this.y - this.radius;
    const maxX = this.x + this.radius;
    const maxY = this.y + this.radius;
    return { minX, minY, maxX, maxY };
  }
}
