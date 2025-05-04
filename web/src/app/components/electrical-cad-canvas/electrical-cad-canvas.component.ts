import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { SchemePage } from "./models/scheme-page.model";
import { Project } from "./models/project.model";
import { PageDots } from "./models/page-dots.model";
import { Point } from "./interfaces/point.interface";
import { ElectricalElementsModule } from "../electrical-elements/electrical-elements.module";
import { ElectricalElementsRendererService } from "../electrical-elements/services/electrical-elements-renderer.service";
import { MacOSKeyBindings } from "@app/config/key-bindings.macos";
import { WindowsKeyBindings } from "@app/config/key-bindings.windows";
import { MatDialogModule } from "@angular/material/dialog";
import { DebugInfoDialogComponent } from "./debug-info-dialog/debug-info-dialog.component";
import { DialogService } from "@app/services/dialog.service";
import { ElectricalElement } from "../electrical-elements/models/electrical-element";

@Component({
  selector: "app-electrical-cad-canvas",
  standalone: true,
  imports: [CommonModule, ElectricalElementsModule, MatDialogModule],
  templateUrl: "./electrical-cad-canvas.component.html",
  styleUrl: "./electrical-cad-canvas.component.scss",
})
export class ElectricalCadCanvasComponent implements AfterViewInit, OnInit {
  @ViewChild("cadCanvas") canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild("canvasContainer") containerRef!: ElementRef<HTMLDivElement>;

  @Input() project!: Project;
  @Input() debugDraw = false;
  @Input() dotSize = 1.5; // in pixels
  @Input() dotsPerCentimeter = 0.2; // dots per centimeter (1 = 1 dot per cm, 2 = 2 dots per cm, etc.)

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private container!: HTMLDivElement;
  private pages: SchemePage[] = [];
  private pageDotsMap = new Map<number, PageDots>(); // Map pageNumber to PageDots
  private pagePositions = new Map<number, { x: number; y: number }>();
  public activePage: SchemePage | null = null; // Track the active page - made public for template access

  // Canvas properties
  private scale = 1;
  private MIN_SCALE = 0.1;
  private MAX_SCALE = 8;
  private offsetX = 0;
  private offsetY = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private currentMouseX = 0;
  private currentMouseY = 0;

  // Element dragging properties
  private isDraggingElement = false;
  // Add label dragging properties
  private isDraggingLabel = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private hoveredElement: ElectricalElement | null = null;
  private hoveredLabel: any | null = null;

  private isDraggingPage = false;

  // Path2D cache for grid dots (active page only)
  private gridDotsPathCache: {
    pageNumber: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    path: Path2D;
  } | null = null;

  private get keyBindings() {
    return navigator.platform.toLowerCase().includes("mac")
      ? MacOSKeyBindings
      : WindowsKeyBindings;
  }

  constructor(
    private electricalElementsRenderer: ElectricalElementsRendererService,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    // Validate project input
    if (
      !this.project ||
      !this.project.pages ||
      this.project.pages.length === 0
    ) {
      console.error("Project with pages is required");
      // Create a default project with 2 pages
      this.project = new Project({
        name: "Default Project",
        settings: {
          defaultPaperFormat: "A4",
          units: "mm",
          defaultBackgroundColor: "white",
          defaultGridSize: {
            rows: 9,
            columns: 14,
          },
        },
      });

      // Remove default pages (Project creates 3 by default)
      while (this.project.pages.length > 0) {
        this.project.removePage(1);
      }

      // Add our 2 custom pages
      this.project.addPage({
        pageNumber: 1,
        paperFormat: "A3",
        orientation: "landscape",
      });
      this.project.addPage({
        pageNumber: 2,
        paperFormat: "A4",
        orientation: "landscape",
      });
    }

    this.pages = this.project.pages;
    this.calculatePagePositions();

    // Assign page to all elements after loading
    if (this.electricalElementsRenderer.getElements) {
      this.electricalElementsRenderer.getElements().forEach((el) => {
        this.assignElementPage(el);
      });
    }

    // Initialize PageDots for each page
    this.pages.forEach((page) => {
      const dims = page.getDimensions();
      // Convert page dimensions from mm to cm (1cm = 10mm) and pass dots per cm
      this.pageDotsMap.set(
        page.pageNumber,
        new PageDots(dims.width / 10, dims.height / 10, this.dotsPerCentimeter)
      );
    });

    // Set the first page as active initially
    this.activePage = this.pages[0] || null;

    // Initialize renderer with active page
    if (this.activePage) {
      this.electricalElementsRenderer.setActivePage(this.activePage);
    }

    // Center the pages in the canvas view initially
    this.centerPages();

    // Invalidate grid dots cache on active page change
    this.invalidateGridDotsCache();
  }

  ngAfterViewInit(): void {
    if (!this.canvasRef || !this.containerRef) {
      console.error("Canvas or container refs not available");
      window.setTimeout(() => this.ngAfterViewInit(), 100);
      return;
    }

    this.canvas = this.canvasRef.nativeElement;
    this.container = this.containerRef.nativeElement;

    if (!this.canvas) {
      console.error("Canvas element not available");
      return;
    }

    const context = this.canvas.getContext("2d");

    if (!context) {
      console.error("Failed to get 2D context from canvas");
      return;
    }

    this.ctx = context;

    // Initialize renderer with context and active page
    this.electricalElementsRenderer.initialize(
      this.ctx,
      this.activePage || undefined
    );

    this.setupCanvas();
    this.draw();

    // Force a resize after init to ensure everything is properly sized
    window.setTimeout(() => {
      this.resizeCanvas();
    }, 100);
  }

  private calculatePagePositions(): void {
    let currentX = 0;
    this.pages.forEach((page) => {
      const dims = page.getDimensions();
      page.setXOffset(currentX);
      this.pagePositions.set(page.pageNumber, { x: currentX, y: 0 });
      currentX += dims.width + 40; // 40px gap between pages
    });
  }

  private calculateCanvasSize(): { width: number; height: number } {
    let maxWidth = 0;
    let maxHeight = 0;

    this.pages.forEach((page) => {
      const dims = page.getDimensions();
      const pos = this.pagePositions.get(page.pageNumber)!;
      maxWidth = Math.max(maxWidth, pos.x + dims.width);
      maxHeight = Math.max(maxHeight, dims.height);
    });

    return {
      width: maxWidth + 40, // extra gap at the end
      height: maxHeight,
    };
  }

  private centerPages(): void {
    if (!this.canvas) return;

    const canvasSize = this.calculateCanvasSize();
    this.offsetX = (this.canvas.width - canvasSize.width * this.scale) / 2;
    this.offsetY = (this.canvas.height - canvasSize.height * this.scale) / 2;
  }

  private setupCanvas(): void {
    this.resizeCanvas();

    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.canvas.addEventListener("dblclick", this.onDoubleClick.bind(this));

    this.centerPages();
  }

  @HostListener("window:resize")
  private resizeCanvas(): void {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  private draw(): void {
    if (!this.ctx) return;

    // Clear the entire canvas and reset transformations
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save the context state
    this.ctx.save();

    // Draw canvas background
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw each page with its labels
    this.pages.forEach((page) => {
      this.drawPage(page);
      // Draw labels for each page, not just active
      this.drawLabels(page);
    });

    // Draw electrical elements
    this.electricalElementsRenderer.renderElements(
      this.scale,
      this.offsetX,
      this.offsetY,
      this.project
    );

    // Draw crosshair cursor only for active page
    if (this.activePage) {
      this.drawCrosshair();
    }

    // Restore the context state
    this.ctx.restore();
  }

  private drawPage(page: SchemePage): void {
    const pageDimensions = page.getDimensions();
    const pagePosition = this.pagePositions.get(page.pageNumber)!;

    const scaledX = pagePosition.x * this.scale + this.offsetX;
    const scaledY = pagePosition.y * this.scale + this.offsetY;
    const scaledWidth = pageDimensions.width * this.scale;
    const scaledHeight = pageDimensions.height * this.scale;

    // Draw active page glow (outside only)
    if (this.activePage && page.pageNumber === this.activePage.pageNumber) {
      this.ctx.save();
      this.ctx.shadowColor = "rgba(135, 206, 250, 0.7)"; // sky blue
      this.ctx.shadowBlur = 24 * this.scale; // balanced default
      this.ctx.lineWidth = 8 * this.scale;
      this.ctx.strokeStyle = "rgba(135, 206, 250, 0.7)";
      // Draw a slightly larger rectangle for the glow
      this.ctx.strokeRect(
        scaledX - 4 * this.scale,
        scaledY - 4 * this.scale,
        scaledWidth + 8 * this.scale,
        scaledHeight + 8 * this.scale
      );
      this.ctx.restore();
    }

    // Draw page background
    this.ctx.fillStyle = page.backgroundColor;
    this.ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

    // Draw page border
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

    // Draw page info above the page
    this.drawPageInfo(page, scaledX, scaledY);

    // Setup clipping to restrict drawing inside the page
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
    this.ctx.clip();

    // Draw grid for this page
    this.drawGrid(page);

    // Restore context after clipping
    this.ctx.restore();
  }

  private drawGrid(page: SchemePage): void {
    // Only draw for the active page
    if (!this.activePage || page.pageNumber !== this.activePage.pageNumber)
      return;

    const pageDots = this.pageDotsMap.get(page.pageNumber)!;
    const pagePosition = this.pagePositions.get(page.pageNumber)!;

    // Update dots based on current scale
    pageDots.calculateDots(this.scale);

    // Check if we can use the cache
    let useCache = false;
    if (
      this.gridDotsPathCache &&
      this.gridDotsPathCache.pageNumber === page.pageNumber &&
      this.gridDotsPathCache.scale === this.scale &&
      this.gridDotsPathCache.offsetX === this.offsetX &&
      this.gridDotsPathCache.offsetY === this.offsetY
    ) {
      useCache = true;
    }

    let path: Path2D;
    if (useCache) {
      path = this.gridDotsPathCache!.path;
    } else {
      path = new Path2D();

      // Calculate the visible viewport in world coordinates
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;

      // Calculate visible area in world coordinates (mm)
      const worldMinX = (0 - this.offsetX) / this.scale;
      const worldMinY = (0 - this.offsetY) / this.scale;
      const worldMaxX = (canvasWidth - this.offsetX) / this.scale;
      const worldMaxY = (canvasHeight - this.offsetY) / this.scale;

      // Calculate the visible page area in page-local coordinates (mm)
      const pageStartX = pagePosition.x;
      const pageStartY = pagePosition.y;
      const pageWidth = page.getDimensions().width;
      const pageHeight = page.getDimensions().height;

      // Calculate overlap between viewport and page (mm)
      const overlapMinX = Math.max(worldMinX, pageStartX);
      const overlapMinY = Math.max(worldMinY, pageStartY);
      const overlapMaxX = Math.min(worldMaxX, pageStartX + pageWidth);
      const overlapMaxY = Math.min(worldMaxY, pageStartY + pageHeight);

      // Convert overlap area to page-local coordinates (cm)
      const visiblePageX = (overlapMinX - pageStartX) / 10;
      const visiblePageY = (overlapMinY - pageStartY) / 10;
      const visiblePageWidth = Math.max(0, (overlapMaxX - overlapMinX) / 10);
      const visiblePageHeight = Math.max(0, (overlapMaxY - overlapMinY) / 10);

      // Skip drawing if the page is not visible
      if (visiblePageWidth <= 0 || visiblePageHeight <= 0) {
        this.gridDotsPathCache = {
          pageNumber: page.pageNumber,
          scale: this.scale,
          offsetX: this.offsetX,
          offsetY: this.offsetY,
          path: new Path2D(), // Empty path
        };
        return;
      }

      // Query only the visible dots from the quadtree
      const visibleDots = pageDots.getDotsInRange({
        x: visiblePageX,
        y: visiblePageY,
        width: visiblePageWidth,
        height: visiblePageHeight,
      });

      // Add only the visible dots to the path
      for (const dot of visibleDots) {
        // Convert dot position from cm to mm
        const x = pagePosition.x + dot.x * 10;
        const y = pagePosition.y + dot.y * 10;

        // Transform to screen coordinates
        const screenX = x * this.scale + this.offsetX;
        const screenY = y * this.scale + this.offsetY;

        path.moveTo(screenX + this.dotSize, screenY); // moveTo avoids connecting arcs
        path.arc(screenX, screenY, this.dotSize, 0, Math.PI * 2);
      }

      // Cache the path
      this.gridDotsPathCache = {
        pageNumber: page.pageNumber,
        scale: this.scale,
        offsetX: this.offsetX,
        offsetY: this.offsetY,
        path,
      };
    }
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.fill(path);

    if (this.debugDraw) {
      this.drawQuadTreeStructure(pageDots);
    }
  }

  private getTopmostPageAtPoint(x: number, y: number): SchemePage | null {
    for (let i = this.pages.length - 1; i >= 0; i--) {
      if (this.pages[i].containsPoint(x, y)) {
        return this.pages[i];
      }
    }
    return null;
  }

  private drawQuadTreeStructure(pageDots: PageDots): void {
    if (!this.activePage) return;

    const rowLabelWidth = this.activePage.labelSize * this.scale;
    const columnLabelHeight = this.activePage.labelSize * this.scale;

    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 0.5;

    const bounds = pageDots.getQuadTreeStructure();
    for (const bound of bounds) {
      // Scale by 10 to convert from cm to mm
      const screenX = bound.x * 10 * this.scale + this.offsetX + rowLabelWidth;
      const screenY =
        bound.y * 10 * this.scale + this.offsetY + columnLabelHeight;
      const screenWidth = bound.width * 10 * this.scale;
      const screenHeight = bound.height * 10 * this.scale;

      this.ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    }
  }

  private drawLabelFrame(
    position: { x: number; y: number },
    size: { width: number; height: number },
    isHeader: boolean = false
  ): void {
    // Use a different background color for header labels
    this.ctx.fillStyle = isHeader ? "#e6e6e6" : "#f5f5f5";
    this.ctx.fillRect(position.x, position.y, size.width, size.height);
    this.ctx.strokeStyle = "#333333";
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(position.x, position.y, size.width, size.height);
  }

  private drawLabels(page: SchemePage): void {
    const pageDimensions = page.getDimensions();
    const pagePosition = this.pagePositions.get(page.pageNumber)!;

    // Use labelSize from the page
    const rowLabelWidth = page.labelSize * this.scale;
    const columnLabelHeight = page.labelSize * this.scale;

    // Calculate available space for grid
    const availableWidth = pageDimensions.width * this.scale - rowLabelWidth;
    const availableHeight =
      pageDimensions.height * this.scale - columnLabelHeight;

    // Calculate exact row height and column width
    const rowHeight = availableHeight / page.rows;
    const columnWidth = availableWidth / page.columns;

    const scaledX = pagePosition.x * this.scale + this.offsetX;
    const scaledY = pagePosition.y * this.scale + this.offsetY;

    // Set font size based on scale
    const fontSize = 12 * this.scale;
    this.ctx.font = `${fontSize}px Arial`;

    // Create empty top-left corner cell
    this.drawLabelFrame(
      {
        x: scaledX,
        y: scaledY,
      },
      { width: rowLabelWidth, height: columnLabelHeight },
      true
    );

    // Create header row for column numbers
    for (let columnIndex = 0; columnIndex < page.columns; columnIndex++) {
      const labelPositionX =
        scaledX + rowLabelWidth + columnIndex * columnWidth;

      // Draw label background and border
      this.drawLabelFrame(
        { x: labelPositionX, y: scaledY },
        { width: columnWidth, height: columnLabelHeight },
        true
      );

      // Draw column number
      this.ctx.fillStyle = "#333333";
      const text = `${columnIndex + 1}`;
      const textMetrics = this.ctx.measureText(text);
      this.ctx.fillText(
        text,
        labelPositionX + columnWidth / 2 - textMetrics.width / 2,
        scaledY + columnLabelHeight / 2 + fontSize / 3
      );
    }

    // Create header column for row letters
    for (let rowIndex = 0; rowIndex < page.rows; rowIndex++) {
      const letter = String.fromCharCode(65 + rowIndex);
      const labelPositionY = scaledY + columnLabelHeight + rowIndex * rowHeight;

      // Draw label background and border
      this.drawLabelFrame(
        { x: scaledX, y: labelPositionY },
        { width: rowLabelWidth, height: rowHeight },
        true
      );

      // Draw row letter
      this.ctx.fillStyle = "#333333";
      const textMetrics = this.ctx.measureText(letter);
      this.ctx.fillText(
        letter,
        scaledX + rowLabelWidth / 2 - textMetrics.width / 2,
        labelPositionY + rowHeight / 2 + fontSize / 3
      );
    }
  }

  private drawPageInfo(
    page: SchemePage,
    scaledX: number,
    scaledY: number
  ): void {
    const dims = page.getDimensions();

    // Draw page info above the page
    this.ctx.fillStyle = "#000000";
    this.ctx.font = "12px Arial";

    // Draw page number above the page
    this.ctx.fillText(`Page ${page.pageNumber}`, scaledX, scaledY - 25);

    // If this is the active page, draw additional info
    if (page === this.activePage) {
      this.ctx.fillText(
        `${dims.width}x${dims.height}mm`,
        scaledX,
        scaledY - 10
      );
    }
  }

  private drawCrosshair(): void {
    // Don't draw if mouse is outside the canvas
    if (this.currentMouseX < 0 || this.currentMouseY < 0) return;

    // First draw the global crosshair
    this.ctx.strokeStyle = "#999999";
    this.ctx.lineWidth = 0.5;

    // Draw horizontal line across the entire canvas
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.currentMouseY);
    this.ctx.lineTo(this.canvas.width, this.currentMouseY);
    this.ctx.stroke();

    // Draw vertical line across the entire canvas
    this.ctx.beginPath();
    this.ctx.moveTo(this.currentMouseX, 0);
    this.ctx.lineTo(this.currentMouseX, this.canvas.height);
    this.ctx.stroke();

    // If there's an active page, draw a more prominent crosshair within the page
    if (this.activePage) {
      const pageDimensions = this.activePage.getDimensions();
      const pagePosition = this.pagePositions.get(this.activePage.pageNumber)!;
      const scaledX = pagePosition.x * this.scale + this.offsetX;
      const scaledY = pagePosition.y * this.scale + this.offsetY;
      const scaledWidth = pageDimensions.width * this.scale;
      const scaledHeight = pageDimensions.height * this.scale;

      // Check if mouse is within page bounds
      if (
        this.currentMouseX >= scaledX &&
        this.currentMouseX <= scaledX + scaledWidth &&
        this.currentMouseY >= scaledY &&
        this.currentMouseY <= scaledY + scaledHeight
      ) {
        this.ctx.strokeStyle = "#555555";
        this.ctx.lineWidth = 0.7;

        // Draw horizontal line (only within page)
        this.ctx.beginPath();
        this.ctx.moveTo(scaledX, this.currentMouseY);
        this.ctx.lineTo(scaledX + scaledWidth, this.currentMouseY);
        this.ctx.stroke();

        // Draw vertical line (only within page)
        this.ctx.beginPath();
        this.ctx.moveTo(this.currentMouseX, scaledY);
        this.ctx.lineTo(this.currentMouseX, scaledY + scaledHeight);
        this.ctx.stroke();
      }
    }
  }

  private screenToWorld(x: number, y: number): Point {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.offsetX) / this.scale;
    const worldY = (y - this.offsetY) / this.scale;
    return { x: worldX, y: worldY };
  }

  private onMouseDown(event: MouseEvent): void {
    // --- FIX: Update hover state at the very start ---
    this.electricalElementsRenderer.updateMousePosition(
      event.offsetX,
      event.offsetY,
      this.scale,
      this.offsetX,
      this.offsetY
    );
    this.hoveredLabel = this.electricalElementsRenderer.getHoveredLabel();
    this.hoveredElement = this.electricalElementsRenderer.getHoveredElement();

    if (event.button === 0) {
      // Left click
      this.isMouseDown = true;
      this.lastMouseX = event.offsetX;
      this.lastMouseY = event.offsetY;

      // Always handle selection first
      const isMultiSelect =
        this.keyBindings.multiSelect === "Meta" ? event.metaKey : event.ctrlKey;
      this.electricalElementsRenderer.handleElementSelection(
        event.offsetX,
        event.offsetY,
        this.scale,
        this.offsetX,
        this.offsetY,
        isMultiSelect
      );

      // Update local hover states after selection
      this.hoveredLabel = this.electricalElementsRenderer.getHoveredLabel();
      this.hoveredElement = this.electricalElementsRenderer.getHoveredElement();

      // Reset all dragging states
      this.isDraggingLabel = false;
      this.isDraggingElement = false;
      this.isDraggingPage = false;

      const hoveredLabel = this.hoveredLabel;
      const hoveredElement = this.hoveredElement;

      if (hoveredLabel) {
        // Handle label dragging
        this.isDraggingLabel = true;
        this.electricalElementsRenderer.setDraggedLabel(hoveredLabel);
      } else if (hoveredElement) {
        // Handle element dragging
        this.isDraggingElement = true;
        // Set dragged elements (use the current selection)
        const selectedElements =
          this.electricalElementsRenderer.getSelectedElements();
        this.electricalElementsRenderer.setDraggedElements(selectedElements);
      } else {
        // --- FIX: Fallback for selected element under cursor ---
        const elementAtPoint =
          this.electricalElementsRenderer.getElementAtPoint(
            event.offsetX,
            event.offsetY,
            this.scale,
            this.offsetX,
            this.offsetY
          );
        if (
          elementAtPoint &&
          this.electricalElementsRenderer.isElementSelected(elementAtPoint)
        ) {
          // Start element drag even if not hovered
          this.isDraggingElement = true;
          const selectedElements =
            this.electricalElementsRenderer.getSelectedElements();
          this.electricalElementsRenderer.setDraggedElements(selectedElements);
        } else {
          // Check if we clicked on a page
          const clickedPage = this.getTopmostPageAtPoint(
            (event.offsetX - this.offsetX) / this.scale,
            (event.offsetY - this.offsetY) / this.scale
          );

          if (clickedPage) {
            this.isDraggingPage = true;
            this.dragStartX = event.offsetX;
            this.dragStartY = event.offsetY;
            this.canvas.style.cursor = "grabbing";
          }
        }
      }
    } else if (event.button === 1 || event.button === 2) {
      // Middle or right click - Always allow page dragging
      event.preventDefault(); // Prevent context menu
      this.isDraggingPage = true;
      this.dragStartX = event.offsetX;
      this.dragStartY = event.offsetY;
      this.canvas.style.cursor = "grabbing";
    }

    this.draw();
  }

  @HostListener("contextmenu", ["$event"])
  onContextMenu(event: MouseEvent) {
    // Prevent context menu when right-clicking
    event.preventDefault();
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button === 0) {
      // Left click
      this.isMouseDown = false;
      if (this.isDraggingLabel) {
        this.isDraggingLabel = false;
        this.electricalElementsRenderer.clearDraggedLabel();
      }
      if (this.isDraggingElement) {
        this.isDraggingElement = false;
        // Update page for all selected elements
        const selectedElements =
          this.electricalElementsRenderer.getSelectedElements();
        selectedElements.forEach((el) => this.assignElementPage(el));
        this.electricalElementsRenderer.clearDraggedElements();
      }
      if (this.isDraggingPage) {
        this.isDraggingPage = false;
      }
      this.redrawCanvas();
    } else if (event.button === 1 || event.button === 2) {
      // Middle or right click
      this.isDraggingPage = false;
    }

    // Update cursor based on what's under it
    this.updateCursor();

    // Update mouse position to maintain proper hover state
    this.electricalElementsRenderer.updateMousePosition(
      event.offsetX,
      event.offsetY,
      this.scale,
      this.offsetX,
      this.offsetY
    );

    this.draw();
  }

  private onMouseLeave(): void {
    if (this.isDraggingLabel) {
      this.isDraggingLabel = false;
      // Clear dragged label state
      this.electricalElementsRenderer.clearDraggedLabel();
    }

    if (this.isDraggingElement) {
      this.isDraggingElement = false;
      // Only clear dragged elements state but keep selection
      this.electricalElementsRenderer.clearDraggedElements();
    }
    if (this.isDragging) {
      this.isDragging = false;
    }

    this.currentMouseX = -1;
    this.currentMouseY = -1;
    this.canvas.style.cursor = "default";

    // Clear hover state but keep selection
    this.electricalElementsRenderer.updateMousePosition(
      -1,
      -1,
      this.scale,
      this.offsetX,
      this.offsetY
    );

    // --- ACTIVE PAGE LOGIC ---
    if (this.activePage !== null) {
      this.activePage = null;
      // Do not call setActivePage with undefined/null, just skip it
      this.invalidateGridDotsCache();
    }

    this.draw();
  }

  private onMouseMove(event: MouseEvent): void {
    const currentX = event.offsetX;
    const currentY = event.offsetY;

    // Update current mouse position for crosshair
    this.currentMouseX = currentX;
    this.currentMouseY = currentY;

    if (this.isMouseDown) {
      // --- FIX: Do not update drag state here, only perform drag for current state ---
      if (this.isDraggingLabel) {
        // Get the dragged label info
        const draggedLabelInfo =
          this.electricalElementsRenderer.getDraggedLabel();
        let deltaX = 0;
        let deltaY = 0;
        if (draggedLabelInfo) {
          // Simply convert mouse delta to world coordinates
          // No need to divide by element dimensions since we're using direct pixel values now
          deltaX = (currentX - this.lastMouseX) / this.scale;
          deltaY = (currentY - this.lastMouseY) / this.scale;
        }
        // Update label position with incremental delta
        this.electricalElementsRenderer.updateDraggedLabelPosition(
          deltaX,
          deltaY
        );
        this.draw();
      } else if (this.isDraggingElement) {
        // Simple screen-space delta for elements too
        const deltaX = (currentX - this.lastMouseX) / this.scale;
        const deltaY = (currentY - this.lastMouseY) / this.scale;

        console.log(`Dragging elements by delta: (${deltaX}, ${deltaY})`);

        // Update element position with incremental delta
        this.electricalElementsRenderer.updateDraggedElementsPosition(
          deltaX,
          deltaY
        );

        this.draw();
      } else if (this.isDraggingPage) {
        // Handle page dragging - use screen coordinates directly
        const deltaX = currentX - this.dragStartX;
        const deltaY = currentY - this.dragStartY;
        this.offsetX += deltaX;
        this.offsetY += deltaY;
        this.dragStartX = currentX;
        this.dragStartY = currentY;
        this.invalidateGridDotsCache(); // <--- Invalidate cache
        this.draw();
      }
    } else {
      // Update hover states
      this.electricalElementsRenderer.updateMousePosition(
        currentX,
        currentY,
        this.scale,
        this.offsetX,
        this.offsetY
      );

      // Update local hover states
      this.hoveredLabel = this.electricalElementsRenderer.getHoveredLabel();
      this.hoveredElement = this.electricalElementsRenderer.getHoveredElement();

      // --- ACTIVE PAGE LOGIC ---
      // Convert to world coordinates
      const world = this.screenToWorld(currentX, currentY);
      const newActivePage = this.getTopmostPageAtPoint(world.x, world.y);
      if (newActivePage !== this.activePage) {
        this.activePage = newActivePage;
        if (this.activePage) {
          this.electricalElementsRenderer.setActivePage(this.activePage);
        }
        this.invalidateGridDotsCache();
        this.draw();
        // Early return to avoid double draw
        return;
      }

      // Update cursor based on what's under it
      this.updateCursor();
    }

    this.lastMouseX = currentX;
    this.lastMouseY = currentY;

    // Always redraw to update crosshair and highlighting
    this.draw();
  }

  @HostListener("wheel", ["$event"])
  onWheel(event: WheelEvent): void {
    event.preventDefault();

    // Determine the mouse position relative to the canvas
    const rect = this.canvas.getBoundingClientRect();
    const mousePositionX = event.clientX - rect.left;
    const mousePositionY = event.clientY - rect.top;

    // Calculate zoom factor (negative deltaY means zoom in)
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    // Calculate new scale
    const newScale = this.scale * zoomFactor;

    // Apply scale limits
    if (newScale >= this.MIN_SCALE && newScale <= this.MAX_SCALE) {
      // Calculate mouse position in the coordinate space
      const mouseCoordinateX = (mousePositionX - this.offsetX) / this.scale;
      const mouseCoordinateY = (mousePositionY - this.offsetY) / this.scale;

      // Set the new scale
      this.scale = newScale;

      // Adjust offset to zoom to mouse position
      this.offsetX = mousePositionX - mouseCoordinateX * this.scale;
      this.offsetY = mousePositionY - mouseCoordinateY * this.scale;

      this.invalidateGridDotsCache(); // <--- Invalidate cache
      this.draw();
    }
  }

  private async onDoubleClick(event: MouseEvent): Promise<void> {
    if (!this.activePage) return;

    // First check if a label is under the cursor
    const labelUnderCursor =
      this.electricalElementsRenderer.findLabelUnderCursor(
        event.offsetX,
        event.offsetY,
        this.scale,
        this.offsetX,
        this.offsetY
      );

    if (labelUnderCursor) {
      // Deep clone the label to avoid reference issues
      const clonedLabel = JSON.parse(JSON.stringify(labelUnderCursor.label));

      // Open debug dialog for just the label
      const result = await this.dialogService.open(DebugInfoDialogComponent, {
        data: clonedLabel,
        width: "600px",
      });

      if (result !== undefined) {
        // Safe update for label (only update text and position properties)
        const element = labelUnderCursor.element;
        const labelIndex = element.labels?.findIndex(
          (l) => l.name === labelUnderCursor.label.name
        );

        if (labelIndex !== undefined && labelIndex >= 0 && element.labels) {
          // Update only specific properties that are safe to change
          const originalLabel = element.labels[labelIndex];

          // Safe properties to update for labels
          if (result.text !== undefined) originalLabel.text = result.text;
          if (result.x !== undefined) originalLabel.x = result.x;
          if (result.y !== undefined) originalLabel.y = result.y;
          if (result.fontSize !== undefined)
            originalLabel.fontSize = result.fontSize;
          if (result.fontColor !== undefined)
            originalLabel.fontColor = result.fontColor;
          if (result.name !== undefined) originalLabel.name = result.name;

          this.draw(); // Redraw to show changes
        }
      }
    } else {
      // Get the element under the cursor
      const elementUnderCursor =
        this.electricalElementsRenderer.findElementUnderCursor(
          event.offsetX,
          event.offsetY,
          this.scale,
          this.offsetX,
          this.offsetY
        );

      if (elementUnderCursor) {
        // Create a safe representation for editing
        const editableElement =
          this.createEditableRepresentation(elementUnderCursor);

        // Open debug dialog with the editable representation
        const result = await this.dialogService.open(DebugInfoDialogComponent, {
          data: editableElement,
          width: "600px",
        });

        if (result !== undefined) {
          // Apply safe updates to the original element
          this.applySelectiveUpdates(elementUnderCursor, result);
          this.draw(); // Redraw to show changes
        }
      } else {
        // Check if click is within page bounds (for the active page)
        const pageDimensions = this.activePage.getDimensions();
        const pagePosition = this.pagePositions.get(
          this.activePage.pageNumber
        )!;
        const scaledX = pagePosition.x * this.scale + this.offsetX;
        const scaledY = pagePosition.y * this.scale + this.offsetY;
        const scaledWidth = pageDimensions.width * this.scale;
        const scaledHeight = pageDimensions.height * this.scale;
        const isWithinPage =
          event.offsetX >= scaledX &&
          event.offsetX <= scaledX + scaledWidth &&
          event.offsetY >= scaledY &&
          event.offsetY <= scaledY + scaledHeight;

        if (isWithinPage) {
          // Create a safe subset of page properties to edit
          const editablePage = {
            pageNumber: this.activePage.pageNumber,
            paperFormat: this.activePage.paperFormat,
            orientation: this.activePage.orientation,
            backgroundColor: this.activePage.backgroundColor,
            rows: this.activePage.rows,
            columns: this.activePage.columns,
            labelSize: this.activePage.labelSize,
          };

          // Show page debug info
          const result = await this.dialogService.open(
            DebugInfoDialogComponent,
            {
              data: editablePage,
              width: "600px",
            }
          );

          if (result !== undefined) {
            // Safe update for page (only update specific properties)
            if (result.paperFormat)
              this.activePage.paperFormat = result.paperFormat;
            if (result.orientation)
              this.activePage.orientation = result.orientation;
            if (result.backgroundColor)
              this.activePage.backgroundColor = result.backgroundColor;
            if (result.rows) this.activePage.rows = result.rows;
            if (result.columns) this.activePage.columns = result.columns;
            if (result.labelSize) this.activePage.labelSize = result.labelSize;

            this.draw(); // Redraw to show changes
          }
        }
      }
    }
  }

  /**
   * Creates a safe editable representation of an electrical element
   * that won't break the element when edited in the dialog
   */
  private createEditableRepresentation(element: ElectricalElement): any {
    // Create a simplified representation with only editable properties
    return {
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      labels: element.labels ? JSON.parse(JSON.stringify(element.labels)) : [],
      properties: element.properties
        ? JSON.parse(JSON.stringify(element.properties))
        : {},
      // Exclude shape, pinPoints, terminals and page as they contain class instances
      // that shouldn't be directly edited through the dialog
    };
  }

  /**
   * Applies selective updates to an element, preserving its structure
   */
  private applySelectiveUpdates(
    originalElement: ElectricalElement,
    updates: any
  ): void {
    console.log("Applying selective updates:", {
      original: originalElement,
      updates,
    });

    // Update simple properties that are safe to change
    if (updates.x !== undefined) originalElement.x = updates.x;
    if (updates.y !== undefined) originalElement.y = updates.y;
    if (updates.rotation !== undefined)
      originalElement.rotation = updates.rotation;
    if (updates.type !== undefined) originalElement.type = updates.type;

    // Update properties object if it exists
    if (updates.properties && originalElement.properties) {
      Object.assign(originalElement.properties, updates.properties);
    }

    // Update labels if they exist
    if (
      updates.labels &&
      Array.isArray(updates.labels) &&
      originalElement.labels
    ) {
      // Update existing labels
      for (
        let i = 0;
        i < updates.labels.length && i < originalElement.labels.length;
        i++
      ) {
        const updatedLabel = updates.labels[i];
        const originalLabel = originalElement.labels[i];

        // Update specific label properties that are safe to change
        if (updatedLabel.text !== undefined)
          originalLabel.text = updatedLabel.text;
        if (updatedLabel.x !== undefined) originalLabel.x = updatedLabel.x;
        if (updatedLabel.y !== undefined) originalLabel.y = updatedLabel.y;
        if (updatedLabel.fontSize !== undefined)
          originalLabel.fontSize = updatedLabel.fontSize;
        if (updatedLabel.fontColor !== undefined)
          originalLabel.fontColor = updatedLabel.fontColor;
        if (updatedLabel.name !== undefined)
          originalLabel.name = updatedLabel.name;
      }

      // If the update has more labels than original, add them
      if (updates.labels.length > originalElement.labels.length) {
        for (
          let i = originalElement.labels.length;
          i < updates.labels.length;
          i++
        ) {
          originalElement.labels.push(updates.labels[i]);
        }
      }

      // If the update has fewer labels than original, remove extras
      if (updates.labels.length < originalElement.labels.length) {
        originalElement.labels = originalElement.labels.slice(
          0,
          updates.labels.length
        );
      }
    }

    console.log("Element after selective update:", originalElement);
  }

  private redrawCanvas(): void {
    this.draw();
  }

  private updateCursor(): void {
    if (this.isDraggingPage) {
      this.canvas.style.cursor = "grabbing";
    } else if (this.hoveredLabel) {
      this.canvas.style.cursor = "text";
    } else if (this.hoveredElement) {
      this.canvas.style.cursor = "move";
    } else {
      // Show grab cursor when over a page, otherwise show crosshair
      const pageUnderCursor = this.getTopmostPageAtPoint(
        (this.currentMouseX - this.offsetX) / this.scale,
        (this.currentMouseY - this.offsetY) / this.scale
      );
      this.canvas.style.cursor = pageUnderCursor ? "grab" : "crosshair";
    }

    // Log cursor state for debugging
    console.log(`Cursor: ${this.canvas.style.cursor}`);
  }

  // Invalidate grid dots cache on zoom/pan/page change
  private invalidateGridDotsCache(): void {
    this.gridDotsPathCache = null;
  }

  // Helper to assign the correct page to an element based on its position
  private assignElementPage(element: ElectricalElement): void {
    // Use the element's center position
    const x = element.x;
    const y = element.y;
    const page = this.getTopmostPageAtPoint(x, y);
    element.page = page || undefined;
  }
}
