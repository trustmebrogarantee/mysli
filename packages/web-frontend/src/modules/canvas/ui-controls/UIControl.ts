import type { Mysli } from "~/types/Mysli"

export class UIControl<T extends Mysli.Follower> implements Mysli.UIControl<T> {
  public followers: T[]
  public entity: Mysli.Renderable
  constructor(entity: Mysli.Renderable, ...followers: T[]) {
    this.followers = followers
    this.entity = entity
    for (const follower of followers) follower.parent = this
  }
  render(ctx: CanvasRenderingContext2D, viewport: Mysli.Viewport, entity: Mysli.Renderable): void {
    this.followers.forEach(follower => follower.render(ctx, viewport, entity))
  }
  recalculate() {
    this.followers.forEach(follower => follower.recalculate())
  }
}