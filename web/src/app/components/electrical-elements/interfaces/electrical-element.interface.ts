import { SchemePage } from "../../electrical-cad-canvas/models/scheme-page.model";
import { IDrawable2D } from "./drawable-electrical-element.interface";

export interface Terminal {
  x: number; // Relative position (0-1)
  y: number; // Relative position (0-1)
  properties?: Record<string, any>; // Optional user-defined properties
}

export enum ShapeType {
  Rectangle = "rect",
  Circle = "circle",
  Line = "line",
  Path = "path",
  Bezier = "bezier",
  Arc = "arc",
}

export interface Label {
  /**
   * The text to display. Supports variable substitution using @variable or @object.property syntax.
   * See documentation in the repo for details.
   */
  name: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontColor: string;
  x: number;
  y: number;
  minSize?: number;
  maxSize?: number;
}

export interface DrawOverrides {
  lineWidthMultiplier?: number;
  lineColor?: string;
  scale?: number;
  offsetX?: number; // Position offset in x direction, defaults to 0
  offsetY?: number; // Position offset in y direction, defaults to 0
}
