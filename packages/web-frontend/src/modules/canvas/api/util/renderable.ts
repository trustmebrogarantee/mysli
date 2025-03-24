import type { Mysli } from "~/types/Mysli"
import { Renderable, UIComponentCard } from "~/modules/canvas/renderables"

export const renderable =  {
  fromDocument: (document: Mysli.Document): Mysli.Renderable => {
    if (document.type === 'box') return new UIComponentCard(document)
    return new Renderable(document)
  }
}