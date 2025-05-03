import { ICommonShapeProperties } from "../interfaces/common-shape-properties.interface";
import { IDrawable2D } from "../interfaces/drawable-electrical-element.interface";
import { DrawOverrides } from "../interfaces/electrical-element.interface";

export interface ShapePathCommand {
  type: string;
  x: number;
  y: number;
  // Additional properties for arc commands
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  counterclockwise?: boolean;
}

export interface ShapePathCommands {
  commands: ShapePathCommand[];
  fill?: boolean;
  stroke?: boolean;
  fillStyle?: string;
  strokeStyle?: string;
}

export interface ShapePathContructOptions {
  x: number;
  y: number;
  path: ShapePathCommands;
  lineWidth: number;
  minWidth: number;
  maxWidth: number;
  strokeStyle: string;
  fillStyle: string;
}

export class ShapePath implements IDrawable2D, ICommonShapeProperties {
  x: number;
  y: number;
  path: ShapePathCommands;
  lineWidth: number;
  minLineWidth: number;
  maxWidth: number;
  strokeStyle: string;
  fillStyle: string;

  constructor(contructOptions: ShapePathContructOptions) {
    this.x = contructOptions.x || 0;
    this.y = contructOptions.y || 0;

    this.path = { ...contructOptions.path };

    // Initialize commands array if missing
    if (
      !this.path.commands ||
      !Array.isArray(this.path.commands) ||
      this.path.commands.length === 0
    ) {
      this.path.commands = [
        { type: "moveTo", x: -5, y: -5 },
        { type: "lineTo", x: 5, y: 5 },
        { type: "moveTo", x: 5, y: -5 },
        { type: "lineTo", x: -5, y: 5 },
      ];
    } else {
      // Ensure each command has required properties
      this.path.commands = this.path.commands.map((cmd) => ({
        type: cmd.type || "lineTo",
        x: typeof cmd.x === "number" ? cmd.x : 0,
        y: typeof cmd.y === "number" ? cmd.y : 0,
        radius: cmd.radius,
        startAngle: cmd.startAngle,
        endAngle: cmd.endAngle,
        counterclockwise: cmd.counterclockwise,
      }));
    }

    this.lineWidth = contructOptions.lineWidth || 1;
    this.minLineWidth = contructOptions.minWidth || 0.5;
    this.maxWidth = contructOptions.maxWidth || 2;
    this.strokeStyle = contructOptions.strokeStyle || "#000000";
    this.fillStyle = contructOptions.fillStyle || "#FFFFFF";
  }

  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    const { lineWidthMultiplier, lineColor, scale = 1 } = overrides || {};

    // If path is still invalid, create a default x shape
    if (
      !this.path ||
      !this.path.commands ||
      !Array.isArray(this.path.commands) ||
      this.path.commands.length === 0
    ) {
      ctx.beginPath();
      ctx.strokeStyle = lineColor || this.strokeStyle || "#FF0000"; // Red for visibility
      ctx.lineWidth = lineWidthMultiplier
        ? this.lineWidth * lineWidthMultiplier * scale
        : this.lineWidth * scale;

      // Draw an X shape as fallback
      ctx.moveTo(-5 * scale, -5 * scale);
      ctx.lineTo(5 * scale, 5 * scale);
      ctx.moveTo(5 * scale, -5 * scale);
      ctx.lineTo(-5 * scale, 5 * scale);
      ctx.stroke();

      return;
    }

    ctx.beginPath();
    ctx.fillStyle = this.path.fillStyle || this.fillStyle || "#FFFFFF";
    ctx.strokeStyle =
      lineColor || this.path.strokeStyle || this.strokeStyle || "#000000";
    ctx.lineWidth = lineWidthMultiplier
      ? this.lineWidth * lineWidthMultiplier * scale
      : this.lineWidth * scale;

    let drewSomething = false;

    for (const cmd of this.path.commands) {
      // Skip invalid commands silently
      if (!cmd || typeof cmd !== "object") continue;

      const type = cmd.type;
      if (!type) continue;

      try {
        if (type === "moveTo") {
          // Use normalized coordinates (0-1 range) multiplied by scale
          const x = (cmd.x || 0) * scale;
          const y = (cmd.y || 0) * scale;
          ctx.moveTo(x, y);
          drewSomething = true;
        } else if (type === "lineTo") {
          // Use normalized coordinates (0-1 range) multiplied by scale
          const x = (cmd.x || 0) * scale;
          const y = (cmd.y || 0) * scale;
          ctx.lineTo(x, y);
          drewSomething = true;
        } else if (type === "arc") {
          // Use normalized coordinates (0-1 range) multiplied by scale
          const x = (cmd.x || 0) * scale;
          const y = (cmd.y || 0) * scale;
          // Scale radius proportionally
          const r = (cmd.radius || 0.1) * scale;
          const startAngle = cmd.startAngle || 0;
          const endAngle = cmd.endAngle || Math.PI * 2;
          const counterclockwise = cmd.counterclockwise || false;
          ctx.arc(x, y, r, startAngle, endAngle, counterclockwise);
          drewSomething = true;
        }
      } catch (e) {
        // Silently continue if a command fails
        continue;
      }
    }

    // If we didn't draw anything valid, draw a fallback X
    if (!drewSomething) {
      ctx.beginPath();
      ctx.strokeStyle = lineColor || "#FF0000"; // Red for visibility

      // Draw an X shape as fallback
      ctx.moveTo(-5 * scale, -5 * scale);
      ctx.lineTo(5 * scale, 5 * scale);
      ctx.moveTo(5 * scale, -5 * scale);
      ctx.lineTo(-5 * scale, 5 * scale);
    }

    if (this.path.fill !== false) {
      try {
        ctx.fill();
      } catch (e) {
        // Silently ignore fill errors
      }
    }

    if (this.path.stroke !== false) {
      try {
        ctx.stroke();
      } catch (e) {
        // Silently ignore stroke errors
      }
    }
  }

  getBoundingBox() {
    // Handle missing or invalid path/commands - SILENTLY return default values
    if (
      !this.path ||
      !this.path.commands ||
      !Array.isArray(this.path.commands) ||
      this.path.commands.length === 0
    ) {
      // No warnings, just return default bounding box
      return { minX: -5, minY: -5, maxX: 5, maxY: 5 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const cmd of this.path.commands) {
      // Skip invalid commands silently
      if (!cmd || typeof cmd !== "object") continue;

      if (typeof cmd.x === "number" && typeof cmd.y === "number") {
        minX = Math.min(minX, cmd.x);
        minY = Math.min(minY, cmd.y);
        maxX = Math.max(maxX, cmd.x);
        maxY = Math.max(maxY, cmd.y);
      }
      if (cmd.radius) {
        minX = Math.min(minX, (cmd.x || 0) - cmd.radius);
        minY = Math.min(minY, (cmd.y || 0) - cmd.radius);
        maxX = Math.max(maxX, (cmd.x || 0) + cmd.radius);
        maxY = Math.max(maxY, (cmd.y || 0) + cmd.radius);
      }
    }

    // Handle the case where no valid points were found - silently
    if (
      !isFinite(minX) ||
      !isFinite(minY) ||
      !isFinite(maxX) ||
      !isFinite(maxY)
    ) {
      return { minX: -5, minY: -5, maxX: 5, maxY: 5 };
    }

    return { minX, minY, maxX, maxY };
  }
}
