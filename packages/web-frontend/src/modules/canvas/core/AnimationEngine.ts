import type { Mysli } from "~/types/Mysli";
import type { SceneRenderer } from "./SceneRenderer";
import { lerp } from "~/shared/lib/math";
import { ViewportManager } from "./ViewportManager";
import type { AnimationPool } from "./AnimationPool";

export class AnimationEngine<T extends Mysli.Renderable> {
  private frameId: number = 0;
  private smoothViewport: Mysli.Viewport;
  private state: Mysli.ActiveEntityStates<T>;
  public readonly targetPosition = { x: 0, y: 0 };
  private transformMatrix: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];

  constructor(ctx: CanvasRenderingContext2D, state: { selected: T | null; hovered: T | null }) {
    this.smoothViewport = new ViewportManager(ctx.canvas.width, ctx.canvas.height);;
    this.state = state;
  }

  updateTransform(viewport: Mysli.Viewport): void {
    this.transformMatrix = [
      viewport.zoomLevel,
      0,
      0,
      viewport.zoomLevel,
      viewport.width * 0.5 - viewport.position.x * viewport.zoomLevel,
      viewport.height * 0.5 - viewport.position.y * viewport.zoomLevel
    ];
  }

  run(
    ctx: CanvasRenderingContext2D,
    targetViewport: Mysli.Viewport,
    animationPool: AnimationPool,
    renderer: SceneRenderer<T>,
    renderFn: Mysli.RenderFunction<T>
  ): void {

    animationPool.alterAll()
    this.smoothViewport.position.lerp(targetViewport.position, 0.2);
    this.smoothViewport.zoomLevel = lerp(this.smoothViewport.zoomLevel, targetViewport.zoomLevel, 0.2);

    if (this.state.selected) {
      // Обновление позиции выбранного entity
      this.state.selected.position.x = lerp(this.state.selected.position.x, this.targetPosition.x, 0.2);
      this.state.selected.position.y = lerp(this.state.selected.position.y, this.targetPosition.y, 0.2);

      // Обновление позиций followers
      if (this.state.selected.followers) {
        this.state.selected.followers.forEach((follower) => {
          follower.position.x = this.state.selected!.position.x + follower.offset.x;
          follower.position.y = this.state.selected!.position.y + follower.offset.y;
        });
      }
    }

    this.updateTransform(this.smoothViewport);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, targetViewport.width, targetViewport.height);
    ctx.setTransform(...this.transformMatrix);


    renderer.render(ctx, targetViewport, renderFn);
    this.frameId = requestAnimationFrame(() => this.run(ctx, targetViewport, animationPool, renderer, renderFn));
  }

  stop(): void {
    cancelAnimationFrame(this.frameId);
  }

  setTargetPosition(x: number, y: number): void {
    this.targetPosition.x = x;
    this.targetPosition.y = y;
  }
}