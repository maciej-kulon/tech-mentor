import {
  PaperFormat,
  PageOrientation,
  PaperDimensions,
  PageMetadata,
  PageDates,
} from "../interfaces/paper-format.interface";

/**
 * Class representing a scheme page with all its properties and dimensions
 */
export class SchemePage implements PageMetadata, PageDates {
  /** The page number (1-based index) in the project */
  pageNumber: number = 1;

  title: string = "New Page";
  description: string = "";
  paperFormat: PaperFormat = "A4";
  backgroundColor: string = "white";
  orientation: PageOrientation = "landscape";
  author: string = "";
  creationDate: Date = new Date();
  reviewDate?: Date;
  lastUpdateDate: Date = new Date();
  version: string = "1.0";
  reviewedBy: string = "";
  rows: number = 9;
  columns: number = 9;
  /** Size in pixels for row and column labels */
  labelSize: number = 24;

  /** X offset of this page in the project canvas (in pixels at 1:1 scale) */
  private _xOffset: number = 0;

  private dimensions: PaperDimensions = {
    width: 1123,
    height: 794,
  };

  private readonly PAPER_FORMATS: Record<PaperFormat, PaperDimensions> = {
    A4: { width: 794, height: 1123 },
    A3: { width: 1123, height: 1587 },
    A2: { width: 1587, height: 2245 },
    A1: { width: 2245, height: 3178 },
    A0: { width: 3178, height: 4494 },
  };

  constructor(params?: Partial<SchemePage>) {
    if (params) {
      Object.assign(this, params);
    }
    this.updateDimensions();
  }

  /**
   * Updates the page dimensions based on the current paper format and orientation
   * @private
   */
  private updateDimensions(): void {
    const format = this.PAPER_FORMATS[this.paperFormat];

    if (this.orientation === "landscape") {
      this.dimensions = { width: format.height, height: format.width };
    } else {
      this.dimensions = { width: format.width, height: format.height };
    }
  }

  /**
   * Gets the current page dimensions in pixels
   * @returns Current page dimensions
   */
  public getDimensions(): PaperDimensions {
    return this.dimensions;
  }

  /**
   * Sets the x-offset of this page in the project canvas
   * @param offset The x-offset in pixels (at 1:1 scale)
   */
  public setXOffset(offset: number): void {
    this._xOffset = offset;
  }

  /**
   * Gets the x-offset of this page in the project canvas
   * @returns The x-offset in pixels (at 1:1 scale)
   */
  public getXOffset(): number {
    return this._xOffset;
  }

  /**
   * Converts project canvas coordinates to page-local coordinates
   * @param x X coordinate in project canvas space
   * @param y Y coordinate in project canvas space
   * @returns Local coordinates relative to this page's origin
   */
  public projectToPageCoordinates(
    x: number,
    y: number
  ): { x: number; y: number } {
    return {
      x: x - this._xOffset,
      y,
    };
  }

  /**
   * Converts page-local coordinates to project canvas coordinates
   * @param x X coordinate in page-local space
   * @param y Y coordinate in page-local space
   * @returns Coordinates in project canvas space
   */
  public pageToProjectCoordinates(
    x: number,
    y: number
  ): { x: number; y: number } {
    return {
      x: x + this._xOffset,
      y,
    };
  }

  /**
   * Checks if a point in project canvas coordinates is within this page's bounds
   * @param x X coordinate in project canvas space
   * @param y Y coordinate in project canvas space
   * @returns True if the point is within this page's bounds
   */
  public containsPoint(x: number, y: number): boolean {
    const local = this.projectToPageCoordinates(x, y);
    return (
      local.x >= 0 &&
      local.x <= this.dimensions.width &&
      local.y >= 0 &&
      local.y <= this.dimensions.height
    );
  }
}
