import { Label, Terminal } from '../interfaces/electrical-element.interface';
import { SchemePage } from '../../../components/electrical-cad-canvas/models/scheme-page.model';
import { ElectricalElement } from '../models/electrical-element';
import { Project } from '../../../components/electrical-cad-canvas/models/project.model';

export abstract class BaseElementRenderer {
  // Constants for terminal rendering
  protected static readonly TERMINAL_HIGHLIGHT_COLOR = '#2196F3'; // Material Blue
  protected static readonly TERMINAL_HIGHLIGHT_RADIUS = 6; // Base radius in pixels
  protected static readonly TERMINAL_HIGHLIGHT_THRESHOLD = 10; // Base threshold in pixels

  protected activePage: SchemePage;

  constructor(
    protected ctx: CanvasRenderingContext2D,
    page?: SchemePage
  ) {
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
    offsetY: number,
    project?: Project,
    page?: SchemePage
  ): void {
    if (!element.labels) return;

    this.ctx.save();
    // The element's center should be at (x, y) visually, but the shape's center is at centerOffset
    // So we translate to element position, then adjust for the center offset
    this.ctx.translate(
      element.x * scale + offsetX,
      element.y * scale + offsetY
    );

    // Apply element rotation if any
    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }

    // Always use element.page if present, otherwise fallback to passed-in page
    const labelPage = element.page || page;

    // Draw each label
    element.labels.forEach(label => {
      this.drawLabel(
        label,
        element.width,
        element.height,
        scale,
        element,
        project,
        labelPage
      );
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
    scale: number,
    element: ElectricalElement,
    project?: Project,
    page?: SchemePage
  ): void {
    this.ctx.save();

    // Position the label relative to the element's center
    // Use direct label position values from mock-elements.json, only scaled by the view scale
    this.ctx.translate(label.x * scale, label.y * scale);

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
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Handle variable references
    const text = this.processLabelText(label.text, {
      project: project,
      page: page,
      element: element,
    });
    this.ctx.fillText(text, 0, 0);

    this.ctx.restore();
  }

  /**
   * Process label text to handle variable references, supporting both old (@var.prop) and new (@{...}) syntax.
   * In @{...}, any character can be escaped with \ (including dot, braces, etc.).
   * Supports array indices (e.g., @{foo.bar[0]}).
   * Unresolved variables are left as-is.
   *
   * FIX: Now supports a single backslash (e.g. \. in the text) as an escape for the next character, and the backslash is not rendered in the output.
   */
  protected processLabelText(
    text: string,
    context: { project?: any; page?: any; element?: any }
  ): string {
    // Step 1: Replace @@ with a placeholder
    const AT_PLACEHOLDER = '__AT__';
    let processed = text.replace(/@@/g, AT_PLACEHOLDER);

    // Step 2: Replace @{...} syntax (with universal escaping)
    processed = processed.replace(/@\{((?:[^\\}]|\\.)*)\}/g, (match, inner) => {
      // Parse the property chain, removing escapes for output
      let propChain = '';
      let i = 0;
      while (i < inner.length) {
        if (inner[i] === '\\' && i + 1 < inner.length) {
          propChain += inner[i + 1]; // Add only the escaped character
          i += 2;
        } else {
          propChain += inner[i];
          i++;
        }
      }
      // Resolve the property chain (with array indices)
      const value = this.resolvePropertyChain(propChain, context);
      return value !== undefined && value !== null ? String(value) : match;
    });

    // Step 3: Replace @variable or @object.property references (old style)
    processed = processed.replace(/@([a-zA-Z_][\w.]+)/g, (match, variable) => {
      // Support dot notation
      const parts = variable.split('.');
      let value: any = undefined;
      if (parts.length === 1) {
        // Try element property first
        value = context.element && context.element[parts[0]];
        if (value === undefined) {
          // Try page
          value = context.page && context.page[parts[0]];
        }
        if (value === undefined) {
          // Try project
          value = context.project && context.project[parts[0]];
        }
      } else {
        // Try object.property chain
        let root = undefined;
        if (parts[0] === 'element') root = context.element;
        else if (parts[0] === 'page') root = context.page;
        else if (parts[0] === 'project') root = context.project;
        if (root) {
          value = parts
            .slice(1)
            .reduce(
              (obj: any, key: string) =>
                obj && obj[key] !== undefined ? obj[key] : undefined,
              root
            );
        }
      }
      // If value is undefined/null, leave as-is
      return value !== undefined && value !== null ? String(value) : match;
    });

    // Step 4: Restore @@ placeholders to @
    processed = processed.replace(new RegExp(AT_PLACEHOLDER, 'g'), '@');

    // Step 5: Remove any remaining escape backslashes (e.g., \. -> .)
    processed = processed.replace(/\\(.)/g, '$1');
    return processed;
  }

  /**
   * Helper to resolve a property chain with dot notation and array indices, e.g. foo.bar[0].baz
   * Handles property names with dots/braces if escaped in the input.
   * Does not execute arbitrary JS code.
   *
   * FIX: Now expects the input chain to have all escapes removed (handled in processLabelText).
   */
  private resolvePropertyChain(
    chain: string,
    context: { project?: any; page?: any; element?: any }
  ): any {
    // Split by dot, but ignore dots inside brackets (for array indices)
    const parts: string[] = [];
    let current = '';
    let inBracket = false;
    for (let i = 0; i < chain.length; i++) {
      if (!inBracket && chain[i] === '.') {
        parts.push(current);
        current = '';
      } else if (chain[i] === '[' && !inBracket) {
        inBracket = true;
        current += chain[i];
      } else if (chain[i] === ']' && inBracket) {
        inBracket = false;
        current += chain[i];
      } else {
        current += chain[i];
      }
    }
    if (current.length > 0) parts.push(current);

    // Determine root
    let root: any = undefined;
    if (parts[0] === 'element') root = context.element;
    else if (parts[0] === 'page') root = context.page;
    else if (parts[0] === 'project') root = context.project;
    else {
      // Try element, then page, then project
      root =
        context.element && context.element[parts[0]] !== undefined
          ? context.element
          : context.page && context.page[parts[0]] !== undefined
            ? context.page
            : context.project && context.project[parts[0]] !== undefined
              ? context.project
              : undefined;
      if (!root) return undefined;
    }

    let value = root;
    for (
      let i =
        root === context.element ||
        root === context.page ||
        root === context.project
          ? 1
          : 0;
      i < parts.length;
      i++
    ) {
      const part = parts[i];
      // Handle array indices, e.g. foo[0]
      const arrayMatch = part.match(/^([\w$]+)\[(\d+)\]$/);
      if (arrayMatch) {
        const prop = arrayMatch[1];
        const idx = parseInt(arrayMatch[2], 10);
        value =
          value && value[prop] && Array.isArray(value[prop])
            ? value[prop][idx]
            : undefined;
      } else {
        value = value && value[part] !== undefined ? value[part] : undefined;
      }
    }
    return value;
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
    const labelSize = this.activePage.labelSize || 0;

    this.ctx.save();

    // The transform needs to account for:
    // 1. Element position (scaled)
    // 2. Canvas offset (pan position)
    // 3. Label size offset
    // 4. Element is drawn centered at its position (x,y)
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
      // Use direct terminal position values from mock-elements.json
      const terminalX = element.x + terminal.x;
      const terminalY = element.y + terminal.y;

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

    // Use direct terminal position values from mock-elements.json, only scaled by the view scale
    const x = terminal.x * scale;
    const y = terminal.y * scale;

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
    isSelected = false,
    project?: any,
    page?: any
  ): void {
    this.ctx.save();

    // Position at element's center
    this.ctx.translate(
      element.x * scale + offsetX,
      element.y * scale + offsetY
    );

    // Apply element rotation if any
    if (element.rotation !== 0) {
      this.ctx.rotate((element.rotation * Math.PI) / 180);
    }

    // Position the label relative to the element's center
    // Use direct label position values from mock-elements.json, only scaled by the view scale
    this.ctx.translate(label.x * scale, label.y * scale);

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
    const text = this.processLabelText(label.text, {
      project: project,
      page: page,
      element: element,
    });
    const textWidth = text.length * fontSize * 0.6;
    const textHeight = fontSize * 1.2;

    // Draw highlight rectangle
    this.ctx.beginPath();
    this.ctx.fillStyle = isSelected
      ? 'rgba(0, 191, 255, 0.3)' // Selected label - more opaque blue
      : 'rgba(0, 191, 255, 0.15)'; // Hovered label - translucent blue
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
      ? '#00BFFF' // Solid blue for selected
      : 'rgba(0, 191, 255, 0.6)'; // More transparent for hover
    this.ctx.stroke();

    this.ctx.restore();
  }
}
