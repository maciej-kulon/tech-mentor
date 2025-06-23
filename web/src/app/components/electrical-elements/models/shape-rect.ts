import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';
import { IClickable } from '../interfaces/clickable.interface';
import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

export interface ShapeRectContructOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

export class ShapeRect
  implements IDrawable2D, ICommonShapeProperties, IClickable
{
  x: number;
  y: number;
  width: number;
  height: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;

  constructor(contructOptions: ShapeRectContructOptions) {
    // Use safe defaults for all properties
    this.x = typeof contructOptions.x === 'number' ? contructOptions.x : 0;
    this.y = typeof contructOptions.y === 'number' ? contructOptions.y : 0;

    // Ensure positive width and height, default to 10 if invalid
    this.width =
      typeof contructOptions.width === 'number' && contructOptions.width > 0
        ? contructOptions.width
        : 10;
    this.height =
      typeof contructOptions.height === 'number' && contructOptions.height > 0
        ? contructOptions.height
        : 10;

    this.lineWidth = contructOptions.lineWidth || 1;
    this.minLineWidth = contructOptions.minLineWidth || 0.5;
    this.maxLineWidth = contructOptions.maxLineWidth || 2;
    this.strokeStyle = contructOptions.strokeStyle || '#000000';
    this.fillStyle = contructOptions.fillStyle || '#FFFFFF';
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

      // Use normalized coordinates (0-1 range) multiplied by scale
      const x = this.x * scale;
      const y = this.y * scale;
      const width = this.width * scale;
      const height = this.height * scale;

      // Draw the rectangle
      ctx.rect(x, y, width, height);

      if (this.fillStyle !== 'none') {
        ctx.fill();
      }
      ctx.stroke();
    } catch {
      // Draw a fallback shape if something goes wrong
      ctx.beginPath();
      ctx.strokeStyle = lineColor || '#FF0000';
      ctx.lineWidth = 1;

      // Draw a small square as fallback
      ctx.rect(-5 * scale, -5 * scale, 10 * scale, 10 * scale);
      ctx.stroke();
    }
  }

  getBoundingBox() {
    // Rectangle is defined by its top-left (x, y) and width/height
    const minX = this.x;
    const minY = this.y;
    const maxX = this.x + this.width;
    const maxY = this.y + this.height;
    return { minX, minY, maxX, maxY };
  }

  isPointOver(point: Point): boolean {
    // For filled rectangles, check if point is inside the rectangle
    if (this.fillStyle !== 'none') {
      return (
        point.x >= this.x &&
        point.x <= this.x + this.width &&
        point.y >= this.y &&
        point.y <= this.y + this.height
      );
    }

    // For stroked rectangles, check if point is within lineWidth/2 of the edges
    const halfLineWidth = this.lineWidth / 2;

    // Check if point is within the expanded rectangle bounds
    const outerLeft = this.x - halfLineWidth;
    const outerRight = this.x + this.width + halfLineWidth;
    const outerTop = this.y - halfLineWidth;
    const outerBottom = this.y + this.height + halfLineWidth;

    // Check if point is within the inner rectangle bounds
    const innerLeft = this.x + halfLineWidth;
    const innerRight = this.x + this.width - halfLineWidth;
    const innerTop = this.y + halfLineWidth;
    const innerBottom = this.y + this.height - halfLineWidth;

    // Point must be within outer bounds
    if (
      point.x < outerLeft ||
      point.x > outerRight ||
      point.y < outerTop ||
      point.y > outerBottom
    ) {
      return false;
    }

    // Point is over the stroke if it's NOT in the inner area (i.e., it's in the stroke area)
    return !(
      point.x > innerLeft &&
      point.x < innerRight &&
      point.y > innerTop &&
      point.y < innerBottom
    );
  }
}
