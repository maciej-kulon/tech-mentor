import { ElectricalElement } from "../interfaces/electrical-element.interface";

export abstract class BaseElementRenderer {
  constructor(protected ctx: CanvasRenderingContext2D) {}

  abstract render(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void;

  /**
   * Common method to draw an element's label
   */
  protected drawLabel(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    this.ctx.save();
    this.ctx.translate(
      element.x * scale + offsetX + (element.width * scale) / 2,
      element.y * scale + offsetY + element.height * scale + 15 * scale
    );

    this.ctx.font = `${12 * scale}px Arial`;
    this.ctx.fillStyle = "#000000";
    this.ctx.textAlign = "center";
    this.ctx.fillText(element.label, 0, 0);
    this.ctx.restore();
  }

  /**
   * Common method to apply transformations based on element position and rotation
   */
  protected applyTransform(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    this.ctx.save();
    this.ctx.translate(
      element.x * scale + offsetX + (element.width * scale) / 2,
      element.y * scale + offsetY + (element.height * scale) / 2
    );

    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }
  }

  /**
   * Restore canvas context after transformations
   */
  protected restoreContext(): void {
    this.ctx.restore();
  }
}
