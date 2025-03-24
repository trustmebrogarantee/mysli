import type { Mysli } from "~/types/Mysli";
import { Vec2 } from "~/shared/lib/math";
import { UIControl } from "./UIControl";

export class UIControlLinkNew extends UIControl<LinkNewFollower> {
  constructor(entity: Mysli.Renderable) {
    super(
      entity,
      new LinkNewFollower(entity, 'down')
    )
  }
}

export interface LinkNewFollowePayload {
  direction: 'down'
}

export class LinkNewFollower implements Mysli.Follower {
  public type: Mysli.Follower["type"]
  public offset: Mysli.Follower["offset"]
  public position:  Mysli.Follower["position"]
  public box: Mysli.Follower["box"]
  public zIndex?: Mysli.Follower["zIndex"]
  public payload: LinkNewFollowePayload
  public entity: Mysli.Renderable
  public parent: UIControlLinkNew | null
  private prevState: { box: Mysli.Follower["box"] }

  constructor(entity: Mysli.Renderable, direction: LinkNewFollowePayload["direction"]) {
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
    const halfMyWidth = this.box.width / 2
    const padding = 16
    if (this.payload.direction === 'down') this.offset = new Vec2(this.entity.box.width / 2 - halfMyWidth, this.entity.box.height + padding)
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
      ctx.fillText('+', x, y + 6);
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