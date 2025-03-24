import type { Mysli } from "~/types/Mysli";
import { Vec2 } from "~/shared/lib/math";

export class SceneRenderer<T extends Mysli.Renderable> {
  private entities: T[] = [];
  public visibleEntities: T[] = [];
  private visibilityBuffer: Vec2 = Object.freeze(new Vec2(140, 140));
  private state: Mysli.ActiveEntityStates<T>

  constructor(initialEntities: T[] = [], state: Mysli.ActiveEntityStates<T>) {
    this.entities = initialEntities;
    this.state = state;
  }

  updateVisibleEntities(viewport: Mysli.Viewport): void {
    const zoomedWidth = viewport.width / viewport.zoomLevel;
    const zoomedHeight = viewport.height / viewport.zoomLevel;
    const minX = viewport.position.x - zoomedWidth * 0.5 - this.visibilityBuffer.x;
    const maxX = viewport.position.x + zoomedWidth * 0.5 + this.visibilityBuffer.x;
    const minY = viewport.position.y - zoomedHeight * 0.5 - this.visibilityBuffer.y;
    const maxY = viewport.position.y + zoomedHeight * 0.5 + this.visibilityBuffer.y;

    this.visibleEntities = this.entities
      .filter((entity) => {
        const { x, y } = entity.position;
        return x >= minX && x <= maxX && y >= minY && y <= maxY;
      })
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  render(ctx: CanvasRenderingContext2D, viewport: Mysli.Viewport, renderFn: Mysli.RenderFunction<T>): void {
    this.updateVisibleEntities(viewport);
    this.visibleEntities.forEach((entity) => {
      // Рендеринг основного entity
      renderFn(ctx, viewport, entity);
    });
  }

  findEntityAt(x: number, y: number): T | null {
    for (let i = this.visibleEntities.length - 1; i >= 0; i--) {
      if (this.isPointWithinBounds(x, y, this.visibleEntities[i])) {
        return this.visibleEntities[i];
      }
    }
    return null;
  }

  findFollowerAt(x: number, y: number): Mysli.Follower | null {
    if (this.state.selected && this.state.selected.followers) {
      for (let i = this.state.selected.followers.length - 1; i >= 0; i--) {
        if (this.isPointWithinBounds(x, y, this.state.selected.followers[i])) {
          return this.state.selected.followers[i];
        }
      }
    }
    return null;
  }

  private isPointWithinBounds(x: number, y: number, entity: Mysli.Renderable | Mysli.Follower): boolean {
    const { x: x2, y: y2 } = entity.position;
    const { width, height } = entity.box;
    return x >= x2 && x <= x2 + width && y >= y2 && y <= y2 + height;
  }
}
