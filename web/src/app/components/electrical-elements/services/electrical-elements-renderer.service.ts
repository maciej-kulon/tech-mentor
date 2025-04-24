import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ElectricalElement,
  Label,
} from '../interfaces/electrical-element.interface';
import { GenericElementRenderer } from '../renderers/generic-element-renderer';
import { ElementFactoryService } from './element-factory.service';

@Injectable({
  providedIn: 'root',
})
export class ElectricalElementsRendererService {
  private renderer!: GenericElementRenderer;
  private elements: ElectricalElement[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private isElementsLoaded = false;
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(
    private http: HttpClient,
    private elementFactory: ElementFactoryService,
  ) {
    // Start loading templates in the background
    this.elementFactory.getTemplates().subscribe();
  }

  /**
   * Initialize the service with canvas context
   */
  initialize(ctx: CanvasRenderingContext2D): void {
    this.ctx = ctx;

    // Initialize the generic renderer
    this.renderer = new GenericElementRenderer(ctx);

    // Load elements from JSON file if not already loaded
    if (!this.isElementsLoaded) {
      this.loadElementsFromJSON();
    }
  }

  /**
   * Load electrical elements from JSON file
   */
  private loadElementsFromJSON(): void {
    this.http
      .get<ElectricalElement[]>('assets/data/mock-elements.json')
      .subscribe({
        next: elements => {
          this.elements = elements;
          this.isElementsLoaded = true;

          // Force redraw if canvas context is available
          if (this.ctx) {
            this.renderElements(1, 0, 0); // Default values for scale and offset
          }
        },
        error: error => {
          console.error('Error loading electrical elements:', error);
          // Fall back to hardcoded elements in case of error
          this.loadFallbackElements();
        },
      });
  }

  /**
   * Load fallback elements in case JSON loading fails
   */
  private loadFallbackElements(): void {
    const createDefaultLabels = (
      reference: string,
      value?: string,
    ): Label[] => {
      const labels: Label[] = [
        {
          name: 'reference',
          text: reference,
          fontSize: 14,
          fontFamily: 'Arial',
          fontWeight: 'bold',
          fontColor: '#000000',
          x: 0.5,
          y: -0.6,
        },
      ];

      if (value) {
        labels.push({
          name: 'value',
          text: value,
          fontSize: 12,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontColor: '#000000',
          x: 0.5,
          y: -0.3,
        });
      }

      return labels;
    };

    // Create elements using the factory service
    this.elementFactory
      .createElementFromTemplate(
        'resistor-template',
        200,
        150,
        createDefaultLabels('R1', '10kΩ'),
      )
      .subscribe(element => {
        if (element) this.elements.push(element);
      });

    this.elementFactory
      .createElementFromTemplate(
        'capacitor-template',
        200,
        250,
        createDefaultLabels('C1', '100nF'),
      )
      .subscribe(element => {
        if (element) this.elements.push(element);
      });

    this.elementFactory
      .createElementFromTemplate(
        'switch-template',
        300,
        150,
        createDefaultLabels('SW1'),
      )
      .subscribe(element => {
        if (element) this.elements.push(element);
      });

    this.elementFactory
      .createElementFromTemplate(
        'diode-template',
        300,
        250,
        createDefaultLabels('D1', '1N4148'),
      )
      .subscribe(element => {
        if (element) this.elements.push(element);
      });

    this.isElementsLoaded = true;
  }

  /**
   * Update mouse position and trigger redraw
   */
  updateMousePosition(
    x: number,
    y: number,
    scale: number,
    offsetX: number,
    offsetY: number,
  ): void {
    this.mouseX = x;
    this.mouseY = y;
    this.renderElements(scale, offsetX, offsetY);
  }

  /**
   * Render all electrical elements
   */
  renderElements(scale: number, offsetX: number, offsetY: number): void {
    if (!this.ctx || !this.renderer) return;

    // Render each element using the generic renderer
    this.elements.forEach(element => {
      this.renderer.render(
        element,
        scale,
        offsetX,
        offsetY,
        this.mouseX,
        this.mouseY,
      );
    });
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
}
