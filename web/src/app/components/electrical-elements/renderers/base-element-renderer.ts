import {
  ElectricalElement,
  Label,
  Terminal,
} from "../interfaces/electrical-element.interface";
import { SchemePage } from "../../../components/electrical-cad-canvas/models/scheme-page.model";

export abstract class BaseElementRenderer {
  // Constants for terminal rendering
  protected static readonly TERMINAL_HIGHLIGHT_COLOR = "#2196F3"; // Material Blue
  protected static readonly TERMINAL_HIGHLIGHT_RADIUS = 6; // Base radius in pixels
  protected static readonly TERMINAL_HIGHLIGHT_THRESHOLD = 10; // Base threshold in pixels

  protected activePage: SchemePage;

  constructor(protected ctx: CanvasRenderingContext2D, page?: SchemePage) {
    this.activePage = page || new SchemePage();
  }

  abstract render(
    element: ElectricalElement,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void;

  /**
   * Update the active page reference
   */
  setActivePage(page: SchemePage): void {
    this.activePage = page;
  }

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
    // Need to account for the row label width and column label height
    const labelSize = this.activePage.labelSize;

    this.ctx.save();
    this.ctx.translate(
      element.x * scale + offsetX + labelSize * scale,
      element.y * scale + offsetY + labelSize * scale
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

    // Need to account for the row label width and column label height
    const labelSize = this.activePage.labelSize;

    // Convert mouse coordinates to element space, matching findElementUnderCursor logic
    const mouseElementX = (mouseX - offsetX - labelSize * scale) / scale;
    const mouseElementY = (mouseY - offsetY - labelSize * scale) / scale;

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

    // Need to account for the row label width and column label height
    const labelSize = this.activePage.labelSize;

    // Apply element transform with label offset
    this.ctx.translate(
      element.x * scale + offsetX + labelSize * scale,
      element.y * scale + offsetY + labelSize * scale
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

  /**
   * Highlight a specific label
   */
  public highlightLabel(
    element: ElectricalElement,
    label: Label,
    scale: number,
    offsetX: number,
    offsetY: number,
    isSelected: boolean = false
  ): void {
    this.ctx.save();

    // Position at element's center
    this.ctx.translate(
      element.x * scale + offsetX + (element.width * scale) / 2,
      element.y * scale + offsetY + (element.height * scale) / 2
    );

    // Apply element rotation if any
    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }

    // Position the label relative to the element's center
    const scaledWidth = element.width * scale;
    const scaledHeight = element.height * scale;
    this.ctx.translate(label.x * scaledWidth, label.y * scaledHeight);

    // Calculate base font size relative to the element's base size (unscaled)
    const baseFontSize =
      label.fontSize * Math.min(element.width, element.height);

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

    // Approximate label text width and height
    const text = this.processLabelText(label.text);
    const textWidth = text.length * fontSize * 0.6;
    const textHeight = fontSize * 1.2;

    // Draw highlight rectangle
    this.ctx.beginPath();
    this.ctx.fillStyle = isSelected
      ? "rgba(0, 191, 255, 0.3)" // Selected label - more opaque blue
      : "rgba(0, 191, 255, 0.15)"; // Hovered label - translucent blue
    this.ctx.roundRect(
      -textWidth / 2 - fontSize * 0.3,
      -textHeight / 2 - fontSize * 0.1,
      textWidth + fontSize * 0.6,
      textHeight + fontSize * 0.2,
      fontSize * 0.2
    );
    this.ctx.fill();

    // Add border
    this.ctx.lineWidth = isSelected ? 2 : 1;
    this.ctx.strokeStyle = isSelected
      ? "#00BFFF" // Solid blue for selected
      : "rgba(0, 191, 255, 0.6)"; // More transparent for hover
    this.ctx.stroke();

    this.ctx.restore();
  }
}
