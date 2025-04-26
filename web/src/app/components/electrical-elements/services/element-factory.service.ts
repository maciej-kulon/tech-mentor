 
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, map, shareReplay, tap } from "rxjs";
import {
  ElectricalElement,
  Label,
} from "../interfaces/electrical-element.interface";

interface ElementTemplate {
  id: string;
  type: string;
  name: string;
  description: string;
  width: number;
  height: number;
  shape: any[];
  pinPositions: { x: number; y: number }[];
  defaultLabels: Label[];
  properties: Record<string, any>;
}

@Injectable({
  providedIn: "root",
})
export class ElementFactoryService {
  private templates: ElementTemplate[] = [];
  private templatesLoaded$ = this.http
    .get<{ templates: ElementTemplate[] }>("assets/data/element-templates.json")
    .pipe(
      map(response => response.templates),
      tap(templates => (this.templates = templates)),
      shareReplay(1),
    );

  constructor(private readonly http: HttpClient) {}

  /**
   * Get all available templates
   */
  getTemplates(): Observable<ElementTemplate[]> {
    return this.templatesLoaded$;
  }

  /**
   * Create an electrical element from a template
   */
  createElementFromTemplate(
    templateId: string,
    x: number,
    y: number,
    labels?: Label[],
    properties?: Record<string, any>,
    rotation: number = 0,
  ): Observable<ElectricalElement | null> {
    return this.getTemplates().pipe(
      map(templates => {
        const template = templates.find(t => t.id === templateId);
        if (!template) {
          console.error(`Template with ID ${templateId} not found`);
          return null;
        }

        // Create a unique ID for the element
        const elementId = `${template.type}-${Date.now()}-${Math.floor(
          Math.random() * 1000,
        )}`;

        // Use provided labels or template's default labels
        const elementLabels = labels || template.defaultLabels;

        // Create element with merged properties
        const element: ElectricalElement = {
          id: elementId,
          type: template.type,
          x,
          y,
          width: template.width,
          height: template.height,
          rotation,
          labels: elementLabels,
          shape: [...template.shape], // Clone the shape array
          pinPoints: template.pinPositions.map(pos => ({ ...pos })), // Clone pin positions
          properties: { ...template.properties, ...properties }, // Merge properties
        };

        return element;
      }),
    );
  }

  /**
   * Create an element directly (synchronous version, only works if templates are already loaded)
   */
  createElement(
    type: string,
    x: number,
    y: number,
    labels: Label[],
    rotation: number = 0,
  ): ElectricalElement | null {
    // Find matching template by type
    const template = this.templates.find(t => t.type === type);
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
      labels,
      shape: [...template.shape],
      pinPoints: template.pinPositions.map(pos => ({ ...pos })),
    };
  }
}
