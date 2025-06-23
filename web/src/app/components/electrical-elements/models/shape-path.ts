import { ICommonShapeProperties } from '../interfaces/common-shape-properties.interface';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { DrawOverrides } from '../interfaces/electrical-element.interface';
import { IClickable } from '../interfaces/clickable.interface';
import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

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

export class ShapePath
  implements IDrawable2D, ICommonShapeProperties, IClickable
{
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
        { type: 'moveTo', x: -5, y: -5 },
        { type: 'lineTo', x: 5, y: 5 },
        { type: 'moveTo', x: 5, y: -5 },
        { type: 'lineTo', x: -5, y: 5 },
      ];
    } else {
      // Ensure each command has required properties
      this.path.commands = this.path.commands.map(cmd => ({
        type: cmd.type || 'lineTo',
        x: typeof cmd.x === 'number' ? cmd.x : 0,
        y: typeof cmd.y === 'number' ? cmd.y : 0,
        radius: cmd.radius,
        startAngle: cmd.startAngle,
        endAngle: cmd.endAngle,
        counterclockwise: cmd.counterclockwise,
      }));
    }

    this.lineWidth = contructOptions.lineWidth || 1;
    this.minLineWidth = contructOptions.minWidth || 0.5;
    this.maxWidth = contructOptions.maxWidth || 2;
    this.strokeStyle = contructOptions.strokeStyle || '#000000';
    this.fillStyle = contructOptions.fillStyle || '#FFFFFF';
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
      ctx.strokeStyle = lineColor || this.strokeStyle || '#FF0000'; // Red for visibility
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
    ctx.fillStyle = this.path.fillStyle || this.fillStyle || '#FFFFFF';
    ctx.strokeStyle =
      lineColor || this.path.strokeStyle || this.strokeStyle || '#000000';
    ctx.lineWidth = lineWidthMultiplier
      ? this.lineWidth * lineWidthMultiplier * scale
      : this.lineWidth * scale;

    let drewSomething = false;

    for (const cmd of this.path.commands) {
      // Skip invalid commands silently
      if (!cmd || typeof cmd !== 'object') continue;

      const type = cmd.type;
      if (!type) continue;

      try {
        if (type === 'moveTo') {
          // Use normalized coordinates (0-1 range) multiplied by scale
          const x = (cmd.x || 0) * scale;
          const y = (cmd.y || 0) * scale;
          ctx.moveTo(x, y);
          drewSomething = true;
        } else if (type === 'lineTo') {
          // Use normalized coordinates (0-1 range) multiplied by scale
          const x = (cmd.x || 0) * scale;
          const y = (cmd.y || 0) * scale;
          ctx.lineTo(x, y);
          drewSomething = true;
        } else if (type === 'arc') {
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
      ctx.strokeStyle = lineColor || '#FF0000'; // Red for visibility

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
      if (!cmd || typeof cmd !== 'object') continue;

      if (typeof cmd.x === 'number' && typeof cmd.y === 'number') {
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

  isPointOver(point: Point): boolean {
    if (!this.path || !this.path.commands || this.path.commands.length === 0) {
      return false;
    }

    const halfLineWidth = this.lineWidth / 2;
    let currentX = 0;
    let currentY = 0;
    let minDist = Infinity;

    for (const cmd of this.path.commands) {
      if (!cmd || typeof cmd !== 'object') continue;

      const type = cmd.type;
      if (!type) continue;

      try {
        if (type === 'moveTo' || type === 'lineTo') {
          const targetX = cmd.x || 0;
          const targetY = cmd.y || 0;

          if (type === 'lineTo') {
            // Calculate distance from point to line segment
            const dx = targetX - currentX;
            const dy = targetY - currentY;
            const lineLength = Math.sqrt(dx * dx + dy * dy);

            if (lineLength > 0) {
              // Normalize direction vector
              const nx = dx / lineLength;
              const ny = dy / lineLength;

              // Vector from start to point
              const px = point.x - currentX;
              const py = point.y - currentY;

              // Project point onto line
              const projection = px * nx + py * ny;

              // Check if projection is within line segment
              if (projection >= 0 && projection <= lineLength) {
                // Calculate perpendicular distance from point to line
                const perpX = px - projection * nx;
                const perpY = py - projection * ny;
                const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
                minDist = Math.min(minDist, perpDist);
              }
            }
          }

          currentX = targetX;
          currentY = targetY;
        } else if (type === 'arc') {
          const centerX = cmd.x || 0;
          const centerY = cmd.y || 0;
          const radius = cmd.radius || 0;
          const startAngle = cmd.startAngle || 0;
          const endAngle = cmd.endAngle || Math.PI * 2;
          const counterclockwise = cmd.counterclockwise || false;

          // Calculate distance from point to arc center
          const dx = point.x - centerX;
          const dy = point.y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate angle of point relative to arc center
          const angle = Math.atan2(dy, dx);
          // Normalize angle to [0, 2π]
          const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;

          // Normalize start and end angles to [0, 2π]
          const normalizedStartAngle =
            startAngle < 0 ? startAngle + 2 * Math.PI : startAngle;
          const normalizedEndAngle =
            endAngle < 0 ? endAngle + 2 * Math.PI : endAngle;

          // Check if point is within the arc's angle range
          const isWithinAngleRange = counterclockwise
            ? (normalizedAngle >= normalizedStartAngle &&
                normalizedAngle <= normalizedEndAngle) ||
              (normalizedStartAngle > normalizedEndAngle &&
                (normalizedAngle >= normalizedStartAngle ||
                  normalizedAngle <= normalizedEndAngle))
            : (normalizedAngle <= normalizedStartAngle &&
                normalizedAngle >= normalizedEndAngle) ||
              (normalizedStartAngle < normalizedEndAngle &&
                (normalizedAngle <= normalizedStartAngle ||
                  normalizedAngle >= normalizedEndAngle));

          if (isWithinAngleRange) {
            // For filled arcs, check if point is inside the sector
            if (this.path.fill !== false) {
              minDist = Math.min(minDist, Math.abs(distance - radius));
            } else {
              // For stroked arcs, check if point is within lineWidth/2 of the radius
              minDist = Math.min(minDist, Math.abs(distance - radius));
            }
          }
        }
      } catch (e) {
        // Silently continue if a command fails
        continue;
      }
    }

    // Check if any part of the path is within lineWidth/2 of the point
    return minDist <= halfLineWidth;
  }
}
