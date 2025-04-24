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

// Base interface for common shape properties
interface BaseShape {
  lineWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

// Line shape
interface LineShape extends BaseShape {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// Rectangle shape
interface RectShape extends BaseShape {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
}

// Circle shape
interface CircleShape extends BaseShape {
  type: "circle";
  x: number;
  y: number;
  radius: number;
}

// Path shape
interface PathShape extends BaseShape {
  type: "path";
  d: string; // SVG path data
}

// Arc shape using angles
interface ArcAngleShape extends BaseShape {
  type: "arc";
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  counterclockwise?: boolean;
}

// Arc shape using points
interface ArcPointsShape extends BaseShape {
  type: "arc";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  arcRadius: number;
}

// Union type for all possible shapes
export type ElectricalElementShape =
  | LineShape
  | RectShape
  | CircleShape
  | PathShape
  | ArcAngleShape
  | ArcPointsShape;

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
  terminals?: Terminal[];
}
