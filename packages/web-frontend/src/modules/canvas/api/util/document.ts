import { v4 as uuid } from 'uuid'
import type { Mysli } from '~/types/Mysli'

export const document = {
  fromTitleAndParent (title: string, parent?: Mysli.Renderable): Mysli.Document {
    const HEIGHT = 40
    const WIDTH = 180
    return {
      id: uuid(),
      type: "box",
      title,
      position_x: parent ? Math.round(parent.position.x + (parent.box.width * 0.5) - (WIDTH * 0.5)) : 0,
      position_y: parent ? Math.round(parent.position.y + parent.box.height + HEIGHT + 100) : 0,
      box_width: WIDTH,
      box_height: HEIGHT,
      box_padding: 0,
      z_index: 0,
      content: [],
      is_root: false,
      parent_id: parent?.id || null
    }
  }
}