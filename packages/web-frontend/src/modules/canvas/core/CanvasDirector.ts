import type { Mysli } from "~/types/Mysli";
import { SceneRenderer } from "./SceneRenderer";
import { AnimationEngine } from "./AnimationEngine";
import { InputManager } from "./InputManager";
import { ViewportManager } from "./ViewportManager";
import { renderHierarchy } from "./renderHierarchy";
import { AnimationPool } from "./AnimationPool";
import type { Ref } from 'vue'

export class CanvasDirector<T extends Mysli.Renderable> {
  private viewport: ViewportManager;
  private renderer: SceneRenderer<T>;
  private animationEngine: AnimationEngine<T>;
  private inputManager: InputManager<T>;
  private ctx: CanvasRenderingContext2D;
  private state: Mysli.ActiveEntityStates<T>;
  public animationPool = new AnimationPool()

  constructor(
    canvasRef: Ref<HTMLCanvasElement>,
    entities: T[] = [],
    state: Mysli.ActiveEntityStates<T>,
    inputEvents: Mysli.InputEvents = {}
  ) {
    const ctx = canvasRef.value.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to initialize 2D rendering context");

    this.ctx = ctx;
    this.ctx.textRendering = "optimizeLegibility";

    const parentBox = this.ctx.canvas.parentElement!.getBoundingClientRect();
    this.viewport = new ViewportManager(parentBox.width, parentBox.height);
    this.ctx.canvas.width = this.viewport.width
    this.ctx.canvas.height = this.viewport.height
    
    this.renderer = new SceneRenderer<T>(entities, state);
    this.animationEngine = new AnimationEngine<T>(ctx, state);
    this.inputManager = new InputManager<T>(
      canvasRef.value,
      this.viewport,
      this.renderer,
      inputEvents,
      this.animationEngine
    );
    this.state = state
    
    this.initialize((ctx: CanvasRenderingContext2D, viewport: Mysli.Viewport, entity: T) => {
      entity.render(ctx, viewport, entity)
      renderHierarchy(ctx, entity)
      if (entity.followers) entity.followers.forEach(f => {
        f.recalculate()
        f.render(ctx, viewport, entity)
      })
    });
  }

  private resize() {
    const parentBox = this.ctx.canvas.parentElement!.getBoundingClientRect();
    this.viewport.resize(parentBox.width, parentBox.height)
    this.ctx.canvas.width = this.viewport.width
    this.ctx.canvas.height = this.viewport.height
  }

  public moveSelectedByNotAnimated(deltaX: number, deltaY: number) {
    this.animationEngine.setTargetPosition(
      this.animationEngine.targetPosition.x + deltaX,
      this.animationEngine.targetPosition.y + deltaY
    );
    this.state.selected!.position.set(
      this.animationEngine.targetPosition.x, 
      this.animationEngine.targetPosition.y
    );
  }

  private initialize(renderEntity: Mysli.RenderFunction<T>): void {
    this.viewport.resize(this.ctx.canvas.width, this.ctx.canvas.height);
    this.renderer.updateVisibleEntities(this.viewport);

    const canvas = this.ctx.canvas;
    canvas.addEventListener("mousedown", this.inputManager.handleMousePanOrDrag);
    canvas.addEventListener("wheel", this.inputManager.handleZoom, { passive: true });
    canvas.addEventListener("click", this.inputManager.handleClick);
    canvas.addEventListener("touchstart", this.inputManager.handleTouchInteraction, { passive: false });
    canvas.addEventListener("touchstart", this.inputManager.handleTap, { passive: false });
    document.addEventListener("keydown", this.inputManager.handleKeyPress)
    window.addEventListener("resize", this.resize.bind(this))
    this.animationEngine.run(this.ctx, this.viewport, this.animationPool, this.renderer, renderEntity);
  }

  shutdown(): void {
    this.animationEngine.stop();
    const canvas = this.ctx.canvas;
    canvas.removeEventListener("mousedown", this.inputManager.handleMousePanOrDrag);
    canvas.removeEventListener("wheel", this.inputManager.handleZoom);
    canvas.removeEventListener("click", this.inputManager.handleClick);
    canvas.removeEventListener("touchstart", this.inputManager.handleTouchInteraction);
    canvas.removeEventListener("touchstart", this.inputManager.handleTap);
    document.removeEventListener("keydown", this.inputManager.handleKeyPress)
    window.removeEventListener("resize", this.resize.bind(this))
  }
}