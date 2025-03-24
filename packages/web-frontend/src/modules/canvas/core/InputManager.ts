import type { Mysli } from "~/types/Mysli";
import type { SceneRenderer } from "./SceneRenderer";
import { lerp, clamp, Vec2, Vec2Pool } from "~/shared/lib/math";
import type { AnimationEngine } from "./AnimationEngine";

export class InputManager<T extends Mysli.Renderable> {
  private readonly MAX_ZOOM = 6;
  private readonly MIN_ZOOM = 0.25;
  private canvas: HTMLCanvasElement;
  private viewport: Mysli.Viewport;
  private renderer: SceneRenderer<T>;
  private events: Mysli.InputEvents;
  private animationEngine: AnimationEngine<T>;
  private vec2Pool = new Vec2Pool();

  constructor(
    canvas: HTMLCanvasElement,
    viewport: Mysli.Viewport,
    renderer: SceneRenderer<T>,
    events: Mysli.InputEvents,
    animationEngine: AnimationEngine<T>
  ) {
    this.canvas = canvas;
    this.viewport = viewport;
    this.renderer = renderer;
    this.events = events;
    this.animationEngine = animationEngine;
  }

  private toWorldCoordinates(screenX: number, screenY: number): Vec2 {
    const zoomFactor = 1 / this.viewport.zoomLevel;
    return this.vec2Pool.get(
      (screenX - this.canvas.width * 0.5) * zoomFactor + this.viewport.position.x,
      (screenY - this.canvas.height * 0.5) * zoomFactor + this.viewport.position.y
    );
  }

  handleMousePanOrDrag = (e: MouseEvent): void => {
    let lastX = e.clientX;
    let lastY = e.clientY;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = this.toWorldCoordinates(screenX, screenY);
    const entity = this.renderer.findEntityAt(worldPos.x, worldPos.y);
    const follower = this.renderer.findFollowerAt(worldPos.x, worldPos.y);

    if (!follower) this.setSelected(entity);
    else if (this.events.onFollowerMousedown) this.events.onFollowerMousedown(follower, this.viewport)
    this.vec2Pool.release(worldPos);

    const move = (e: MouseEvent): void => {
      const zoomFactor = 1 / this.viewport.zoomLevel;
      const deltaX = (lastX - e.clientX) * zoomFactor;
      const deltaY = (lastY - e.clientY) * zoomFactor;
      if (follower) {
        if (this.events.onFollowerDrag) this.events.onFollowerDrag(follower, this.viewport, { deltaX, deltaY  })
      } else if (this.state.selected) {
        this.animationEngine.setTargetPosition(
          this.animationEngine.targetPosition.x - deltaX,
          this.animationEngine.targetPosition.y - deltaY
        );
      } else  {
        this.viewport.position.add(new Vec2(deltaX, deltaY));
      }

      lastX = e.clientX;
      lastY = e.clientY;
    };

    const end = (): void => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", end);
      if (follower) {
        if (this.events.onFollowerMouseup) this.events.onFollowerMouseup(follower, this.viewport)
      }
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
  };

  handleZoom = (e: WheelEvent): void => {
    this.viewport.zoomLevel = clamp(
      this.MIN_ZOOM,
      this.viewport.zoomLevel * Math.pow(1.01, -e.deltaY * 0.2),
      this.MAX_ZOOM
    );
  };

  handleClick = (e: MouseEvent): void => {
    if (e.button !== 0 || !this.events.onClick) return;

    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = this.toWorldCoordinates(screenX, screenY);
    const entity = this.renderer.findEntityAt(worldPos.x, worldPos.y);

    this.events.onClick(worldPos.x, worldPos.y, entity, { ...this.viewport });
    this.vec2Pool.release(worldPos);
    e.preventDefault();
  };

  handleTouchInteraction = (e: TouchEvent): void => {
    e.preventDefault();

    let lastTouch1: { x: number; y: number } | null = null;
    let lastTouch2: { x: number; y: number } | null = null;
    let lastDistance: number | null = null;
    let follower: null | Mysli.Follower = null
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const screenX = touch.clientX - rect.left;
      const screenY = touch.clientY - rect.top;
      const worldPos = this.toWorldCoordinates(screenX, screenY);
      const entity = this.renderer.findEntityAt(worldPos.x, worldPos.y);
      follower = this.renderer.findFollowerAt(worldPos.x, worldPos.y);
      if (!follower) this.setSelected(entity);
      else if (this.events.onFollowerTouchStart) this.events.onFollowerTouchStart(follower, this.viewport)
      this.vec2Pool.release(worldPos);
    }

    const move = (e: TouchEvent): void => {
      e.preventDefault();
      const touches = e.touches;
      const rect = this.canvas.getBoundingClientRect();

      if (touches.length === 1) {
        const currentTouch = {
          x: touches[0].clientX - rect.left,
          y: touches[0].clientY - rect.top,
        };

        if (lastTouch1) {
          const zoomFactor = 1 / this.viewport.zoomLevel;
          const deltaX = (lastTouch1.x - currentTouch.x) * zoomFactor;
          const deltaY = (lastTouch1.y - currentTouch.y) * zoomFactor;

          if (follower) {
            if (this.events.onFollowerDrag) this.events.onFollowerDrag(follower, this.viewport, { deltaX, deltaY  })
          } else if (this.state.selected) {
            this.animationEngine.setTargetPosition(
              this.animationEngine.targetPosition.x - deltaX,
              this.animationEngine.targetPosition.y - deltaY
            );
          } else {
            this.viewport.position.add(new Vec2(deltaX, deltaY));
          }
        }
        lastTouch1 = currentTouch;
      } else if (touches.length === 2) {
        const touch1 = {
          x: touches[0].clientX - rect.left,
          y: touches[0].clientY - rect.top,
        };
        const touch2 = {
          x: touches[1].clientX - rect.left,
          y: touches[1].clientY - rect.top,
        };

        const currentDistance = Math.hypot(touch1.x - touch2.x, touch1.y - touch2.y);

        if (lastTouch1 && lastTouch2 && lastDistance) {
          const scaleFactor = currentDistance / lastDistance;
          const adjustedScaleFactor = lerp(1, scaleFactor, 0.5);
          this.viewport.zoomLevel = clamp(
            this.MIN_ZOOM,
            this.viewport.zoomLevel * adjustedScaleFactor,
            this.MAX_ZOOM
          );

          const centerX = (touch1.x + touch2.x) * 0.5;
          const centerY = (touch1.y + touch2.y) * 0.5;
          const lastCenterX = (lastTouch1.x + lastTouch2.x) * 0.5;
          const lastCenterY = (lastTouch1.y + lastTouch2.y) * 0.5;
          const zoomFactor = 1 / this.viewport.zoomLevel;

          this.viewport.position.add(
            new Vec2(
              (lastCenterX - centerX) * zoomFactor,
              (lastCenterY - centerY) * zoomFactor
            )
          );
        }

        lastTouch1 = touch1;
        lastTouch2 = touch2;
        lastDistance = currentDistance;
      }
    };

    const end = (): void => {
      lastTouch1 = null;
      lastTouch2 = null;
      lastDistance = null;
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
      if (follower) {
        if (this.events.onFollowerTouchEnd) this.events.onFollowerTouchEnd(follower, this.viewport)
      }
    };

    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
  };

  setSelected(entity: T | null): void {
    if (this.state.selected && entity !== this.state.selected) {
      if (this.events.onDeselect) this.events.onDeselect(this.state.selected, this.viewport)
      this.state.selected._editorState.selected = false;
      this.state.selected.zIndex = 0;
      this.state.selected = null
    }

    if (entity) {
      this.animationEngine.setTargetPosition(entity.position.x, entity.position.y);
      entity._editorState.selected = true;
      this.state.selected = entity;
      this.state.selected.zIndex = 1;
      if (this.events.onSelect) this.events.onSelect(this.state.selected, this.viewport)
    }
  }

  handleTap = (e: TouchEvent): void => {
    if (!this.events.onTap || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const screenX = touch.clientX - rect.left;
    const screenY = touch.clientY - rect.top;
    const worldPos = this.toWorldCoordinates(screenX, screenY);
    const entity = this.renderer.findEntityAt(worldPos.x, worldPos.y);
    this.events.onTap(worldPos.x, worldPos.y, entity, { ...this.viewport });
    this.vec2Pool.release(worldPos);
    e.preventDefault();
  };

  handleKeyPress = (e: KeyboardEvent): void => {
    if (!this.events.onKeyPress) return;
    this.events.onKeyPress(e.key, this.viewport)
  }

  private get state() {
    return this.animationEngine['state'];
  }
}