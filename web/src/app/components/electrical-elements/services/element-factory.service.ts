import { Injectable } from '@angular/core';
import { HttpService } from '../../../services/http.service';
import { Label } from '../interfaces/electrical-element.interface';
import { SchemePage } from '../../electrical-cad-canvas/models/scheme-page.model';
import { ElectricalElement } from '../models/electrical-element';
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
  providedIn: 'root',
})
export class ElementFactoryService {
  private templates: ElementTemplate[] = [];
  private templatesPromise: Promise<ElementTemplate[]> | null = null;

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get all available templates
   */
  getTemplates(): Promise<ElementTemplate[]> {
    if (!this.templatesPromise) {
      this.templatesPromise = this.httpService
        .get<{ templates: ElementTemplate[] }>(
          'assets/data/element-templates.json'
        )
        .then(response => {
          this.templates = response.templates;
          return this.templates;
        })
        .catch(error => {
          console.error('Error loading templates:', error);
          throw error;
        });
    }
    return this.templatesPromise;
  }

  /**
   * Create an electrical element from a template
   */
  async createElementFromTemplate(
    templateId: string,
    x: number,
    y: number,
    labels?: Label[],
    properties?: Record<string, any>,
    rotation = 0,
    page?: SchemePage
  ): Promise<ElectricalElement | null> {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        console.error(`Template with ID ${templateId} not found`);
        return null;
      }

      // Create a unique ID for the element
      const elementId = `${template.type}-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      // Use provided labels or template's default labels
      const elementLabels = labels || template.defaultLabels;

      // Create element with merged properties
      const element = new ElectricalElement({
        id: elementId,
        type: template.type,
        x,
        y,
        rotation,
        labels: elementLabels,
        shape: [...template.shape], // Clone the shape array
        pinPoints: template.pinPositions.map(pos => ({ ...pos })), // Clone pin positions
        properties: { ...template.properties, ...properties }, // Merge properties
        page: page,
      });

      return element;
    } catch (error) {
      console.error('Error creating element:', error);
      return null;
    }
  }
}
