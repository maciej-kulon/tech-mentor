import { ICommonShapeProperties } from "../interfaces/common-shape-properties.interface";
import { IDrawable2D } from "../interfaces/drawable-electrical-element.interface";
import { DrawOverrides } from "../interfaces/electrical-element.interface";

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
}

export class ShapeArc implements IDrawable2D, ICommonShapeProperties {
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
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    ctx.beginPath();
    ctx.strokeStyle = lineColor || this.strokeStyle || "#000000";
    ctx.lineWidth = lineWidthMultiplier
      ? this.lineWidth * lineWidthMultiplier * scale
      : this.lineWidth * scale;

    // Use normalized coordinates (0-1 range) multiplied by scale
    const x = this.x * scale;
    const y = this.y * scale;
    const radius = this.radius * scale;

    ctx.arc(x, y, radius, this.startAngle, this.endAngle);

    if (this.fillStyle !== "none") {
      ctx.fillStyle = this.fillStyle || "#FFFFFF";
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
}
