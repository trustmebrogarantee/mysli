import { Vec2 } from "~/shared/lib/math";
import type { Mysli } from "~/types/Mysli";
import { renderable } from "../api";

const cache = new Map()

export class Renderable implements Mysli.Renderable  {
  public id!: string 
  public isRoot!: boolean;
  public is_root!: boolean;
  public type!: string
  public title!: string
  public position!: Vec2;
  public box!: { width: number; height: number; padding: number };
  public zIndex!: number;
  public followers: Mysli.Follower[] = [];
  public content!: Mysli.Renderable[];
  public parentId!: string | null;
  public _editorState: Mysli.Renderable["_editorState"] = {
    hovered: false,
    selected: false,
    editing: false,
    dragging: false,
    resizing: false
  }

  constructor(document: Mysli.Document) {
    if (cache.has(document.id)) {
      const cached = cache.get(document.id) as Renderable
      cached.parentId = document.parent_id
      return cached
    }
    this.id = document.id,
    this.type = document.type,
    this.title = document.title,
    this.position = new Vec2(document.position_x, document.position_y),
    this.box = { width: document.box_width, height: document.box_height, padding: document.box_padding },
    this.zIndex = document.z_index,
    this.followers = []
    this.parentId = document.parent_id
    this.isRoot = document.is_root
    this.content = document.content ? document.content.map(c =>  renderable.fromDocument(c)) : []

    // Not Root-node nor its relations are never rendered
    if (!this.isRoot) cache.set(this.id, this)
  }

  get parent(): Mysli.Renderable | null {
    return cache.get(this.parentId)
  }

  get children(): Mysli.Renderable[] {
    const c = []
    for (const child of this.content) {
      if (cache.has(child.id)) {
        c.push(cache.get(child.id))
      }
    }
    return c
  }

  render(_ctx: CanvasRenderingContext2D, _viewport: Mysli.Viewport, _entity: Mysli.Renderable) {}
}