export interface Terminal {
  x: number; // Relative position (0-1)
  y: number; // Relative position (0-1)
  properties?: Record<string, any>; // Optional user-defined properties
}

export interface Label {
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

export interface ElectricalElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  labels?: Label[];
  pinPoints?: { x: number; y: number }[];
  shape?: ElectricalElementShape[];
  properties?: Record<string, any>;
  terminals?: Terminal[]; // Added terminals array
}

export interface ElectricalElementShape {
  type: 'line' | 'rect' | 'circle' | 'path';
  lineWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  [key: string]: any;
}
