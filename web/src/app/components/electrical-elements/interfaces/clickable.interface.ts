import { Point } from '@app/components/electrical-cad-canvas/interfaces/point.interface';

/**
 * Interface for elements that can be clicked or hovered over
 */
export interface IClickable {
  /**
   * Checks if a point is over the visible part of the element
   * @param point The point to check in local coordinates (relative to element's center)
   * @returns True if the point is over the visible part of the element
   */
  isPointOver(point: Point): boolean;
}
