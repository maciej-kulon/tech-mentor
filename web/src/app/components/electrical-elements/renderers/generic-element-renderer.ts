import { Project } from "@app/components/electrical-cad-canvas/models/project.model";
import { DrawOverrides } from "../interfaces/electrical-element.interface";
import { BaseElementRenderer } from "./base-element-renderer";
import { SchemePage } from "@app/components/electrical-cad-canvas/models/scheme-page.model";
import { ElectricalElement } from "../models/electrical-element";
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
    overrides?: DrawOverrides,
    project?: Project,
    page?: SchemePage
  ): void {
    // Save the current context state
    this.ctx.save();

    // Apply element's transform (position and rotation)
    this.applyTransform(element, scale, offsetX, offsetY);

    // Only pass scale in overrides - position is handled by element's transform
    const shapeOverrides: DrawOverrides = {
      ...overrides,
      scale,
    };

    // Use element's draw2d which handles its own positioning
    element.draw2d(this.ctx, shapeOverrides);

    // Restore context after shape rendering
    this.ctx.restore();

    // Save context again for labels
    this.ctx.save();

    // Draw labels with their own transformation context
    this.drawLabels(element, scale, offsetX, offsetY, project, page);

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
