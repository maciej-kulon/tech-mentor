import { ElectricalElement } from "../interfaces/electrical-element.interface";
import { BaseElementRenderer } from "./base-element-renderer";

/**
 * Generic renderer for electrical elements based on their JSON definition
 */
export class GenericElementRenderer extends BaseElementRenderer {
  render(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number,
    mouseX?: number,
    mouseY?: number
  ): void {
    // Apply transformations (position, rotation)
    this.applyTransform(element, scale, offsetX, offsetY);

    const width = element.width * scale;
    const height = element.height * scale;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Get the drawing instructions from the element or use default drawing logic
    if (element.shape && Array.isArray(element.shape)) {
      this.renderElementShape(element.shape, width, height, scale);
    } else {
      // Default rendering if no shape is defined
      this.renderDefaultElement(width, height);
    }

    // Restore context after shape rendering
    this.restoreContext();

    // Draw labels with their own transformation context
    this.drawLabels(element, scale, offsetX, offsetY);

    // Handle terminal highlighting if mouse position is provided
    if (typeof mouseX === "number" && typeof mouseY === "number") {
      this.highlightNearestTerminal(
        element,
        scale,
        offsetX,
        offsetY,
        mouseX,
        mouseY
      );
    }
  }

  /**
   * Calculate line width based on relative size and constraints
   */
  private calculateLineWidth(
    shape: any,
    width: number,
    height: number
  ): number {
    let lineWidth = (shape.lineWidth || 0.05) * Math.min(width, height);

    if (shape.minWidth && lineWidth < shape.minWidth) {
      lineWidth = shape.minWidth;
    }
    if (shape.maxWidth && lineWidth > shape.maxWidth) {
      lineWidth = shape.maxWidth;
    }

    return lineWidth;
  }

  /**
   * Render the element shape based on drawing instructions
   */
  private renderElementShape(
    shape: any[],
    width: number,
    height: number,
    scale: number
  ): void {
    for (const part of shape) {
      switch (part.type) {
        case "line":
          this.drawLine(part, width, height);
          break;
        case "rect":
          this.drawRect(part, width, height);
          break;
        case "circle":
          this.drawCircle(part, width, height);
          break;
        case "path":
          this.drawPath(part, width, height);
          break;
        // Add more shape types as needed
      }
    }
  }

  /**
   * Draw a line based on relative coordinates
   */
  private drawLine(line: any, width: number, height: number): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = line.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(line, width, height);

    // Convert relative coordinates to actual coordinates
    const x1 = line.x1 * width - width / 2;
    const y1 = line.y1 * height - height / 2;
    const x2 = line.x2 * width - width / 2;
    const y2 = line.y2 * height - height / 2;

    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Draw a rectangle based on relative coordinates
   */
  private drawRect(rect: any, width: number, height: number): void {
    this.ctx.beginPath();
    this.ctx.fillStyle = rect.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = rect.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(rect, width, height);

    // Convert relative coordinates to actual coordinates
    const x = rect.x * width - width / 2;
    const y = rect.y * height - height / 2;
    const w = rect.width * width;
    const h = rect.height * height;

    this.ctx.rect(x, y, w, h);

    if (rect.fill !== false) {
      this.ctx.fill();
    }
    if (rect.stroke !== false) {
      this.ctx.stroke();
    }
  }

  /**
   * Draw a circle based on relative coordinates
   */
  private drawCircle(circle: any, width: number, height: number): void {
    this.ctx.beginPath();
    this.ctx.fillStyle = circle.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = circle.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(circle, width, height);

    // Convert relative coordinates to actual coordinates
    const x = circle.x * width - width / 2;
    const y = circle.y * height - height / 2;
    const r = circle.radius * Math.min(width, height);

    this.ctx.arc(x, y, r, 0, Math.PI * 2);

    if (circle.fill !== false) {
      this.ctx.fill();
    }
    if (circle.stroke !== false) {
      this.ctx.stroke();
    }
  }

  /**
   * Draw a path based on relative coordinates
   */
  private drawPath(path: any, width: number, height: number): void {
    if (!path.commands || !Array.isArray(path.commands)) return;

    this.ctx.beginPath();
    this.ctx.fillStyle = path.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = path.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(path, width, height);

    for (const cmd of path.commands) {
      const type = cmd.type;

      if (type === "moveTo") {
        const x = cmd.x * width - width / 2;
        const y = cmd.y * height - height / 2;
        this.ctx.moveTo(x, y);
      } else if (type === "lineTo") {
        const x = cmd.x * width - width / 2;
        const y = cmd.y * height - height / 2;
        this.ctx.lineTo(x, y);
      } else if (type === "arc") {
        const x = cmd.x * width - width / 2;
        const y = cmd.y * height - height / 2;
        const r = cmd.radius * Math.min(width, height);
        const startAngle = cmd.startAngle || 0;
        const endAngle = cmd.endAngle || Math.PI * 2;
        const counterclockwise = cmd.counterclockwise || false;
        this.ctx.arc(x, y, r, startAngle, endAngle, counterclockwise);
      }
      // Add more path commands as needed
    }

    if (path.fill !== false) {
      this.ctx.fill();
    }
    if (path.stroke !== false) {
      this.ctx.stroke();
    }
  }

  /**
   * Default rendering for elements without a shape definition
   */
  private renderDefaultElement(width: number, height: number): void {
    // Draw connection lines
    this.ctx.lineWidth = Math.min(2, Math.max(1.5, width * 0.05));
    this.ctx.strokeStyle = "#000000";

    // Left connector line
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-width / 2 + width * 0.2, 0);
    this.ctx.stroke();

    // Right connector line
    this.ctx.beginPath();
    this.ctx.moveTo(width / 2 - width * 0.2, 0);
    this.ctx.lineTo(width / 2, 0);
    this.ctx.stroke();

    // Draw element body (default rectangular shape)
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = Math.min(1.5, Math.max(1, width * 0.04));

    const bodyWidth = width * 0.6;
    const bodyHeight = height * 0.6;

    this.ctx.beginPath();
    this.ctx.rect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
    this.ctx.fill();
    this.ctx.stroke();
  }
}
