import { Point } from '../interfaces/point.interface';
import { QuadTree, QuadTreeBounds } from './quad-tree.model';

/**
 * Class managing the grid dots system for the electrical CAD canvas
 * Handles dynamic dot density based on zoom level
 */
export class PageDots {
  private quadTree: QuadTree;
  private baseSpacing: number;
  private currentDotCount: number = 0;
  private lastScale: number = 1;

  constructor(
    private pageWidth: number,
    private pageHeight: number,
    public dotsPerLength: number
  ) {
    this.baseSpacing = pageWidth / dotsPerLength;
    this.quadTree = new QuadTree({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
    });
    this.calculateDots(1); // Initialize with base density
  }

  /**
   * Calculates and updates dot positions based on current scale
   * @param scale Current zoom scale
   */
  calculateDots(scale: number): void {
    const densityLevel = this.calculateDensityLevel(scale);
    const lastDensityLevel = this.calculateDensityLevel(this.lastScale);

    if (densityLevel === lastDensityLevel) {
      return;
    }

    this.lastScale = scale;
    this.quadTree.clear();

    // Base spacing adjusted by density level
    const currentSpacing = this.baseSpacing * Math.pow(2, -densityLevel);

    // Calculate number of dots based on current spacing
    const horizontalDots = Math.ceil(this.pageWidth / currentSpacing);
    const verticalDots = Math.ceil(this.pageHeight / currentSpacing);

    // Create a uniform grid of dots
    for (let x = 0; x <= horizontalDots; x++) {
      for (let y = 0; y <= verticalDots; y++) {
        this.quadTree.insert({
          x: x * currentSpacing,
          y: y * currentSpacing,
        });
      }
    }

    this.currentDotCount = horizontalDots * verticalDots;
  }

  /**
   * Calculates the density level based on scale
   * @param scale Current zoom scale
   * @returns Density level (positive for more dots, negative for fewer)
   */
  private calculateDensityLevel(scale: number): number {
    // More aggressive density level calculation
    return Math.floor(Math.log2(scale * 2));
  }

  /**
   * Gets all dots currently in the grid
   * @returns Array of all dot positions
   */
  getAllDots(): Point[] {
    return this.quadTree.queryRange({
      x: 0,
      y: 0,
      width: this.pageWidth,
      height: this.pageHeight,
    });
  }

  /**
   * Finds the closest dot to a given point
   * @param point The reference point
   * @returns The closest dot or null if no dots exist
   */
  findClosestDot(point: Point): Point | null {
    const searchRadius = this.baseSpacing * 2;
    const searchArea = {
      x: point.x - searchRadius,
      y: point.y - searchRadius,
      width: searchRadius * 2,
      height: searchRadius * 2,
    };

    const nearbyDots = this.quadTree.queryRange(searchArea);
    if (!nearbyDots.length) return null;

    let closestDot = nearbyDots[0];
    let minDistance = this.getDistance(point, closestDot);

    for (const dot of nearbyDots) {
      const distance = this.getDistance(point, dot);
      if (distance < minDistance) {
        minDistance = distance;
        closestDot = dot;
      }
    }

    return closestDot;
  }

  /**
   * Gets dots in the current quadtree node containing the point
   * @param point The reference point
   * @returns Array of dots in the same node
   */
  getDotsInNode(point: Point): Point[] {
    const node = this.quadTree.findContainingNode(point);
    return node ? node.points : [];
  }

  /**
   * Gets the quadtree structure for debugging
   * @returns Array of node bounds
   */
  getQuadTreeStructure(): QuadTreeBounds[] {
    return this.quadTree.getNodeBounds();
  }

  /**
   * Calculates Euclidean distance between two points
   * @private
   */
  private getDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
