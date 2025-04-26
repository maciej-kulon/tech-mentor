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
  title: string = "asd";
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
}
