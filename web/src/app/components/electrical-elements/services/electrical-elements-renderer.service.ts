import { Injectable } from "@angular/core";
import { HttpService } from "../../../services/http.service";
import {
  ElectricalElement,
  Label,
} from "../interfaces/electrical-element.interface";
import { GenericElementRenderer } from "../renderers/generic-element-renderer";
import { ElementFactoryService } from "./element-factory.service";
import { SchemePage } from "../../../components/electrical-cad-canvas/models/scheme-page.model";

@Injectable({
  providedIn: "root",
})
export class ElectricalElementsRendererService {
  private renderer!: GenericElementRenderer;
  private elements: ElectricalElement[] = [];
  private selectedElements: Set<ElectricalElement> = new Set();
  private hoveredElement: ElectricalElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isElementsLoaded = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private draggedElements: Set<ElectricalElement> = new Set();
  private originalPositions: Map<ElectricalElement, { x: number; y: number }> =
    new Map();
  private activePage!: SchemePage;
  private hoveredLabel: { element: ElectricalElement; label: Label } | null =
    null;
  private selectedLabel: { element: ElectricalElement; label: Label } | null =
    null;

  constructor(
    private httpService: HttpService,
    private elementFactory: ElementFactoryService
  ) {
    // Start loading templates in the background
    this.elementFactory.getTemplates().catch((error) => {
      console.error("Error preloading templates:", error);
    });
  }

  /**
   * Initialize the service with canvas context
   */
  initialize(ctx: CanvasRenderingContext2D, page?: SchemePage): void {
    console.log("Initializing renderer with context:", ctx);
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
    try {
      const elements = await this.httpService.get<ElectricalElement[]>(
        "assets/data/mock-elements.json"
      );
      this.elements = elements;
      this.isElementsLoaded = true;

      // Force redraw if canvas context is available
      if (this.ctx) {
        this.renderElements(1, 0, 0); // Default values for scale and offset
      }
    } catch (error) {
      console.error("Error loading electrical elements:", error);
      // Fall back to hardcoded elements in case of error
      this.loadFallbackElements();
    }
  }

  /**
   * Load fallback elements in case JSON loading fails
   */
  private async loadFallbackElements(): Promise<void> {
    const createDefaultLabels = (
      reference: string,
      value?: string
    ): Label[] => {
      const labels: Label[] = [
        {
          name: "reference",
          text: reference,
          fontSize: 14,
          fontFamily: "Arial",
          fontWeight: "bold",
          fontColor: "#000000",
          x: 0.5,
          y: -0.6,
        },
      ];

      if (value) {
        labels.push({
          name: "value",
          text: value,
          fontSize: 12,
          fontFamily: "Arial",
          fontWeight: "normal",
          fontColor: "#000000",
          x: 0.5,
          y: -0.3,
        });
      }

      return labels;
    };

    try {
      // Create elements using the factory service
      const resistor = await this.elementFactory.createElementFromTemplate(
        "resistor-template",
        200,
        150,
        createDefaultLabels("R1", "10kΩ")
      );
      if (resistor) this.elements.push(resistor);

      const capacitor = await this.elementFactory.createElementFromTemplate(
        "capacitor-template",
        200,
        250,
        createDefaultLabels("C1", "100nF")
      );
      if (capacitor) this.elements.push(capacitor);

      const switchElement = await this.elementFactory.createElementFromTemplate(
        "switch-template",
        300,
        150,
        createDefaultLabels("SW1")
      );
      if (switchElement) this.elements.push(switchElement);

      const diode = await this.elementFactory.createElementFromTemplate(
        "diode-template",
        300,
        250,
        createDefaultLabels("D1", "1N4148")
      );
      if (diode) this.elements.push(diode);

      this.isElementsLoaded = true;
    } catch (error) {
      console.error("Error creating fallback elements:", error);
    }
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
    // Convert screen coordinates to element coordinates
    // The labelSize accounts for the row label width and column label height
    // that are drawn on the canvas. These labels take up space at the top and left of the grid,
    // so we need to subtract this offset when converting screen coordinates to element coordinates
    const labelSize = this.activePage.labelSize;
    const elementX = (x - offsetX - labelSize * scale) / scale;
    const elementY = (y - offsetY - labelSize * scale) / scale;

    // Filter elements that contain the point
    const elementsUnderCursor = this.elements.filter((element) => {
      // Calculate element bounds in absolute coordinates, centered around the element position
      const elementLeft = element.x - element.width / 2;
      const elementRight = element.x + element.width / 2;
      const elementTop = element.y - element.height / 2;
      const elementBottom = element.y + element.height / 2;

      return (
        elementX >= elementLeft &&
        elementX <= elementRight &&
        elementY >= elementTop &&
        elementY <= elementBottom
      );
    });

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
    // Get the label size which affects coordinate calculations
    const labelSize = this.activePage.labelSize;

    // Check each element's labels
    for (const element of this.elements) {
      if (!element.labels?.length) continue;

      // In drawLabels method, the translation is:
      // element.x * scale + offsetX + (element.width * scale) / 2,
      // element.y * scale + offsetY + (element.height * scale) / 2
      const centerX = element.x * scale + offsetX + (element.width * scale) / 2;
      const centerY =
        element.y * scale + offsetY + (element.height * scale) / 2;

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
        // In drawLabel method, it translates to label's position with:
        // const scaledWidth = elementWidth * scale;
        // const scaledHeight = elementHeight * scale;
        // this.ctx.translate(label.x * scaledWidth, label.y * scaledHeight);
        const labelPosX = label.x * element.width * scale;
        const labelPosY = label.y * element.height * scale;

        // Calculate font size as done in drawLabel
        let fontSize =
          label.fontSize * Math.min(element.width, element.height) * scale;

        // Apply min/max constraints if specified, with scaling
        if (label.minSize) {
          const scaledMinSize = label.minSize * scale;
          fontSize = Math.max(fontSize, scaledMinSize);
        }
        if (label.maxSize) {
          const scaledMaxSize = label.maxSize * scale;
          fontSize = Math.min(fontSize, scaledMaxSize);
        }

        // Calculate text dimensions same as in highlightLabel
        const labelText = label.text.replace(/@(\w+)/g, "$1");
        const textWidth = labelText.length * fontSize * 0.6;
        const textHeight = fontSize * 1.2;

        // Check if transformed mouse position is inside label bounds
        // Since the label is anchored at its center point
        if (
          relativeX >= labelPosX - textWidth / 2 &&
          relativeX <= labelPosX + textWidth / 2 &&
          relativeY >= labelPosY - textHeight / 2 &&
          relativeY <= labelPosY + textHeight / 2
        ) {
          return { element, label };
        }
      }
    }

    return null;
  }

  // Debug method to track selection changes
  private debugLogSelection(action: string, element?: ElectricalElement) {
    console.log(`🔍 Selection ${action}:`, {
      element: element?.id || "none",
      selectionSize: this.selectedElements.size,
      stack: new Error().stack,
    });
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
      this.debugLogSelection("before selection change");

      const elementUnderCursor = labelUnderCursor.element;

      if (isMultiSelect) {
        // Multi-select mode
        if (this.selectedElements.has(elementUnderCursor)) {
          this.debugLogSelection("removing", elementUnderCursor);
          this.selectedElements.delete(elementUnderCursor);
        } else {
          this.debugLogSelection("adding", elementUnderCursor);
          this.selectedElements.add(elementUnderCursor);
        }
      } else {
        // Single select mode
        this.debugLogSelection("setting", elementUnderCursor);
        this.selectedElements = new Set([elementUnderCursor]);
      }

      this.debugLogSelection("after selection change");

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
    this.debugLogSelection("before selection change");

    if (!elementUnderCursor) {
      // Clicked on empty space - clear selection
      if (this.selectedElements.size > 0) {
        this.debugLogSelection("clearing", undefined);
        this.selectedElements.clear();
      }
    } else if (isMultiSelect) {
      // Multi-select mode
      if (this.selectedElements.has(elementUnderCursor)) {
        this.debugLogSelection("removing", elementUnderCursor);
        this.selectedElements.delete(elementUnderCursor);
      } else {
        this.debugLogSelection("adding", elementUnderCursor);
        this.selectedElements.add(elementUnderCursor);
      }
    } else {
      // Single select mode
      this.debugLogSelection("setting", elementUnderCursor);
      this.selectedElements = new Set([elementUnderCursor]);
    }

    this.debugLogSelection("after selection change");

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
  renderElements(scale: number, offsetX: number, offsetY: number): void {
    if (!this.ctx || !this.renderer) {
      console.warn("Cannot render: missing context or renderer");
      return;
    }

    this.debugLogSelection("before render");

    // Take a snapshot of the current state to prevent any changes during render
    const currentSelection = new Set(this.selectedElements);
    const currentHovered = this.hoveredElement;
    const currentHoveredLabel = this.hoveredLabel;
    const currentSelectedLabel = this.selectedLabel;

    // Render each element using the generic renderer
    this.elements.forEach((element) => {
      const isSelected = currentSelection.has(element);
      const isHovered = !isSelected && element === currentHovered;

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
              ? "#00BFFF"
              : isHovered
              ? "rgba(0, 191, 255, 0.5)"
              : undefined,
          }
        );
      }

      // Then render the element itself
      this.renderer.render(
        element,
        scale,
        offsetX,
        offsetY,
        this.mouseX,
        this.mouseY
      );

      // Render label highlights if needed
      if (element.labels?.length) {
        // Check for hovered label
        if (
          currentHoveredLabel &&
          currentHoveredLabel.element.id === element.id
        ) {
          const labelToHighlight = element.labels.find(
            (l) => l.name === currentHoveredLabel.label.name
          );
          if (labelToHighlight) {
            this.renderer.highlightLabel(
              element,
              labelToHighlight,
              scale,
              offsetX,
              offsetY,
              false // isSelected = false for hover
            );
          }
        }

        // Check for selected label
        if (
          currentSelectedLabel &&
          currentSelectedLabel.element.id === element.id
        ) {
          const labelToHighlight = element.labels.find(
            (l) => l.name === currentSelectedLabel.label.name
          );
          if (labelToHighlight) {
            this.renderer.highlightLabel(
              element,
              labelToHighlight,
              scale,
              offsetX,
              offsetY,
              true // isSelected = true for selection
            );
          }
        }
      }
    });

    this.debugLogSelection("after render");
  }

  /**
   * Set elements being dragged and store their original positions
   */
  setDraggedElements(elements: Set<ElectricalElement>): void {
    this.debugLogSelection("before drag");
    // Create a new Set to avoid reference issues
    this.draggedElements = new Set(elements);
    // Store original positions
    this.originalPositions.clear();
    elements.forEach((element) => {
      this.originalPositions.set(element, { x: element.x, y: element.y });
    });
    this.debugLogSelection("after drag setup");
  }

  /**
   * Move dragged elements by the specified delta
   */
  moveElements(dx: number, dy: number): void {
    this.debugLogSelection("before move");
    this.draggedElements.forEach((element) => {
      const original = this.originalPositions.get(element);
      if (original) {
        element.x = original.x + dx;
        element.y = original.y + dy;
      }
    });
    this.debugLogSelection("after move");
  }

  /**
   * Clear dragged elements state
   */
  clearDraggedElements(): void {
    this.debugLogSelection("before clear drag");
    this.draggedElements.clear();
    this.originalPositions.clear();
    this.debugLogSelection("after clear drag");
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
}
