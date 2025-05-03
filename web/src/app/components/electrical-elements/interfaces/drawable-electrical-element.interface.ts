import { DrawOverrides } from "./electrical-element.interface";

export interface IDrawable2D {
  draw2d(ctx: CanvasRenderingContext2D, overrides?: DrawOverrides): void;
  getBoundingBox(): { minX: number; minY: number; maxX: number; maxY: number };
}
