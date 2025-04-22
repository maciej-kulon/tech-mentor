import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export class SchemePage {
  title: string = '';
  description: string = '';
  paperFormat: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' = 'A4';
  backgroundColor: string = 'white';
  orientation: 'portrait' | 'landscape' = 'landscape';
  author: string = '';
  creationDate: Date = new Date();
  reviewDate?: Date;
  lastUpdateDate: Date = new Date();
  version: string = '1.0';
  reviewedBy: string = '';
  rows: number = 9;
  columns: number = 9;

  // Paper dimensions in pixels (at 96 DPI)
  // A4 = 210 × 297 mm = 794 x 1123 px (landscape: 1123 x 794 px)
  private dimensions: { width: number; height: number } = {
    width: 1123,
    height: 794,
  };

  constructor(params?: Partial<SchemePage>) {
    if (params) {
      Object.assign(this, params);
    }

    // Update dimensions based on paper format and orientation
    this.updateDimensions();
  }

  private updateDimensions(): void {
    // Paper dimensions in pixels (at 96 DPI)
    const formats = {
      A4: { width: 794, height: 1123 },
      A3: { width: 1123, height: 1587 },
      A2: { width: 1587, height: 2245 },
      A1: { width: 2245, height: 3178 },
      A0: { width: 3178, height: 4494 },
    };

    const format = formats[this.paperFormat];

    if (this.orientation === 'landscape') {
      this.dimensions = { width: format.height, height: format.width };
    } else {
      this.dimensions = { width: format.width, height: format.height };
    }
  }

  public getDimensions(): { width: number; height: number } {
    return this.dimensions;
  }
}

interface SchemePageConfig {
  rows: number;
  columns: number;
}

@Component({
  selector: 'app-electrical-cad-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './electrical-cad-canvas.component.html',
  styleUrl: './electrical-cad-canvas.component.scss',
})
export class ElectricalCadCanvasComponent implements AfterViewInit, OnInit {
  @ViewChild('cadCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLDivElement>;

  @Input() schemeConfig: SchemePageConfig = { rows: 9, columns: 9 };
  @Input() page?: SchemePage;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private container!: HTMLDivElement;
  private activePage!: SchemePage;

  // Canvas properties
  private scale = 1;
  private MIN_SCALE = 0.5;
  private MAX_SCALE = 5;
  private offsetX = 0;
  private offsetY = 0;
  private isDragging = false;
  private startDragX = 0;
  private startDragY = 0;
  private mouseX = 0;
  private mouseY = 0;

  // Grid properties
  private gridSize = 30; // Base grid size before scaling
  private dotRadius = 1;

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
    this.ctx = this.canvas.getContext('2d')!;
    this.container = this.containerRef.nativeElement;

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
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    // Center the page after canvas setup
    this.centerPage();
  }

  @HostListener('window:resize')
  private resizeCanvas(): void {
    // Set canvas dimensions to match container size
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  private draw(): void {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw canvas background (not the page)
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw the page
    this.drawPage();

    // Draw crosshair cursor at the current mouse position
    this.drawCrosshair();
  }

  private drawPage(): void {
    const pageDimensions = this.activePage.getDimensions();
    const scaledWidth = pageDimensions.width * this.scale;
    const scaledHeight = pageDimensions.height * this.scale;

    // Draw page background
    this.ctx.fillStyle = this.activePage.backgroundColor;
    this.ctx.fillRect(this.offsetX, this.offsetY, scaledWidth, scaledHeight);

    // Draw page border
    this.ctx.strokeStyle = '#000000';
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
    const scaledGridSize = this.gridSize * this.scale;
    const pageDimensions = this.activePage.getDimensions();

    // Calculate row height and column width based on page dimensions
    const rowHeight =
      (pageDimensions.height / this.activePage.rows) * this.scale;
    const columnWidth =
      (pageDimensions.width / this.activePage.columns) * this.scale;

    // Calculate the number of dots to draw based on page size
    const dotsX = Math.ceil(pageDimensions.width / this.gridSize) + 1;
    const dotsY = Math.ceil(pageDimensions.height / this.gridSize) + 1;

    // Calculate the starting position for drawing dots
    // This aligns the grid to the page, not the canvas
    const startX = this.offsetX + (this.offsetX % scaledGridSize);
    const startY = this.offsetY + (this.offsetY % scaledGridSize);

    this.ctx.fillStyle = '#aaaaaa';

    // Draw dots only within page boundaries
    for (let x = 0; x < dotsX; x++) {
      for (let y = 0; y < dotsY; y++) {
        const posX = this.offsetX + x * scaledGridSize;
        const posY = this.offsetY + y * scaledGridSize;

        // Only draw if within page boundaries
        if (
          posX >= this.offsetX &&
          posX <= this.offsetX + pageDimensions.width * this.scale &&
          posY >= this.offsetY &&
          posY <= this.offsetY + pageDimensions.height * this.scale
        ) {
          this.ctx.beginPath();
          this.ctx.arc(posX, posY, this.dotRadius * this.scale, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    // Draw column lines
    this.ctx.strokeStyle = '#dddddd';
    this.ctx.lineWidth = 0.5;
    for (let i = 0; i <= this.activePage.columns; i++) {
      const x = this.offsetX + i * columnWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.offsetY);
      this.ctx.lineTo(x, this.offsetY + pageDimensions.height * this.scale);
      this.ctx.stroke();
    }

    // Draw row lines
    for (let i = 0; i <= this.activePage.rows; i++) {
      const y = this.offsetY + i * rowHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, y);
      this.ctx.lineTo(this.offsetX + pageDimensions.width * this.scale, y);
      this.ctx.stroke();
    }
  }

  private drawLabelFrame(
    position: { x: number; y: number },
    size: { width: number; height: number },
    isHeader: boolean = false
  ): void {
    // Use a different background color for header labels
    this.ctx.fillStyle = isHeader ? '#e6e6e6' : '#f5f5f5';
    this.ctx.fillRect(position.x, position.y, size.width, size.height);
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 0.5;
    this.ctx.strokeRect(position.x, position.y, size.width, size.height);
  }

  private drawLabels(): void {
    this.ctx.fillStyle = '#333333';
    this.ctx.font = `${12 * this.scale}px Arial`;

    const pageDimensions = this.activePage.getDimensions();

    // Calculate row height and column width based on page dimensions
    const rowHeight =
      (pageDimensions.height / this.activePage.rows) * this.scale;
    const columnWidth =
      (pageDimensions.width / this.activePage.columns) * this.scale;

    // Reserve the top row and leftmost column for headers
    const labelWidth = columnWidth;
    const labelHeight = rowHeight;

    // Create empty top-left corner cell
    this.drawLabelFrame(
      { x: this.offsetX, y: this.offsetY },
      { width: labelWidth, height: labelHeight },
      true
    );

    // Create header row for column numbers (starting from the second cell)
    for (let i = 0; i < this.activePage.columns; i++) {
      const x = this.offsetX + (i + 1) * columnWidth;

      // Draw label background and border
      this.drawLabelFrame(
        { x: x, y: this.offsetY },
        { width: labelWidth, height: labelHeight },
        true
      );

      // Draw column number
      this.ctx.fillStyle = '#333333';
      this.ctx.fillText(
        `${i + 1}`,
        x + labelWidth / 2 - 4 * this.scale,
        this.offsetY + labelHeight / 2 + 4 * this.scale
      );
    }

    // Create header column for row letters (starting from the second row)
    for (let i = 0; i < this.activePage.rows; i++) {
      const letter = String.fromCharCode(65 + i); // A=65, B=66, etc.
      const y = this.offsetY + (i + 1) * rowHeight;

      // Draw label background and border
      this.drawLabelFrame(
        { x: this.offsetX, y: y },
        { width: labelWidth, height: labelHeight },
        true
      );

      // Draw row letter
      this.ctx.fillStyle = '#333333';
      this.ctx.fillText(
        letter,
        this.offsetX + labelWidth / 2 - 4 * this.scale,
        y + labelHeight / 2 + 4 * this.scale
      );
    }
  }

  private drawPageInfo(): void {
    const pageDimensions = this.activePage.getDimensions();

    // Draw title at the top of the page
    if (this.activePage.title) {
      this.ctx.fillStyle = '#000000';
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

    this.ctx.fillStyle = '#333333';
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
    if (this.mouseX < 0 || this.mouseY < 0) return;

    // Only draw crosshair when mouse is inside the page
    const pageDimensions = this.activePage.getDimensions();
    if (
      this.mouseX >= this.offsetX &&
      this.mouseX <= this.offsetX + pageDimensions.width * this.scale &&
      this.mouseY >= this.offsetY &&
      this.mouseY <= this.offsetY + pageDimensions.height * this.scale
    ) {
      this.ctx.strokeStyle = '#555555';
      this.ctx.lineWidth = 0.5;

      // Draw horizontal line (only within page)
      this.ctx.beginPath();
      this.ctx.moveTo(this.offsetX, this.mouseY);
      this.ctx.lineTo(
        this.offsetX + pageDimensions.width * this.scale,
        this.mouseY
      );
      this.ctx.stroke();

      // Draw vertical line (only within page)
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouseX, this.offsetY);
      this.ctx.lineTo(
        this.mouseX,
        this.offsetY + pageDimensions.height * this.scale
      );
      this.ctx.stroke();
    }
  }

  private onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startDragX = event.offsetX;
    this.startDragY = event.offsetY;
    this.canvas.style.cursor = 'grabbing';
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.canvas.style.cursor = 'crosshair';
  }

  private onMouseLeave(): void {
    this.isDragging = false;
    this.mouseX = -1;
    this.mouseY = -1;
    this.canvas.style.cursor = 'default';
    this.draw();
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouseX = event.offsetX;
    this.mouseY = event.offsetY;

    if (this.isDragging) {
      // Calculate the drag distance
      const dx = event.offsetX - this.startDragX;
      const dy = event.offsetY - this.startDragY;

      // Update offset by the drag distance (this moves the page, not the canvas)
      this.offsetX += dx;
      this.offsetY += dy;

      // Reset the drag start position
      this.startDragX = event.offsetX;
      this.startDragY = event.offsetY;
    }

    this.draw();
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();

    // Determine the mouse position relative to the canvas
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate zoom factor (negative deltaY means zoom in)
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;

    // Calculate new scale
    const newScale = this.scale * zoomFactor;

    // Apply scale limits
    if (newScale >= this.MIN_SCALE && newScale <= this.MAX_SCALE) {
      // Calculate mouse position in the coordinate space
      const coordX = (mouseX - this.offsetX) / this.scale;
      const coordY = (mouseY - this.offsetY) / this.scale;

      // Set the new scale
      this.scale = newScale;

      // Adjust offset to zoom to mouse position
      this.offsetX = mouseX - coordX * this.scale;
      this.offsetY = mouseY - coordY * this.scale;

      this.draw();
    }
  }
}
