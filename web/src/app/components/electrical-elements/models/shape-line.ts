import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';
import { IClickable } from '../interfaces/clickable.interface';
import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

export interface ShapeLineContructOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

export class ShapeLine
  implements IDrawable2D, ICommonShapeProperties, IClickable
{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lineWidth: number;
  minLineWidth: number;
  maxLineWidth: number;
  strokeStyle: string;
  fillStyle: string;

  constructor(contructOptions: ShapeLineContructOptions) {
    this.x1 = contructOptions.x1;
    this.y1 = contructOptions.y1;
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

    // Use normalized coordinates (0-1 range) multiplied by scale
    const x1 = this.x1 * scale;
    const y1 = this.y1 * scale;
    const x2 = this.x2 * scale;
    const y2 = this.y2 * scale;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  getBoundingBox() {
    const minX = Math.min(this.x1, this.x2);
    const minY = Math.min(this.y1, this.y2);
    const maxX = Math.max(this.x1, this.x2);
    const maxY = Math.max(this.y1, this.y2);
    return { minX, minY, maxX, maxY };
  }

  isPointOver(point: Point): boolean {
    // Calculate the distance from point to line segment
    const halfLineWidth = this.lineWidth / 2;

    // Vector from start to end of line
    const dx = this.x2 - this.x1;
    const dy = this.y2 - this.y1;
    const lineLength = Math.sqrt(dx * dx + dy * dy);

    if (lineLength === 0) {
      // If line is a point, check if point is within lineWidth/2
      const distToPoint = Math.sqrt(
        Math.pow(point.x - this.x1, 2) + Math.pow(point.y - this.y1, 2)
      );
      return distToPoint <= halfLineWidth;
    }

    // Normalize direction vector
    const nx = dx / lineLength;
    const ny = dy / lineLength;

    // Vector from start to point
    const px = point.x - this.x1;
    const py = point.y - this.y1;

    // Project point onto line
    const projection = px * nx + py * ny;

    // Check if projection is within line segment
    if (projection < 0 || projection > lineLength) {
      return false;
    }

    // Calculate perpendicular distance from point to line
    const perpX = px - projection * nx;
    const perpY = py - projection * ny;
    const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

    return perpDist <= halfLineWidth;
  }
}
