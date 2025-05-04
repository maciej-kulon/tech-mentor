import { IDrawable2D } from '../interfaces/drawable-electrical-element.interface';
import {
  DrawOverrides,
  Label,
  Terminal,
} from '../interfaces/electrical-element.interface';

import { SchemePage } from '../../../components/electrical-cad-canvas/models/scheme-page.model';

/**
 * Interface for constructing an electrical element
 */
export interface ElectricalElementConstructOptions {
  /** Unique identifier for the element */
  id: string;
  /** Type of the electrical element (e.g., 'resistor', 'capacitor', 'diode') */
  type: string;
  /** X-coordinate of the element's center point */
  x: number;
  /** Y-coordinate of the element's center point */
  y: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Optional array of labels associated with the element */
  labels?: Label[];
  /** Optional array of pin connection points */
  pinPoints?: { x: number; y: number }[];
  /** Optional array of 2D shapes that make up the element's visual representation */
  shape?: IDrawable2D[];
  /** Optional custom properties specific to the element type */
  properties?: Record<string, any>;
  /** Optional array of electrical terminals */
  terminals?: Terminal[];
  /** Optional reference to the page containing this element */
  page?: SchemePage;
}

/**
 * Class representing an electrical element in the schematic
 */
export class ElectricalElement implements IDrawable2D {
  /** Unique identifier for the element */
  id: string;
  /** Type of the electrical element (e.g., 'resistor', 'capacitor', 'diode') */
  type: string;
  /** X-coordinate of the element's center point */
  x: number;
  /** Y-coordinate of the element's center point */
  y: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Optional array of labels associated with the element */
  labels?: Label[];
  /** Optional array of pin connection points */
  pinPoints?: { x: number; y: number }[];
  /** Optional array of 2D shapes that make up the element's visual representation */
  shape?: IDrawable2D[];
  /** Optional custom properties specific to the element type */
  properties?: Record<string, any>;
  /** Optional array of electrical terminals */
  terminals?: Terminal[];
  /** Optional reference to the page containing this element */
  page?: SchemePage;

  constructor(options: ElectricalElementConstructOptions) {
    this.id = options.id;
    this.type = options.type;
    this.x = options.x;
    this.y = options.y;
    this.rotation = options.rotation;
    this.labels = options.labels;
    this.pinPoints = options.pinPoints;
    this.shape = options.shape;
    this.properties = options.properties;
    this.terminals = options.terminals;
    this.page = options.page;
  }

  /**
   * Get the bounding box of all shape primitives in local coordinates,
   * with (0,0) being the center. This ensures the bounding box is centered
   * when drawn using the element's (x,y) as center point.
   * @returns Object containing minX, minY, maxX, maxY coordinates
   */
  getBoundingBox() {
    if (!this.shape || this.shape.length === 0) {
      // Fallback to minimum size if no shape
      return { minX: -15, minY: -15, maxX: 15, maxY: 15 };
    }

    // Combine bounding boxes of all shape primitives
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    let validBoundingBoxFound = false;

    for (const shapePrimitive of this.shape) {
      // Skip invalid shape primitives silently
      if (
        !shapePrimitive ||
        typeof shapePrimitive.getBoundingBox !== 'function'
      ) {
        continue;
      }

      const bbox = shapePrimitive.getBoundingBox();

      // Skip invalid bounding boxes silently
      if (
        !bbox ||
        typeof bbox !== 'object' ||
        !isFinite(bbox.minX) ||
        !isFinite(bbox.minY) ||
        !isFinite(bbox.maxX) ||
        !isFinite(bbox.maxY)
      ) {
        continue;
      }

      minX = Math.min(minX, bbox.minX);
      minY = Math.min(minY, bbox.minY);
      maxX = Math.max(maxX, bbox.maxX);
      maxY = Math.max(maxY, bbox.maxY);

      validBoundingBoxFound = true;
    }

    // If no valid bounding boxes were found, return default size
    if (
      !validBoundingBoxFound ||
      !isFinite(minX) ||
      !isFinite(minY) ||
      !isFinite(maxX) ||
      !isFinite(maxY)
    ) {
      return { minX: -15, minY: -15, maxX: 15, maxY: 15 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Width of the element calculated from its bounding box.
   * Guaranteed to be at least 30 pixels.
   * @returns The width of the element in pixels
   */
  get width(): number {
    const bbox = this.getBoundingBox();
    const calculatedWidth = Math.abs(bbox.maxX - bbox.minX);
    return Math.max(calculatedWidth, 30);
  }

  /**
   * Height of the element calculated from its bounding box.
   * Guaranteed to be at least 30 pixels.
   * @returns The height of the element in pixels
   */
  get height(): number {
    const bbox = this.getBoundingBox();
    const calculatedHeight = Math.abs(bbox.maxY - bbox.minY);
    return Math.max(calculatedHeight, 30);
  }

  /**
   * This method is no longer needed since the bounding box is now centered at (0,0)
   * in local coordinates, meaning there's no offset from center to apply
   * @returns Object with x: 0, y: 0
   */
  getBoundingBoxCenterOffset() {
    return { x: 0, y: 0 };
  }

  /**
   * Draw the element on the canvas
   * @param ctx - The canvas rendering context
   * @param overrides - Optional drawing overrides for customization
   */
  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void {
    // Apply default overrides
    const mergedOverrides = { ...overrides };

    // Save the current context state
    ctx.save();

    // Don't translate to (this.x, this.y) as that's already handled by GenericElementRenderer.applyTransform
    // Only apply rotation if needed - rotation is relative to element's center
    if (this.rotation) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }

    // Draw all shapes that make up this element
    if (this.shape && Array.isArray(this.shape)) {
      for (const shapePrimitive of this.shape) {
        try {
          // Make sure shapePrimitive is valid before calling draw2d
          if (shapePrimitive && typeof shapePrimitive.draw2d === 'function') {
            shapePrimitive.draw2d(ctx, mergedOverrides);
          } else {
            console.warn('Invalid shape primitive found:', shapePrimitive);
          }
        } catch (error) {
          console.error('Error drawing shape primitive:', error);
        }
      }
    }

    // Restore the context state
    ctx.restore();
  }
}
