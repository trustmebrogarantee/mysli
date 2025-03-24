import type { Vec2 } from "~/shared/lib/math";

export namespace Mysli {
  export interface Viewport {
    position: Vec2;
    zoomLevel: number;
    width: number;
    height: number;
    
  }

  export type RenderableForUI = Pick<Mysli.Renderable, 'id' | 'content' | 'is_root' | 'title' | 'parentId'>
  
  export interface Renderable {
    position: Vec2;
    id: string;
    title: string;
    type: string;
    box: { width: number; height: number; padding: number };
    zIndex: number;
    followers: Follower[];
    content: Renderable[];
    parentId: string | null;
    isRoot: boolean;
    is_root: boolean;
    _editorState: {
      hovered: boolean
      selected: boolean
      editing: boolean
      dragging: boolean
      resizing: boolean
    };
    render: RenderFunction<Renderable>;
    get parent(): Renderable | null;
    get children(): Renderable[];
  }

  export type ServerDataContract = { data: Mysli.Document | null, error: Error | null }
  
  export interface Document {
    id: string
    type: string
    title: string
    position_x: number
    position_y: number
    box_width: number
    box_height: number
    box_padding: number
    z_index: number
    is_root: boolean
    parent_id: string | null
    content?: Mysli.Document[]
  }

  interface _Follower extends Follower {}
  export interface Follower {
    type: 'button:icon:add' | 'button:icon:resize'
    offset: Vec2; // Относительное смещение от entity
    position: Vec2; // Абсолютная позиция (обновляется автоматически)
    box: { width: number; height: number }; // Размеры для рендеринга
    zIndex?: number; // Опциональный zIndex (по умолчанию чуть выше entity)
    payload: { [key: string]: any };
    parent: null | UIControl<_Follower>;
    recalculate(): void;
    render: RenderFunction<Renderable>
  }

  export interface UIControl<T extends Follower> {
    followers: T[]
    entity: Renderable
    render: RenderFunction<Renderable>
    recalculate(): void
  }

  export interface RenderFunction<T extends Renderable> {
    (ctx: CanvasRenderingContext2D, viewport: Viewport, entity: T): void;
  }

  export type AmimatedObjectSchema<T> = {
    actual: T,
    target: Partial<T>,
    animatedProperties: (keyof T)[]
  }
  
  export type ActiveEntityStates<T> = { selected: T | null; hovered: T | null };
  
  export interface InputEvents {
    onClick?(x: number, y: number, entity: Renderable | null, viewport: Viewport): void;
    onTap?(x: number, y: number, entity: Renderable | null, viewport: Viewport): void;
    onKeyPress?(key: string, viewport: Viewport): void;
    onSelect?(entity: Renderable, viewport: Viewport): void;
    onDeselect?(entity: Renderable, viewport: Viewport): void;
  
    onFollowerMousedown?(entity: Follower, viewport: Viewport): void;
    onFollowerMousein?(entity: Follower, viewport: Viewport): void;
    onFollowerTouchStart?(entity: Follower, viewport: Viewport): void;
    onFollowerTouchEnd?(entity: Follower, viewport: Viewport): void;
    onFollowerMouseout?(entity: Follower, viewport: Viewport): void;
    onFollowerMouseup?(entity: Follower, viewport: Viewport): void;
    onFollowerDrag?(entity: Follower, viewport: Viewport, payload: { deltaX: number, deltaY: number }): void;
  }
}