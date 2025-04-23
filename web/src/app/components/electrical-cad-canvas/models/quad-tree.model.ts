import { Point } from '../interfaces/point.interface';

/**
 * Interface for defining bounds of a quadtree node
 */
export interface QuadTreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A QuadTree implementation for efficient spatial point queries
 * Used for managing grid points in the electrical CAD canvas
 */
export class QuadTree {
  private points: Point[] = [];
  private divided: boolean = false;
  private topLeft?: QuadTree;
  private topRight?: QuadTree;
  private bottomLeft?: QuadTree;
  private bottomRight?: QuadTree;
  static readonly TARGET_POINTS = 8; // Increased target points for better distribution
  static readonly MIN_NODE_SIZE = 40; // Minimum node size in pixels before stopping subdivision

  constructor(private bounds: QuadTreeBounds) {}

  /**
   * Inserts a point into the quadtree
   * @param point The point to insert
   * @returns Whether the point was successfully inserted
   */
  insert(point: Point): boolean {
    if (!this.contains(point)) {
      return false;
    }

    // Calculate point density in current node
    const area = this.bounds.width * this.bounds.height;
    const density = (this.points.length + 1) / area;
    const minNodeSize = Math.min(this.bounds.width, this.bounds.height);

    // Subdivide if:
    // 1. We have more than TARGET_POINTS
    // 2. Node size is large enough
    // 3. Point density is high enough
    if (
      !this.divided &&
      this.points.length >= QuadTree.TARGET_POINTS &&
      minNodeSize > QuadTree.MIN_NODE_SIZE &&
      density > 0.0001
    ) {
      // Arbitrary threshold to prevent over-subdivision
      this.subdivide();
    }

    // If divided, try to insert into children
    if (this.divided) {
      return (
        this.topLeft?.insert(point) ||
        this.topRight?.insert(point) ||
        this.bottomLeft?.insert(point) ||
        this.bottomRight?.insert(point) ||
        false
      );
    }

    // If not divided, add to this node
    this.points.push(point);
    return true;
  }

  /**
   * Checks if a point is within the bounds of this quadtree node
   * @param point The point to check
   * @returns Whether the point is contained within the bounds
   */
  private contains(point: Point): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y <= this.bounds.y + this.bounds.height
    );
  }

  /**
   * Subdivides the current quadtree node into four children
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.topLeft = new QuadTree({ x, y, width: w, height: h });
    this.topRight = new QuadTree({ x: x + w, y, width: w, height: h });
    this.bottomLeft = new QuadTree({ x, y: y + h, width: w, height: h });
    this.bottomRight = new QuadTree({
      x: x + w,
      y: y + h,
      width: w,
      height: h,
    });

    this.divided = true;

    // Move existing points to children
    for (const point of this.points) {
      this.topLeft.insert(point) ||
        this.topRight.insert(point) ||
        this.bottomLeft.insert(point) ||
        this.bottomRight.insert(point);
    }

    this.points = [];
  }

  /**
   * Queries points within a given range
   * @param range The range to query
   * @returns Array of points within the range
   */
  queryRange(range: QuadTreeBounds): Point[] {
    const found: Point[] = [];

    if (!this.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (
        point.x >= range.x &&
        point.x <= range.x + range.width &&
        point.y >= range.y &&
        point.y <= range.y + range.height
      ) {
        found.push(point);
      }
    }

    if (this.divided) {
      found.push(
        ...this.topLeft!.queryRange(range),
        ...this.topRight!.queryRange(range),
        ...this.bottomLeft!.queryRange(range),
        ...this.bottomRight!.queryRange(range)
      );
    }

    return found;
  }

  /**
   * Checks if a range intersects with this quadtree node's bounds
   * @param range The range to check
   * @returns Whether the range intersects with the bounds
   */
  private intersects(range: QuadTreeBounds): boolean {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  /**
   * Clears all points and subdivisions from the quadtree
   */
  clear(): void {
    this.points = [];
    this.divided = false;
    this.topLeft = undefined;
    this.topRight = undefined;
    this.bottomLeft = undefined;
    this.bottomRight = undefined;
  }

  /**
   * Gets the bounds of all nodes in the quadtree for debugging
   * @returns Array of node bounds
   */
  getNodeBounds(): QuadTreeBounds[] {
    const bounds: QuadTreeBounds[] = [this.bounds];

    if (this.divided) {
      bounds.push(
        ...this.topLeft!.getNodeBounds(),
        ...this.topRight!.getNodeBounds(),
        ...this.bottomLeft!.getNodeBounds(),
        ...this.bottomRight!.getNodeBounds()
      );
    }

    return bounds;
  }

  /**
   * Gets the points and bounds of the leaf node containing the given point
   * @param point The point to find the containing node for
   * @returns Object containing the node's points and bounds, or null if point is outside tree
   */
  findContainingNode(
    point: Point
  ): { points: Point[]; bounds: QuadTreeBounds } | null {
    if (!this.contains(point)) {
      return null;
    }

    if (!this.divided) {
      return { points: this.points, bounds: this.bounds };
    }

    // Try to find the point in child nodes
    return (
      this.topLeft?.findContainingNode(point) ||
      this.topRight?.findContainingNode(point) ||
      this.bottomLeft?.findContainingNode(point) ||
      this.bottomRight?.findContainingNode(point) ||
      null
    );
  }
}
