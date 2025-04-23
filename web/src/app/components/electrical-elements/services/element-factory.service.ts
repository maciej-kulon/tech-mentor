import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, of, shareReplay, tap } from "rxjs";
import { ElectricalElement } from "../interfaces/electrical-element.interface";

interface ElementTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  width: number;
  height: number;
  shape: any[];
  pinPositions: { x: number; y: number }[];
  defaultLabel: string;
  properties: Record<string, any>;
}

interface ElementTemplatesResponse {
  templates: ElementTemplate[];
}

@Injectable({
  providedIn: "root",
})
export class ElementFactoryService {
  private templates: ElementTemplate[] = [];
  private templatesCache$: Observable<ElementTemplate[]> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get all element templates
   */
  getTemplates(): Observable<ElementTemplate[]> {
    if (this.templatesCache$) {
      return this.templatesCache$;
    }

    this.templatesCache$ = this.http
      .get<ElementTemplatesResponse>("assets/data/element-templates.json")
      .pipe(
        map((response) => response.templates),
        tap((templates) => {
          this.templates = templates;
        }),
        shareReplay(1)
      );

    return this.templatesCache$;
  }

  /**
   * Create an electrical element from a template
   */
  createElementFromTemplate(
    templateId: string,
    x: number,
    y: number,
    label?: string,
    properties?: Record<string, any>,
    rotation: number = 0
  ): Observable<ElectricalElement | null> {
    return this.getTemplates().pipe(
      map((templates) => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          console.error(`Template with ID ${templateId} not found`);
          return null;
        }

        // Create a unique ID for the element
        const elementId = `${template.type}-${Date.now()}-${Math.floor(
          Math.random() * 1000
        )}`;

        // Create a label based on template's default or provided label
        const elementLabel = label || template.defaultLabel;

        // Create element with merged properties
        const element: ElectricalElement = {
          id: elementId,
          type: template.type,
          x,
          y,
          width: template.width,
          height: template.height,
          rotation,
          label: elementLabel,
          shape: [...template.shape], // Clone the shape array
          pinPoints: template.pinPositions.map((pos) => ({ ...pos })), // Clone pin positions
          properties: { ...template.properties, ...properties }, // Merge properties
        };

        return element;
      })
    );
  }

  /**
   * Create an element directly (synchronous version, only works if templates are already loaded)
   */
  createElement(
    type: string,
    x: number,
    y: number,
    label: string,
    rotation: number = 0
  ): ElectricalElement | null {
    // Find matching template by type
    const template = this.templates.find((t) => t.type === type);
    if (!template) {
      console.error(`No template found for element type: ${type}`);
      return null;
    }

    // Create element using the template
    return {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      width: template.width,
      height: template.height,
      rotation,
      label,
      shape: [...template.shape],
      pinPoints: template.pinPositions.map((pos) => ({ ...pos })),
    };
  }
}
