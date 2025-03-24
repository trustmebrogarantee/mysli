import type { Mysli } from "~/types/Mysli";
import { Vec2 } from "~/shared/lib/math";
import { UIControl } from "./UIControl";
import type { CanvasDirector } from "../core";

export class UIControlRepositionChildren extends UIControl<RepositionChildrenFollower> {
  public director: CanvasDirector<Mysli.Renderable>
  constructor(entity: Mysli.Renderable, director: CanvasDirector<Mysli.Renderable>) {
    super(
      entity,
      new RepositionChildrenFollower(entity, 'down-branching')
    )
    this.director = director
  }
}

export interface RepositionChildrenFollowerPayload {
  direction: 'down-branching'
}

export class RepositionChildrenFollower implements Mysli.Follower {
  public type: Mysli.Follower["type"]
  public offset: Mysli.Follower["offset"]
  public position:  Mysli.Follower["position"]
  public box: Mysli.Follower["box"]
  public zIndex?: Mysli.Follower["zIndex"]
  public payload: RepositionChildrenFollowerPayload
  public entity: Mysli.Renderable
  public parent: UIControlRepositionChildren | null
  private prevState: { box: Mysli.Follower["box"] }

  constructor(entity: Mysli.Renderable, direction: RepositionChildrenFollowerPayload["direction"]) {
    this.type = 'button:icon:resize'
    this.offset = new Vec2(0, 0);
    this.position = new Vec2(0, 0);
    this.box = { width: 32, height: 32 }; 
    this.payload = { direction }
    this.entity = entity
    this.parent = null
    this.prevState = { box: { ...this.box } }
  }

  recalculate (): void {
    const halfMyHeight = this.box.height / 2
    const padding = 16
    if (this.payload.direction === 'down-branching') this.offset = new Vec2(this.entity.box.width + padding, this.entity.box.height * 0.5 - halfMyHeight)
  }

  render (ctx: CanvasRenderingContext2D): void {
      const buttonRadius = this.box.width / 2
      const x = this.position.x + buttonRadius 
      const y = this.position.y + buttonRadius
      ctx.beginPath();
      ctx.arc(x, y, buttonRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(22, 115, 197)';
      ctx.fill();

      /* add "+" sign inside round */
      ctx.fillStyle = 'rgb(255, 255, 255)';
      ctx.textAlign = 'center';
      ctx.font = '18px Arial';
      ctx.fillText('∩', x, y + 6);
  }

  reposition(entity = this.entity, position: { x: number, y: number } = entity.position) {
    if (entity.children.length === 0) return
    const children = entity.children
    const yBottom = position.y + entity.box.height
    const xCenter = position.x + entity.box.width * 0.5

    const X_GAP = 40
    const Y_GAP = 40
    let totalChildrenWidth = X_GAP * (children.length - 1)
    for (const child of children) totalChildrenWidth += child.box.width

    let x = xCenter - totalChildrenWidth * 0.5
    for (const child of children) {
      const newPos = { x, y: yBottom + Y_GAP * 2 }
      if (this.parent) {
        this.parent.director.animationPool.add(
          child.position,
          ['x', 'y'],
          newPos
        )
      } else {
        child.position.set(newPos.x, newPos.y)
      }
      x += child.box.width + X_GAP
      this.reposition(child, newPos)
    }
  }

  styleMouseDown() {
    this.prevState = { box: { ...this.box } }
    this.box.width *= 1.2
    this.box.height *= 1.2
  }

  styleMouseUp() {
    this.box = { ...this.prevState.box }
  }
}