import { v4 as uuidv4 } from 'uuid';
import { ProjectContributor } from './project-contributor.interface';
import { ProjectSettings } from './project-settings.interface';
import { ProjectMetadata } from './project-metadata.type';
import { SchemePage } from './scheme-page.model';

/**
 * Represents a project containing multiple scheme pages and project-wide settings
 */
export class Project {
  /** Unique identifier for the project */
  readonly id: string;

  /** Project name */
  name: string;

  /** Project description */
  description: string;

  /** Project author */
  author: string;

  /** List of project contributors */
  contributors: ProjectContributor[];

  /** Creation date of the project */
  readonly creationDate: Date;

  /** Last modification date of the project */
  lastModifiedDate: Date;

  /** Project version */
  version: string;

  /** Custom project metadata */
  metadata: ProjectMetadata;

  /** Project-wide settings */
  settings: ProjectSettings;

  /** List of pages in the project */
  private _pages: SchemePage[];

  /** Event handler for element ownership changes */
  onElementOwnershipChanged?: (
    elementId: string,
    fromPage: number,
    toPage: number
  ) => void;

  constructor(params?: Partial<Project>) {
    this.id = uuidv4();
    this.name = params?.name ?? 'New Project';
    this.description = params?.description ?? '';
    this.author = params?.author ?? '';
    this.contributors = params?.contributors ?? [];
    this.creationDate = new Date();
    this.lastModifiedDate = new Date();
    this.version = params?.version ?? '1.0.0';
    this.metadata = params?.metadata ?? {};
    this.settings = params?.settings ?? {
      defaultPaperFormat: 'A4',
      units: 'mm',
      defaultBackgroundColor: 'white',
      defaultGridSize: {
        rows: 9,
        columns: 14,
      },
    };
    this._pages = [];

    // Initialize with 3 default pages
    this.createDefaultPages();
  }

  /**
   * Creates three default pages for the project
   * @private
   */
  private createDefaultPages(): void {
    for (let i = 0; i < 3; i++) {
      this.addPage();
    }
  }

  /**
   * Adds a new page to the project
   * @param pageConfig Optional configuration for the new page
   * @returns The newly created page
   */
  addPage(pageConfig?: Partial<SchemePage>): SchemePage {
    const pageNumber = this._pages.length + 1;
    const newPage = new SchemePage({
      ...pageConfig,
      pageNumber,
      paperFormat: pageConfig?.paperFormat ?? this.settings.defaultPaperFormat,
      backgroundColor:
        pageConfig?.backgroundColor ?? this.settings.defaultBackgroundColor,
      rows: pageConfig?.rows ?? this.settings.defaultGridSize.rows,
      columns: pageConfig?.columns ?? this.settings.defaultGridSize.columns,
    });

    this._pages.push(newPage);
    this.lastModifiedDate = new Date();
    return newPage;
  }

  /**
   * Removes a page from the project
   * @param pageNumber The 1-based index of the page to remove
   * @returns true if the page was removed, false if the page number was invalid
   */
  removePage(pageNumber: number): boolean {
    if (pageNumber < 1 || pageNumber > this._pages.length) {
      return false;
    }

    this._pages.splice(pageNumber - 1, 1);

    // Update page numbers for remaining pages
    this._pages.forEach((page, index) => {
      page.pageNumber = index + 1;
    });

    this.lastModifiedDate = new Date();
    return true;
  }

  /**
   * Gets a page by its number
   * @param pageNumber The 1-based index of the page
   * @returns The requested page or undefined if not found
   */
  getPage(pageNumber: number): SchemePage | undefined {
    if (pageNumber < 1 || pageNumber > this._pages.length) {
      return undefined;
    }
    return this._pages[pageNumber - 1];
  }

  /**
   * Gets all pages in the project
   * @returns Array of all pages
   */
  get pages(): SchemePage[] {
    return [...this._pages];
  }

  /**
   * Gets the total number of pages in the project
   */
  get pageCount(): number {
    return this._pages.length;
  }

  /**
   * Notifies that an element has changed ownership between pages
   * @param elementId The ID of the element that changed ownership
   * @param fromPage The page number the element moved from
   * @param toPage The page number the element moved to (-1 if element is now unowned)
   */
  notifyElementOwnershipChanged(
    elementId: string,
    fromPage: number,
    toPage: number
  ): void {
    this.onElementOwnershipChanged?.(elementId, fromPage, toPage);
    this.lastModifiedDate = new Date();
  }
}
