import { Injectable } from '@angular/core';
import { HttpService } from '../../../services/http.service';
import { Label, ShapeType } from '../interfaces/electrical-element.interface';
import { GenericElementRenderer } from '../renderers/generic-element-renderer';
import { ElementFactoryService } from './element-factory.service';
import { SchemePage } from '../../../components/electrical-cad-canvas/models/scheme-page.model';
import { Project } from '@app/components/electrical-cad-canvas/models/project.model';
import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import { ShapeArc } from '../models/shape-arc';
import { ShapeBezier } from '../models/shape-bezier';
import { ShapeCircle } from '../models/shape-circle';
import { ShapeLine } from '../models/shape-line';
import { ShapePath } from '../models/shape-path';
import { ShapeRect } from '../models/shape-rect';
import { ElectricalElement } from '../models/electrical-element';
@Injectable({
  providedIn: 'root',
})
export class ElectricalElementsRendererService {
  private renderer!: GenericElementRenderer;
  private elements: ElectricalElement[] = [];
  private selectedElements = new Set<ElectricalElement>();
  private hoveredElement: ElectricalElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isElementsLoaded = false;
  private mouseX = 0;
  private mouseY = 0;
  private draggedElements: Set<ElectricalElement> | null = null;
  private originalElementPositions: Map<
    ElectricalElement,
    { x: number; y: number }
  > | null = null;
  private activePage!: SchemePage;
  private hoveredLabel: { element: ElectricalElement; label: Label } | null =
    null;
  private selectedLabel: { element: ElectricalElement; label: Label } | null =
    null;
  private draggedLabel: { element: ElectricalElement; label: Label } | null =
    null;
  private originalLabelPosition: { x: number; y: number } | null = null;

  constructor(
    private httpService: HttpService,
    private elementFactory: ElementFactoryService
  ) {
    // Start loading templates in the background
    this.elementFactory.getTemplates().catch(error => {
      console.error('Error preloading templates:', error);
    });
  }

  /**
   * Initialize the service with canvas context
   */
  initialize(ctx: CanvasRenderingContext2D, page?: SchemePage): void {
    console.log('Initializing renderer with context:', ctx);
    this.ctx = ctx;

    // Initialize with default page if not provided
    this.activePage = page || new SchemePage();

    // Initialize the generic renderer
    this.renderer = new GenericElementRenderer(ctx, this.activePage);

    // Load elements from JSON file if not already loaded
    if (!this.isElementsLoaded) {
      this.loadElementsFromJSON();
    }
  }

  /**
   * Load electrical elements from JSON file
   */
  private async loadElementsFromJSON(): Promise<void> {
    const elements = await this.httpService.get<ElectricalElement[]>(
      'assets/data/mock-elements.json'
    );

    this.elements = elements.map(rawElement => {
      const element = new ElectricalElement({
        ...rawElement,
        shape: this.createDrawableElements(rawElement),
      });

      // Assign page to element based on its position
      this.assignElementPage(element);

      return element;
    });

    this.isElementsLoaded = true;

    // Force redraw if canvas context is available
    if (this.ctx) {
      this.renderElements(1, 0, 0); // Default values for scale and offset
    }
  }

  /**
   * Helper to assign the correct page to an element based on its position
   */
  private assignElementPage(element: ElectricalElement): void {
    // Use the element's center position
    const x = element.x;
    const y = element.y;
    const page = this.getTopmostPageAtPoint(x, y);
    element.page = page || undefined;
  }

  /**
   * Find the topmost page at the given coordinates
   */
  private getTopmostPageAtPoint(x: number, y: number): SchemePage | null {
    // Check if point is inside the active page
    if (this.activePage) {
      // Use the containsPoint method from SchemePage
      if (this.activePage.containsPoint(x, y)) {
        return this.activePage;
      }
    }

    return null;
  }

  private createDrawableElements(element: any): IDrawable2D[] | undefined {
    if (!element.shape || !Array.isArray(element.shape)) {
      console.error('Tried to load element without shape', { element });
      return;
    }

    const shapes: IDrawable2D[] = [];
    for (const shape of element.shape) {
      try {
        // Skip invalid shapes
        if (!shape || typeof shape !== 'object' || !shape.type) {
          console.warn('Invalid shape object:', shape);
          continue;
        }

        // Ensure common properties exist with defaults
        shape.lineWidth = shape.lineWidth || 1;
        shape.minWidth = shape.minWidth || 0.5;
        shape.maxWidth = shape.maxWidth || 3;
        shape.strokeStyle = shape.strokeStyle || '#000000';
        shape.fillStyle = shape.fillStyle || '#FFFFFF';

        let newShape: IDrawable2D | null = null;
        switch (shape.type) {
          case ShapeType.Arc:
            shape.radius = shape.radius || 10;
            shape.startAngle = shape.startAngle || 0;
            shape.endAngle = shape.endAngle || Math.PI * 2;
            newShape = new ShapeArc(shape);
            break;
          case ShapeType.Bezier:
            // Ensure all bezier control points
            shape.x1 = shape.x1 || 0;
            shape.y1 = shape.y1 || 0;
            shape.x2 = shape.x2 || 0;
            shape.y2 = shape.y2 || 0;
            shape.cp1x = shape.cp1x || 0;
            shape.cp1y = shape.cp1y || 0;
            shape.cp2x = shape.cp2x || 0;
            shape.cp2y = shape.cp2y || 0;
            newShape = new ShapeBezier(shape);
            break;
          case ShapeType.Circle:
            shape.x = shape.x || 0;
            shape.y = shape.y || 0;
            shape.radius = shape.radius || 10;
            newShape = new ShapeCircle(shape);
            break;
          case ShapeType.Line:
            shape.x1 = shape.x1 || 0;
            shape.y1 = shape.y1 || 0;
            shape.x2 = shape.x2 || 0;
            shape.y2 = shape.y2 || 0;
            newShape = new ShapeLine(shape);
            break;
          case ShapeType.Path:
            shape.x = shape.x || 0;
            shape.y = shape.y || 0;
            // Special handling for path to ensure path property exists
            if (!shape.path) {
              console.warn('Path shape missing path property:', shape);
              shape.path = { commands: [] }; // Provide default empty path
            } else if (!shape.path.commands) {
              console.warn('Path shape missing commands array:', shape);
              shape.path.commands = []; // Provide default empty commands array
            } else if (!Array.isArray(shape.path.commands)) {
              console.warn(
                'Path shape has invalid commands (not an array):',
                shape
              );
              shape.path.commands = []; // Reset to empty array
            }

            // Make sure each command has required properties
            if (Array.isArray(shape.path.commands)) {
              shape.path.commands = shape.path.commands.filter((cmd: any) => {
                if (!cmd || typeof cmd !== 'object' || !cmd.type) {
                  console.warn('Filtering out invalid path command:', cmd);
                  return false;
                }
                // Ensure x and y exist
                cmd.x = cmd.x ?? 0;
                cmd.y = cmd.y ?? 0;
                return true;
              });
            }

            newShape = new ShapePath(shape);
            break;
          case ShapeType.Rectangle:
            shape.x = shape.x || 0;
            shape.y = shape.y || 0;
            shape.width = shape.width || 10;
            shape.height = shape.height || 10;
            newShape = new ShapeRect(shape);
            break;
          default:
            console.warn(`Unknown element type: ${shape.type}`);
            continue;
        }

        if (newShape) {
          shapes.push(newShape);
        }
      } catch (error) {
        console.error(
          `Error creating shape of type ${shape?.type || 'unknown'}:`,
          error
        );
      }
    }

    return shapes;
  }

  /**
   * Find the smallest element under the given coordinates
   */
  findElementUnderCursor(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ): ElectricalElement | null {
    if (!this.elements || this.elements.length === 0) return null;

    const labelSize = this.activePage.labelSize || 0;
    // Convert screen coordinates to element coordinates
    // The labelSize offset is needed to match the drawing transform
    const elementX = (x - offsetX - labelSize * scale) / scale;
    const elementY = (y - offsetY - labelSize * scale) / scale;

    // Filter elements that contain the point using isPointOver
    const elementsUnderCursor = this.elements.filter(element => {
      return element.isPointOver({ x: elementX, y: elementY });
    });

    // Log the detection for debugging
    if (elementsUnderCursor.length > 0) {
      console.log(
        `Found ${elementsUnderCursor.length} elements under cursor at (${elementX}, ${elementY})`
      );
    }

    if (elementsUnderCursor.length === 0) return null;

    // Find the smallest element by area
    let smallest = elementsUnderCursor[0];
    for (let i = 1; i < elementsUnderCursor.length; i++) {
      const current = elementsUnderCursor[i];
      const currentArea = current.width * current.height;
      const smallestArea = smallest.width * smallest.height;
      if (currentArea < smallestArea) {
        smallest = current;
      }
    }
    return smallest;
  }

  /**
   * Find label under cursor and its parent element
   */
  findLabelUnderCursor(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ): { element: ElectricalElement; label: Label } | null {
    // Check each element's labels
    for (const element of this.elements) {
      if (!element.labels?.length) continue;

      // In the updated drawLabels method, the translation is now:
      // element.x * scale + offsetX, element.y * scale + offsetY
      const centerX = element.x * scale + offsetX;
      const centerY = element.y * scale + offsetY;

      // Transform mouse coordinates to be relative to the element's center
      // This effectively reverses the translation in drawLabels
      let relativeX = x - centerX;
      let relativeY = y - centerY;

      // If element is rotated, apply inverse rotation to mouse coordinates
      if (element.rotation !== 0) {
        const angle = (-element.rotation * Math.PI) / 180; // Negative for inverse
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        // Apply inverse rotation matrix
        const rotX = relativeX * cos - relativeY * sin;
        const rotY = relativeX * sin + relativeY * cos;

        relativeX = rotX;
        relativeY = rotY;
      }

      // Check each label in element's local space
      for (const label of element.labels) {
        // Use direct label position values from mock-elements.json, only scaled by the view scale
        const labelPosX = label.x * scale;
        const labelPosY = label.y * scale;

        // Calculate font size as done in drawLabel
        let fontSize =
          label.fontSize * Math.min(element.width, element.height) * scale;

        if (label.minSize) {
          const scaledMinSize = label.minSize * scale;
          fontSize = Math.max(fontSize, scaledMinSize);
        }
        if (label.maxSize) {
          const scaledMaxSize = label.maxSize * scale;
          fontSize = Math.min(fontSize, scaledMaxSize);
        }

        // Set font for measurement
        if (this.ctx) {
          this.ctx.font = `${label.fontWeight} ${fontSize}px ${label.fontFamily}`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
        }

        // Get processed label text (use renderer's public method if available, fallback to raw text)
        let text = label.text;
        if (
          this.renderer &&
          typeof this.renderer.getProcessedLabelText === 'function'
        ) {
          text = this.renderer.getProcessedLabelText(label, {
            element,
            page: element.page,
            project: undefined,
          });
        }
        // Use measureText for accurate width
        let textWidth = fontSize * 2; // fallback
        if (this.ctx) {
          textWidth = this.ctx.measureText(text).width;
        }
        const textHeight = fontSize;
        const paddingX = fontSize * 0.3;
        const paddingY = fontSize * 0.2;

        // Check if transformed mouse position is inside label bounds
        if (
          relativeX >= labelPosX - textWidth / 2 - paddingX &&
          relativeX <= labelPosX + textWidth / 2 + paddingX &&
          relativeY >= labelPosY - textHeight / 2 - paddingY &&
          relativeY <= labelPosY + textHeight / 2 + paddingY
        ) {
          return { element, label };
        }
      }
    }

    return null;
  }

  /**
   * Handle element selection
   */
  handleElementSelection(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number,
    isMultiSelect: boolean
  ): void {
    // Check for label first
    const labelUnderCursor = this.findLabelUnderCursor(
      x,
      y,
      scale,
      offsetX,
      offsetY
    );

    // If a label was clicked, its parent element is selected
    if (labelUnderCursor) {
      // Store the selected label for double-click handling
      this.selectedLabel = labelUnderCursor;

      // Store the previous selection state
      const previousSelection = new Set(this.selectedElements);

      const elementUnderCursor = labelUnderCursor.element;

      if (isMultiSelect) {
        // Multi-select mode
        if (this.selectedElements.has(elementUnderCursor)) {
          this.selectedElements.delete(elementUnderCursor);
        } else {
          this.selectedElements.add(elementUnderCursor);
        }
      } else {
        // Single select mode
        this.selectedElements = new Set([elementUnderCursor]);
      }

      // Only update hover if selection actually changed
      if (!this.setsAreEqual(previousSelection, this.selectedElements)) {
        this.updateMousePosition(x, y, scale, offsetX, offsetY);
      }

      return;
    } else {
      // Clear selected label if clicking elsewhere
      this.selectedLabel = null;
    }

    // If no label was clicked, continue with regular element selection
    const elementUnderCursor = this.findElementUnderCursor(
      x,
      y,
      scale,
      offsetX,
      offsetY
    );

    // Store the previous selection state
    const previousSelection = new Set(this.selectedElements);

    if (!elementUnderCursor) {
      // Clicked on empty space - clear selection
      if (this.selectedElements.size > 0) {
        this.selectedElements.clear();
      }
    } else if (isMultiSelect) {
      // Multi-select mode
      if (this.selectedElements.has(elementUnderCursor)) {
        this.selectedElements.delete(elementUnderCursor);
      } else {
        this.selectedElements.add(elementUnderCursor);
      }
    } else {
      // Single select mode
      this.selectedElements = new Set([elementUnderCursor]);
    }

    // Only update hover if selection actually changed
    if (!this.setsAreEqual(previousSelection, this.selectedElements)) {
      this.updateMousePosition(x, y, scale, offsetX, offsetY);
    }
  }

  // Helper function to compare sets
  private setsAreEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }

  /**
   * Update mouse position and handle element hovering
   */
  updateMousePosition(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ): void {
    this.mouseX = x;
    this.mouseY = y;

    // If mouse is outside canvas, clear hover but keep selection
    if (x < 0 || y < 0) {
      this.hoveredElement = null;
      this.hoveredLabel = null;
      return;
    }

    // First check if mouse is over any label
    const labelUnderCursor = this.findLabelUnderCursor(
      x,
      y,
      scale,
      offsetX,
      offsetY
    );

    // If hovering over a label, also highlight its parent element
    if (labelUnderCursor) {
      // Clear previous hover state if exists
      if (
        this.hoveredLabel &&
        (this.hoveredLabel.element.id !== labelUnderCursor.element.id ||
          this.hoveredLabel.label.name !== labelUnderCursor.label.name)
      ) {
        console.log(
          `🖱️ Left label: ${this.hoveredLabel.element.id}:${this.hoveredLabel.label.name}`
        );
      }

      // Update hover state for label and its parent element
      console.log(
        `🖱️ Entered label: ${labelUnderCursor.element.id}:${labelUnderCursor.label.name}`
      );
      this.hoveredLabel = labelUnderCursor;

      // Only highlight parent element if not selected
      if (!this.selectedElements.has(labelUnderCursor.element)) {
        this.hoveredElement = labelUnderCursor.element;
      } else {
        this.hoveredElement = null;
      }

      return;
    } else {
      // Clear label hover state if no label is under cursor
      if (this.hoveredLabel) {
        console.log(
          `🖱️ Left label: ${this.hoveredLabel.element.id}:${this.hoveredLabel.label.name}`
        );
        this.hoveredLabel = null;
      }
    }

    // If not hovering over a label, check for elements as before
    const elementUnderCursor = this.findElementUnderCursor(
      x,
      y,
      scale,
      offsetX,
      offsetY
    );

    // Update hover state
    if (elementUnderCursor !== this.hoveredElement) {
      // Clear previous hover state if exists
      if (this.hoveredElement) {
        console.log(`🖱️ Left element: ${this.hoveredElement.id}`);
      }

      // Only show hover for non-selected elements
      if (
        elementUnderCursor &&
        !this.selectedElements.has(elementUnderCursor)
      ) {
        console.log(`🖱️ Entered element: ${elementUnderCursor.id}`);
        this.hoveredElement = elementUnderCursor;
      } else {
        this.hoveredElement = null;
      }
    }
  }

  /**
   * Render all electrical elements
   */
  renderElements(
    scale: number,
    offsetX: number,
    offsetY: number,
    project?: Project
  ): void {
    if (!this.ctx || !this.renderer) {
      console.warn('Cannot render: missing context or renderer');
      return;
    }

    // Take a snapshot of the current state to prevent any changes during render
    const currentSelection = new Set(this.selectedElements);
    const currentHovered = this.hoveredElement;
    const currentHoveredLabel = this.hoveredLabel;
    const currentSelectedLabel = this.selectedLabel;

    // Render each element using the generic renderer
    this.elements.forEach(element => {
      const isSelected = currentSelection.has(element);
      const isHovered = !isSelected && element === currentHovered;
      const elementPage = element.page || null;

      // First render highlight if element is selected or hovered
      if (isSelected || isHovered) {
        this.renderer.render(
          element,
          scale,
          offsetX,
          offsetY,
          this.mouseX,
          this.mouseY,
          {
            lineWidthMultiplier: isSelected ? 4 : isHovered ? 3 : undefined,
            lineColor: isSelected
              ? '#00BFFF'
              : isHovered
                ? 'rgba(0, 191, 255, 0.5)'
                : undefined,
          },
          project
        );
      }

      // Then render the element itself
      this.renderer.render(
        element,
        scale,
        offsetX,
        offsetY,
        this.mouseX,
        this.mouseY,
        undefined,
        project
      );

      // Render label highlights if needed
      if (element.labels?.length) {
        // Check for hovered label
        if (
          currentHoveredLabel &&
          currentHoveredLabel.element.id === element.id
        ) {
          const labelToHighlight = element.labels.find(
            l => l.name === currentHoveredLabel.label.name
          );
          if (labelToHighlight) {
            this.renderer.highlightLabel(
              element,
              labelToHighlight,
              scale,
              offsetX,
              offsetY,
              false, // isSelected = false for hover
              project,
              elementPage
            );
          }
        }

        // Check for selected label
        if (
          currentSelectedLabel &&
          currentSelectedLabel.element.id === element.id
        ) {
          const labelToHighlight = element.labels.find(
            l => l.name === currentSelectedLabel.label.name
          );
          if (labelToHighlight) {
            this.renderer.highlightLabel(
              element,
              labelToHighlight,
              scale,
              offsetX,
              offsetY,
              true, // isSelected = true for selection
              project,
              elementPage
            );
          }
        }
      }
    });
  }

  /**
   * Set elements being dragged
   */
  setDraggedElements(elements: Set<ElectricalElement>): void {
    this.draggedElements = elements;
    // Store original positions for dragging
    this.originalElementPositions = new Map();
    elements.forEach(element => {
      this.originalElementPositions?.set(element, {
        x: element.x,
        y: element.y,
      });
    });
  }

  /**
   * Move dragged elements by the specified delta
   */
  moveElements(dx: number, dy: number): void {
    if (!this.draggedElements) return;

    // If originalElementPositions is null, initialize it now
    if (!this.originalElementPositions) {
      this.originalElementPositions = new Map();
      this.draggedElements.forEach(element => {
        this.originalElementPositions!.set(element, {
          x: element.x,
          y: element.y,
        });
      });
    }

    this.draggedElements.forEach(element => {
      const original = this.originalElementPositions!.get(element);
      if (original) {
        element.x = original.x + dx;
        element.y = original.y + dy;
      }
    });
    this.draw();
  }

  /**
   * Clear dragged elements state
   */
  clearDraggedElements(): void {
    this.draggedElements = null;
  }

  /**
   * Get currently selected elements
   */
  getSelectedElements(): Set<ElectricalElement> {
    // Return a new Set to avoid external modifications
    return new Set(this.selectedElements);
  }

  /**
   * Add a new element to the canvas
   */
  addElement(element: ElectricalElement): void {
    this.elements.push(element);
  }

  /**
   * Get all elements
   */
  getElements(): ElectricalElement[] {
    return [...this.elements];
  }

  /**
   * Update the active page reference
   */
  setActivePage(page: SchemePage): void {
    this.activePage = page;
    if (this.renderer) {
      this.renderer.setActivePage(page);
    }
  }

  // Add methods to get the current hovered/selected label
  public getHoveredLabel(): {
    element: ElectricalElement;
    label: Label;
  } | null {
    return this.hoveredLabel;
  }

  public getSelectedLabel(): {
    element: ElectricalElement;
    label: Label;
  } | null {
    return this.selectedLabel;
  }

  // --- FIX: Helper to check if an element is selected ---
  public isElementSelected(element: ElectricalElement): boolean {
    return Array.from(this.selectedElements).some(el => el.id === element.id);
  }

  /**
   * Set label being dragged
   */
  setDraggedLabel(
    labelInfo: { element: ElectricalElement; label: Label } | null
  ): void {
    this.draggedLabel = labelInfo;
    // No need to store original position since we're using incremental deltas
  }

  /**
   * Move dragged label by the specified delta
   */
  moveLabel(dx: number, dy: number): void {
    if (!this.draggedLabel) return;

    // Calculate the new position
    const label = this.draggedLabel.label;
    label.x += dx;
    label.y += dy;
  }

  /**
   * Clear dragged label state
   */
  clearDraggedLabel(): void {
    this.draggedLabel = null;
  }

  /**
   * Get currently dragged label
   */
  getDraggedLabel(): { element: ElectricalElement; label: Label } | null {
    return this.draggedLabel;
  }

  /**
   * Update the position of the dragged label
   */
  updateDraggedLabelPosition(deltaX: number, deltaY: number): void {
    if (!this.draggedLabel) return;

    const { label } = this.draggedLabel;

    // Apply the delta incrementally to the current position
    label.x += deltaX;
    label.y += deltaY;

    // We don't call draw() here as it will be handled by the component
  }

  /**
   * Update the position of dragged elements
   */
  updateDraggedElementsPosition(deltaX: number, deltaY: number): void {
    if (!this.draggedElements) return;

    this.draggedElements.forEach(element => {
      // Apply incremental delta to current position
      element.x += deltaX;
      element.y += deltaY;
    });

    // No need to call draw() here - component will handle it
  }

  public getHoveredElement(): ElectricalElement | null {
    return this.hoveredElement;
  }

  public getElementAtPoint(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number
  ): ElectricalElement | null {
    if (!this.elements) return null;

    // Account for label size in hit testing
    const labelSize = this.activePage.labelSize || 0;
    const adjustedX = (x - offsetX - labelSize * scale) / scale;
    const adjustedY = (y - offsetY - labelSize * scale) / scale;

    for (const element of this.elements) {
      if (element.isPointOver({ x: adjustedX, y: adjustedY })) {
        return element;
      }
    }

    return null;
  }

  private draw(): void {
    if (this.ctx) {
      this.renderElements(1, 0, 0);
    }
  }
}
