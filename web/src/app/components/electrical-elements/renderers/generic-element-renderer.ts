import {
  ElectricalElement,
  ElectricalElementShape,
  ElectricalElementShapeHighlightOverride,
} from "../interfaces/electrical-element.interface";
import { BaseElementRenderer } from "./base-element-renderer";
import { SchemePage } from "../../../components/electrical-cad-canvas/models/scheme-page.model";

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
    mouseY?: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    // Save the current context state
    this.ctx.save();

    // Apply transformations (position, rotation)
    this.applyTransform(element, scale, offsetX, offsetY);

    const width = element.width * scale;
    const height = element.height * scale;

    // Get the drawing instructions from the element or use default drawing logic
    if (element.shape && Array.isArray(element.shape)) {
      this.renderElementShape(element.shape, width, height, overrides);
    } else {
      // Default rendering if no shape is defined
      this.renderDefaultElement(width, height);
    }

    // Restore context after shape rendering
    this.ctx.restore();

    // Save context again for labels
    this.ctx.save();

    // Draw labels with their own transformation context
    this.drawLabels(element, scale, offsetX, offsetY);

    // Restore context after labels
    this.ctx.restore();

    // Handle terminal highlighting if mouse position is provided
    if (typeof mouseX === "number" && typeof mouseY === "number") {
      this.ctx.save();
      this.highlightNearestTerminal(
        element,
        scale,
        offsetX,
        offsetY,
        mouseX,
        mouseY
      );
      this.ctx.restore();
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
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    for (const part of shape) {
      switch (part.type) {
        case "line":
          this.drawLine(part, width, height, overrides);
          break;
        case "rect":
          this.drawRect(part, width, height, overrides);
          break;
        case "circle":
          this.drawCircle(part, width, height, overrides);
          break;
        case "path":
          this.drawPath(part, width, height, overrides);
          break;
        case "arc":
          this.drawArc(part, width, height, overrides);
          break;
        case "bezier":
          this.drawBezier(part, width, height, overrides);
          break;
      }
    }
  }

  /**
   * Draw a line based on relative coordinates
   */
  private drawLine(
    line: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    this.ctx.beginPath();
    this.ctx.strokeStyle = lineColor
      ? lineColor
      : line.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(line, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

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
  private drawRect(
    rect: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    this.ctx.beginPath();
    this.ctx.fillStyle = rect.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = lineColor || rect.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(rect, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

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
  private drawCircle(
    circle: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    this.ctx.beginPath();
    this.ctx.fillStyle = circle.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = lineColor || circle.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(circle, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

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
  private drawPath(
    path: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    if (!path.commands || !Array.isArray(path.commands)) return;

    this.ctx.beginPath();
    this.ctx.fillStyle = path.fillStyle || "#FFFFFF";
    this.ctx.strokeStyle = lineColor || path.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(path, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

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
   * Draw an arc using either center-radius-angle or start-end-radius method
   */
  private drawArc(
    arc: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    this.ctx.beginPath();
    this.ctx.strokeStyle = lineColor || arc.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(arc, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

    if (arc.x !== undefined && arc.radius !== undefined) {
      // Method 1: center point, radius, angles
      const x = arc.x * width - width / 2;
      const y = arc.y * height - height / 2;
      const radius = arc.radius * Math.min(width, height);
      const startAngle = arc.startAngle || 0;
      const endAngle = arc.endAngle || Math.PI * 2;
      const counterclockwise = arc.counterclockwise || false;

      this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    } else if (
      arc.x1 !== undefined &&
      arc.x2 !== undefined &&
      arc.arcRadius !== undefined
    ) {
      // Method 2: start point, end point, radius
      const x1 = arc.x1 * width - width / 2;
      const y1 = arc.y1 * height - height / 2;
      const x2 = arc.x2 * width - width / 2;
      const y2 = arc.y2 * height - height / 2;
      const radius = arc.arcRadius * Math.min(width, height);

      // Calculate center point and angles for the arc
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Ensure the radius is not too small
      if (radius < distance / 2) {
        // If radius is too small, just draw a line
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
      } else {
        // Calculate the center point and angles
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const h = Math.sqrt(radius * radius - (distance * distance) / 4);
        const angle = Math.atan2(dy, dx);

        // Choose the center point (there are two possible points)
        const centerX = midX - h * Math.sin(angle);
        const centerY = midY + h * Math.cos(angle);

        // Calculate start and end angles
        const startAngle = Math.atan2(y1 - centerY, x1 - centerX);
        const endAngle = Math.atan2(y2 - centerY, x2 - centerX);

        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      }
    }

    if (arc.fillStyle !== "none") {
      this.ctx.fillStyle = arc.fillStyle || "#FFFFFF";
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  /**
   * Draw a bezier curve based on relative coordinates
   */
  private drawBezier(
    bezier: any,
    width: number,
    height: number,
    overrides?: ElectricalElementShapeHighlightOverride
  ): void {
    const { lineWidthMultiplier, lineColor } = overrides || {};
    this.ctx.beginPath();
    this.ctx.strokeStyle = lineColor || bezier.strokeStyle || "#000000";
    this.ctx.lineWidth = this.calculateLineWidth(bezier, width, height);
    this.ctx.lineWidth = lineWidthMultiplier
      ? this.ctx.lineWidth * lineWidthMultiplier
      : this.ctx.lineWidth;

    // Convert relative coordinates to actual coordinates
    const x1 = bezier.x1 * width - width / 2;
    const y1 = bezier.y1 * height - height / 2;
    const cp1x = bezier.cp1x * width - width / 2;
    const cp1y = bezier.cp1y * height - height / 2;
    const cp2x = bezier.cp2x * width - width / 2;
    const cp2y = bezier.cp2y * height - height / 2;
    const x2 = bezier.x2 * width - width / 2;
    const y2 = bezier.y2 * height - height / 2;

    this.ctx.moveTo(x1, y1);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    this.ctx.stroke();
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

  /**
   * Render highlight for an element
   */
  renderHighlight(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number,
    opacity: number
  ): void {
    console.log("Rendering highlight:", {
      element,
      scale,
      offsetX,
      offsetY,
      opacity,
    });

    // Save current context state
    this.ctx.save();

    // Apply transformations (position, rotation)
    this.applyTransform(element, scale, offsetX, offsetY);

    const width = element.width * scale;
    const height = element.height * scale;

    // Set highlight style
    this.ctx.strokeStyle = `rgba(135, 206, 235, ${opacity})`; // sky blue with given opacity
    this.ctx.lineWidth = Math.max(2, width * 0.1); // Ensure highlight is visible

    // Draw highlight rectangle centered around the element
    this.ctx.strokeRect(-width / 2, -height / 2, width, height);

    // Restore context
    this.ctx.restore();
  }

  /**
   * Default highlight rendering for elements without a shape definition
   */
  private renderDefaultElementHighlight(width: number, height: number): void {
    // Draw connection lines
    this.ctx.beginPath();
    this.ctx.moveTo(-width / 2, 0);
    this.ctx.lineTo(-width / 2 + width * 0.2, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(width / 2 - width * 0.2, 0);
    this.ctx.lineTo(width / 2, 0);
    this.ctx.stroke();

    // Draw element body outline
    const bodyWidth = width * 0.6;
    const bodyHeight = height * 0.6;

    this.ctx.beginPath();
    this.ctx.rect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);
    this.ctx.stroke();
  }
}
