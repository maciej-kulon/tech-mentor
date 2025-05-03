import { ICommonShapeProperties } from "../interfaces/common-shape-properties.interface";
import { IDrawable2D } from "../interfaces/drawable-electrical-element.interface";
import { DrawOverrides } from "../interfaces/electrical-element.interface";

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

export class ShapeRect implements IDrawable2D, ICommonShapeProperties {
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
    this.x = typeof contructOptions.x === "number" ? contructOptions.x : 0;
    this.y = typeof contructOptions.y === "number" ? contructOptions.y : 0;

    // Ensure positive width and height, default to 10 if invalid
    this.width =
      typeof contructOptions.width === "number" && contructOptions.width > 0
        ? contructOptions.width
        : 10;
    this.height =
      typeof contructOptions.height === "number" && contructOptions.height > 0
        ? contructOptions.height
        : 10;

    this.lineWidth = contructOptions.lineWidth || 1;
    this.minLineWidth = contructOptions.minLineWidth || 0.5;
    this.maxLineWidth = contructOptions.maxLineWidth || 2;
    this.strokeStyle = contructOptions.strokeStyle || "#000000";
    this.fillStyle = contructOptions.fillStyle || "#FFFFFF";
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    try {
      ctx.beginPath();
      ctx.fillStyle = this.fillStyle || "#FFFFFF";
      ctx.strokeStyle = lineColor || this.strokeStyle || "#000000";
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

      if (this.fillStyle !== "none") {
        ctx.fill();
      }
      ctx.stroke();
    } catch (error) {
      // Draw a fallback shape if something goes wrong
      ctx.beginPath();
      ctx.strokeStyle = lineColor || "#FF0000";
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
}
