import type { Mysli } from "~/types/Mysli";
import { Vec2 } from "~/shared/lib/math";

export class ViewportManager implements Mysli.Viewport {
  position: Vec2;
  zoomLevel: number;
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.position = new Vec2(0, 0);
    this.zoomLevel = 1;
    this.width = width;
    this.height = height;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}