import {
  ElectricalElement,
  Label,
  Terminal,
} from "../interfaces/electrical-element.interface";

export abstract class BaseElementRenderer {
  // Constants for terminal rendering
  protected static readonly TERMINAL_HIGHLIGHT_COLOR = "#2196F3"; // Material Blue
  protected static readonly TERMINAL_HIGHLIGHT_RADIUS = 6; // Base radius in pixels
  protected static readonly TERMINAL_HIGHLIGHT_THRESHOLD = 10; // Base threshold in pixels

  constructor(protected ctx: CanvasRenderingContext2D) {}

  abstract render(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void;

  /**
   * Common method to draw all element's labels
   */
  protected drawLabels(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    if (!element.labels) return;

    this.ctx.save();
    this.ctx.translate(
      element.x * scale + offsetX + (element.width * scale) / 2,
      element.y * scale + offsetY + (element.height * scale) / 2
    );

    // Apply element rotation if any
    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }

    // Draw each label
    element.labels.forEach((label) => {
      this.drawLabel(label, element.width, element.height, scale);
    });

    this.ctx.restore();
  }

  /**
   * Draw a single label with its properties
   */
  private drawLabel(
    label: Label,
    elementWidth: number,
    elementHeight: number,
    scale: number
  ): void {
    this.ctx.save();

    // Position the label relative to the element's center
    const scaledWidth = elementWidth * scale;
    const scaledHeight = elementHeight * scale;
    this.ctx.translate(label.x * scaledWidth, label.y * scaledHeight);

    // Calculate base font size relative to the element's base size (unscaled)
    const baseFontSize = label.fontSize * Math.min(elementWidth, elementHeight);

    // Apply scale to get the final font size
    let fontSize = baseFontSize * scale;

    // Apply min/max constraints if specified, also scaled
    if (label.minSize) {
      const scaledMinSize = label.minSize * scale;
      fontSize = Math.max(fontSize, scaledMinSize);
    }
    if (label.maxSize) {
      const scaledMaxSize = label.maxSize * scale;
      fontSize = Math.min(fontSize, scaledMaxSize);
    }

    // Apply font properties
    this.ctx.font = `${label.fontWeight} ${fontSize}px ${label.fontFamily}`;
    this.ctx.fillStyle = label.fontColor;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    // Handle variable references
    const text = this.processLabelText(label.text);
    this.ctx.fillText(text, 0, 0);

    this.ctx.restore();
  }

  /**
   * Process label text to handle variable references
   */
  private processLabelText(text: string): string {
    // Replace @variable with actual values if available
    // For now, just remove the @ symbol
    return text.replace(/@(\w+)/g, "$1");
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
    // Need to account for the row label width and column label height which are 24 pixels each
    const LABEL_SIZE = 24;

    this.ctx.save();
    this.ctx.translate(
      element.x * scale + offsetX + LABEL_SIZE * scale,
      element.y * scale + offsetY + LABEL_SIZE * scale
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

  /**
   * Check if mouse is near any terminal and highlight the closest one
   */
  protected highlightNearestTerminal(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number,
    mouseX: number,
    mouseY: number
  ): void {
    if (!element.terminals?.length) return;

    let closestTerminal: Terminal | null = null;
    let minDistance = Infinity;
    const threshold = this.getTerminalThreshold(scale);

    // Need to account for the row label width and column label height which are 24 pixels each
    const LABEL_SIZE = 24;

    // Convert mouse coordinates to element space, matching findElementUnderCursor logic
    const mouseElementX = (mouseX - offsetX - LABEL_SIZE * scale) / scale;
    const mouseElementY = (mouseY - offsetY - LABEL_SIZE * scale) / scale;

    // Apply rotation matrix for terminal positions
    const cosRotation = Math.cos((element.rotation * Math.PI) / 180);
    const sinRotation = Math.sin((element.rotation * Math.PI) / 180);

    for (const terminal of element.terminals) {
      // Calculate terminal position in element space
      const terminalX = element.x + (terminal.x - 0.5) * element.width;
      const terminalY = element.y + (terminal.y - 0.5) * element.height;

      // Apply rotation around element center
      const relX = terminalX - element.x;
      const relY = terminalY - element.y;
      const rotatedX = element.x + (relX * cosRotation - relY * sinRotation);
      const rotatedY = element.y + (relX * sinRotation + relY * cosRotation);

      // Calculate distance to mouse (in element space)
      const distance = Math.sqrt(
        Math.pow(mouseElementX - rotatedX, 2) +
          Math.pow(mouseElementY - rotatedY, 2)
      );

      if (distance < threshold && distance < minDistance) {
        minDistance = distance;
        closestTerminal = terminal;
      }
    }

    // Draw highlight for closest terminal if within threshold
    if (closestTerminal) {
      this.drawTerminalHighlight(
        element,
        closestTerminal,
        scale,
        offsetX,
        offsetY
      );
    }
  }

  /**
   * Draw highlight for a terminal
   */
  private drawTerminalHighlight(
    element: ElectricalElement,
    terminal: Terminal,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    this.ctx.save();

    // Need to account for the row label width and column label height which are 24 pixels each
    const LABEL_SIZE = 24;

    // Apply element transform with label offset
    this.ctx.translate(
      element.x * scale + offsetX + LABEL_SIZE * scale,
      element.y * scale + offsetY + LABEL_SIZE * scale
    );

    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }

    // Calculate terminal position relative to element center
    const x = (terminal.x - 0.5) * element.width * scale;
    const y = (terminal.y - 0.5) * element.height * scale;

    // Draw highlight
    this.ctx.beginPath();
    this.ctx.fillStyle = BaseElementRenderer.TERMINAL_HIGHLIGHT_COLOR;
    this.ctx.arc(
      x,
      y,
      BaseElementRenderer.TERMINAL_HIGHLIGHT_RADIUS * scale,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.restore();
  }

  /**
   * Calculate terminal highlight threshold based on scale
   */
  private getTerminalThreshold(scale: number): number {
    // Base threshold is 10 pixels, adjusted by scale
    return (
      BaseElementRenderer.TERMINAL_HIGHLIGHT_THRESHOLD * Math.min(1, scale)
    );
  }
}
