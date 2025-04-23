export interface ElectricalElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  pinPoints?: { x: number; y: number }[];
  shape?: ElectricalElementShape[];
  properties?: Record<string, any>;
}

export interface ElectricalElementShape {
  type: "line" | "rect" | "circle" | "path";
  [key: string]: any;
}
