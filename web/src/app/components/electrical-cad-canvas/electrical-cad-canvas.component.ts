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
import { PageDots } from "./models/page-dots.model";
import { SchemePageConfig } from "./interfaces/scheme-page-config.interface";
import { Point } from "./interfaces/point.interface";
import { ElectricalElementsModule } from "../electrical-elements/electrical-elements.module";
import { ElectricalElementsRendererService } from "../electrical-elements/services/electrical-elements-renderer.service";
import { MacOSKeyBindings } from "@app/config/key-bindings.macos";
import { WindowsKeyBindings } from "@app/config/key-bindings.windows";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { DebugInfoDialogComponent } from "./debug-info-dialog/debug-info-dialog.component";

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

  @Input() schemeConfig: SchemePageConfig = { rows: 9, columns: 14 };
  @Input() page?: SchemePage;
  @Input() dotsPerPageLength = 50;
  @Input() debugDraw = false;
  @Input() dotSize = 1.5; // in pixels

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private container!: HTMLDivElement;
  private activePage!: SchemePage;
  private pageDotsMap = new Map<SchemePage, PageDots>();
  private closestDot: Point | null = null;
  private currentQuadTreeNode: Point[] = [];

  // Canvas properties
  private scale = 1;
  private MIN_SCALE = 0.5;
  private MAX_SCALE = 5;
  private offsetX = 0;
  private offsetY = 0;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private currentMouseX = 0;
  private currentMouseY = 0;

  // Element dragging properties
  private isDraggingElement = false;

  private get keyBindings() {
    return navigator.platform.toLowerCase().includes("mac")
      ? MacOSKeyBindings
      : WindowsKeyBindings;
  }

  constructor(
    private electricalElementsRenderer: ElectricalElementsRendererService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Initialize the active page
    if (this.page) {
      this.activePage = this.page;
    } else {
      this.activePage = new SchemePage({
        rows: this.schemeConfig.rows,
        columns: this.schemeConfig.columns,
      });
    }

    // Center the page in the canvas view initially
    this.centerPage();
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext("2d")!;
    this.container = this.containerRef.nativeElement;

    // Initialize the electrical elements renderer
    this.electricalElementsRenderer.initialize(this.ctx);

    this.setupCanvas();
    this.draw();
  }

  private centerPage(): void {
    // This will be called after canvas setup
    if (this.canvas) {
      const pageDimensions = this.activePage.getDimensions();
      this.offsetX =
        (this.canvas.width - pageDimensions.width * this.scale) / 2;
      this.offsetY =
        (this.canvas.height - pageDimensions.height * this.scale) / 2;
    }
  }

  private setupCanvas(): void {
    // Make the canvas fill its container
    this.resizeCanvas();

    // Add event listeners for canvas interactions
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseleave", this.onMouseLeave.bind(this));
    this.canvas.addEventListener("dblclick", this.onDoubleClick.bind(this));

    // Center the page after canvas setup
    this.centerPage();
  }

  @HostListener("window:resize")
  private resizeCanvas(): void {
    // Set canvas dimensions to match container size
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  private draw(): void {
    if (!this.ctx) {
      console.error("Cannot draw: missing context");
      return;
    }

    // Clear the entire canvas and reset transformations
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Save the context state
    this.ctx.save();

    // Draw canvas background (not the page)
    this.ctx.fillStyle = "#f0f0f0";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the page
    this.drawPage();

    // Draw electrical elements
    this.electricalElementsRenderer.renderElements(
      this.scale,
      this.offsetX,
      this.offsetY
    );

    // Draw crosshair cursor
    this.drawCrosshair();

    // Restore the context state
    this.ctx.restore();
  }

  private drawPage(): void {
    const pageDimensions = this.activePage.getDimensions();
    const scaledWidth = pageDimensions.width * this.scale;
    const scaledHeight = pageDimensions.height * this.scale;

    // Draw page background
    this.ctx.fillStyle = this.activePage.backgroundColor;
    this.ctx.fillRect(this.offsetX, this.offsetY, scaledWidth, scaledHeight);

    // Draw page border
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.offsetX, this.offsetY, scaledWidth, scaledHeight);

    // Setup clipping to restrict drawing inside the page
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(this.offsetX, this.offsetY, scaledWidth, scaledHeight);
    this.ctx.clip();

    // Draw grid only inside the page
    this.drawGrid();

    // Draw row letters and column numbers
    this.drawLabels();

    // Restore context (removes clipping)
    this.ctx.restore();

    // Draw page info
    this.drawPageInfo();
  }

  private drawGrid(): void {
    const pageDimensions = this.activePage.getDimensions();

    // Fixed sizes for labels
    const rowLabelWidth = 24 * this.scale;
    const columnLabelHeight = 24 * this.scale;

    // Get or create PageDots for active page
    let pageDots = this.pageDotsMap.get(this.activePage);
    if (!pageDots) {
      pageDots = new PageDots(
        pageDimensions.width,
        pageDimensions.height,
        this.dotsPerPageLength
      );
      this.pageDotsMap.set(this.activePage, pageDots);
    }

    // Update dots based on current scale
    pageDots.calculateDots(this.scale);

    // Get current mouse position in page coordinates
    const mousePageX =
      (this.currentMouseX - this.offsetX - rowLabelWidth) / this.scale;
    const mousePageY =
      (this.currentMouseY - this.offsetY - columnLabelHeight) / this.scale;

    // Find closest dot and dots in current node
    if (this.currentMouseX >= 0 && this.currentMouseY >= 0) {
      this.closestDot = pageDots.findClosestDot({
        x: mousePageX,
        y: mousePageY,
      });
      this.currentQuadTreeNode = pageDots.getDotsInNode({
        x: mousePageX,
        y: mousePageY,
      });
    } else {
      this.closestDot = null;
      this.currentQuadTreeNode = [];
    }

    // Draw debug information if enabled
    if (this.debugDraw) {
      this.drawQuadTreeStructure(pageDots);
    }

    // Draw all dots
    const dots = pageDots.getAllDots();
    for (const dot of dots) {
      const screenX = dot.x * this.scale + this.offsetX + rowLabelWidth;
      const screenY = dot.y * this.scale + this.offsetY + columnLabelHeight;

      // Only draw if within grid boundaries
      if (
        screenX >= this.offsetX + rowLabelWidth &&
        screenX <= this.offsetX + pageDimensions.width * this.scale &&
        screenY >= this.offsetY + columnLabelHeight &&
        screenY <= this.offsetY + pageDimensions.height * this.scale
      ) {
        // Determine dot color and size
        if (this.debugDraw && this.currentQuadTreeNode.includes(dot)) {
          this.ctx.fillStyle = "#ff0000";
        } else {
          this.ctx.fillStyle = "#aaaaaa";
        }

        const isClosestDot = this.closestDot === dot;
        const dotSize = this.dotSize * (isClosestDot ? 1.5 : 1);

        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawQuadTreeStructure(pageDots: PageDots): void {
    const rowLabelWidth = 24 * this.scale;
    const columnLabelHeight = 24 * this.scale;

    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 0.5;

    const bounds = pageDots.getQuadTreeStructure();
    for (const bound of bounds) {
      const screenX = bound.x * this.scale + this.offsetX + rowLabelWidth;
      const screenY = bound.y * this.scale + this.offsetY + columnLabelHeight;
      const screenWidth = bound.width * this.scale;
      const screenHeight = bound.height * this.scale;

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

  private drawLabels(): void {
    this.ctx.fillStyle = "#333333";
    this.ctx.font = `${10 * this.scale}px Arial`;

    const pageDimensions = this.activePage.getDimensions();

    // Fixed sizes for labels
    const rowLabelWidth = 24 * this.scale;
    const columnLabelHeight = 24 * this.scale;

    // Calculate available space for grid
    const availableWidth = pageDimensions.width * this.scale - rowLabelWidth;
    const availableHeight =
      pageDimensions.height * this.scale - columnLabelHeight;

    // Calculate exact row height and column width
    const rowHeight = availableHeight / this.activePage.rows;
    const columnWidth = availableWidth / this.activePage.columns;

    // Create empty top-left corner cell
    this.drawLabelFrame(
      { x: this.offsetX, y: this.offsetY },
      { width: rowLabelWidth, height: columnLabelHeight },
      true
    );

    // Create header row for column numbers
    for (
      let columnIndex = 0;
      columnIndex < this.activePage.columns;
      columnIndex++
    ) {
      const labelPositionX =
        this.offsetX + rowLabelWidth + columnIndex * columnWidth;

      // Draw label background and border
      this.drawLabelFrame(
        { x: labelPositionX, y: this.offsetY },
        { width: columnWidth, height: columnLabelHeight },
        true
      );

      // Draw column number
      this.ctx.fillStyle = "#333333";
      this.ctx.fillText(
        `${columnIndex + 1}`,
        labelPositionX + columnWidth / 2 - 3 * this.scale,
        this.offsetY + columnLabelHeight / 2 + 3 * this.scale
      );
    }

    // Create header column for row letters
    for (let rowIndex = 0; rowIndex < this.activePage.rows; rowIndex++) {
      const letter = String.fromCharCode(65 + rowIndex);
      const labelPositionY =
        this.offsetY + columnLabelHeight + rowIndex * rowHeight;

      // Draw label background and border
      this.drawLabelFrame(
        { x: this.offsetX, y: labelPositionY },
        { width: rowLabelWidth, height: rowHeight },
        true
      );

      // Draw row letter
      this.ctx.fillStyle = "#333333";
      this.ctx.fillText(
        letter,
        this.offsetX + rowLabelWidth / 2 - 3 * this.scale,
        labelPositionY + rowHeight / 2 + 3 * this.scale
      );
    }
  }

  private drawPageInfo(): void {
    const pageDimensions = this.activePage.getDimensions();

    // Draw title at the top of the page
    if (this.activePage.title) {
      this.ctx.fillStyle = "#000000";
      this.ctx.font = `bold ${16 * this.scale}px Arial`;
      this.ctx.fillText(
        this.activePage.title,
        this.offsetX + 20 * this.scale,
        this.offsetY + 20 * this.scale
      );
    }

    // Draw page format and version info at the bottom right
    const formatText = `${this.activePage.paperFormat} ${this.activePage.orientation}`;
    const versionText = `v${this.activePage.version}`;

    this.ctx.fillStyle = "#333333";
    this.ctx.font = `${10 * this.scale}px Arial`;

    // Draw at bottom right with some padding
    this.ctx.fillText(
      formatText,
      this.offsetX + pageDimensions.width * this.scale - 100 * this.scale,
      this.offsetY + pageDimensions.height * this.scale - 15 * this.scale
    );

    this.ctx.fillText(
      versionText,
      this.offsetX + pageDimensions.width * this.scale - 100 * this.scale,
      this.offsetY + pageDimensions.height * this.scale - 5 * this.scale
    );
  }

  private drawCrosshair(): void {
    if (this.currentMouseX < 0 || this.currentMouseY < 0) return;

    // Only draw crosshair when mouse is inside the page
    const pageDimensions = this.activePage.getDimensions();
    if (
      this.currentMouseX >= this.offsetX &&
      this.currentMouseX <= this.offsetX + pageDimensions.width * this.scale &&
      this.currentMouseY >= this.offsetY &&
      this.currentMouseY <= this.offsetY + pageDimensions.height * this.scale
    ) {
      this.ctx.strokeStyle = "#555555";
      this.ctx.lineWidth = 0.5;

      // Draw horizontal line (only within page)
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, this.currentMouseY);
      this.ctx.lineTo(
        this.offsetX + pageDimensions.width * this.scale,
        this.currentMouseY
      );
      this.ctx.stroke();

      // Draw vertical line (only within page)
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentMouseX, this.offsetY);
      this.ctx.lineTo(
        this.currentMouseX,
        this.offsetY + pageDimensions.height * this.scale
      );
      this.ctx.stroke();
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      // Left click - Handle element selection first
      const elementUnderCursor =
        this.electricalElementsRenderer.findElementUnderCursor(
          event.offsetX,
          event.offsetY,
          this.scale,
          this.offsetX,
          this.offsetY
        );

      if (elementUnderCursor) {
        // Handle selection
        this.electricalElementsRenderer.handleElementSelection(
          event.offsetX,
          event.offsetY,
          this.scale,
          this.offsetX,
          this.offsetY,
          event.getModifierState(this.keyBindings.multiSelect)
        );

        // Prepare for dragging
        this.isDraggingElement = true;
        this.dragStartX = event.offsetX;
        this.dragStartY = event.offsetY;

        // Set dragged elements
        this.electricalElementsRenderer.setDraggedElements(
          this.electricalElementsRenderer.getSelectedElements()
        );
        this.canvas.style.cursor = "move";
      } else {
        // Start page dragging when clicking empty space
        this.isDragging = true;
        this.dragStartX = event.offsetX;
        this.dragStartY = event.offsetY;
        this.canvas.style.cursor = "grabbing";

        // Clear selection when clicking empty space
        this.electricalElementsRenderer.handleElementSelection(
          event.offsetX,
          event.offsetY,
          this.scale,
          this.offsetX,
          this.offsetY,
          false
        );
      }
    } else if (event.button === 1 || event.button === 2) {
      // Middle or right click - Always allow page dragging
      this.isDragging = true;
      this.dragStartX = event.offsetX;
      this.dragStartY = event.offsetY;
      this.canvas.style.cursor = "grabbing";
    }

    this.draw();
  }

  private onMouseUp(event: MouseEvent): void {
    const wasDraggingElement = this.isDraggingElement;

    if (this.isDraggingElement) {
      this.isDraggingElement = false;
      // Only clear dragged elements state but keep selection
      this.electricalElementsRenderer.clearDraggedElements();
    }

    if (this.isDragging) {
      this.isDragging = false;
    }

    // Only update cursor if we weren't dragging an element
    if (!wasDraggingElement) {
      const elementUnderCursor =
        this.electricalElementsRenderer.findElementUnderCursor(
          event.offsetX,
          event.offsetY,
          this.scale,
          this.offsetX,
          this.offsetY
        );
      this.canvas.style.cursor = elementUnderCursor ? "pointer" : "crosshair";
    } else {
      this.canvas.style.cursor = "pointer";
    }

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

    this.draw();
  }

  private onMouseMove(event: MouseEvent): void {
    const prevMouseX = this.currentMouseX;
    const prevMouseY = this.currentMouseY;

    this.currentMouseX = event.offsetX;
    this.currentMouseY = event.offsetY;

    let needsRedraw = false;

    if (this.isDraggingElement) {
      // Calculate the movement in element coordinates
      const dx = (this.currentMouseX - this.dragStartX) / this.scale;
      const dy = (this.currentMouseY - this.dragStartY) / this.scale;

      // Move the elements
      this.electricalElementsRenderer.moveElements(dx, dy);
      needsRedraw = true;
    } else if (this.isDragging) {
      // Calculate the drag distance
      const dragDistanceX = event.offsetX - this.dragStartX;
      const dragDistanceY = event.offsetY - this.dragStartY;

      // Update offset by the drag distance
      this.offsetX += dragDistanceX;
      this.offsetY += dragDistanceY;

      // Reset the drag start position
      this.dragStartX = event.offsetX;
      this.dragStartY = event.offsetY;

      needsRedraw = true;
    }

    // Update mouse position in the renderer
    if (
      prevMouseX !== this.currentMouseX ||
      prevMouseY !== this.currentMouseY
    ) {
      this.electricalElementsRenderer.updateMousePosition(
        this.currentMouseX,
        this.currentMouseY,
        this.scale,
        this.offsetX,
        this.offsetY
      );
      needsRedraw = true;
    }

    if (needsRedraw) {
      this.draw();
    }
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

      this.draw();
    }
  }

  private onDoubleClick(event: MouseEvent): void {
    // Check if there's an element under cursor
    const elementUnderCursor =
      this.electricalElementsRenderer.findElementUnderCursor(
        event.offsetX,
        event.offsetY,
        this.scale,
        this.offsetX,
        this.offsetY
      );

    if (elementUnderCursor) {
      // Show element debug info
      const dialogRef = this.dialog.open(DebugInfoDialogComponent, {
        data: elementUnderCursor,
        width: "600px",
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Update the element with the edited data
          Object.assign(elementUnderCursor, result);
          this.draw(); // Redraw to show changes
        }
      });
    } else {
      // Check if click is within page bounds
      const pageDimensions = this.activePage.getDimensions();
      const isWithinPage =
        event.offsetX >= this.offsetX &&
        event.offsetX <= this.offsetX + pageDimensions.width * this.scale &&
        event.offsetY >= this.offsetY &&
        event.offsetY <= this.offsetY + pageDimensions.height * this.scale;

      if (isWithinPage) {
        // Show page debug info
        const dialogRef = this.dialog.open(DebugInfoDialogComponent, {
          data: this.activePage,
          width: "600px",
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            // Update the page with the edited data
            Object.assign(this.activePage, result);
            this.draw(); // Redraw to show changes
          }
        });
      }
    }
  }
}
