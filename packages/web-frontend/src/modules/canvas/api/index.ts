import type { Mysli } from "~/types/Mysli";

import EventEmitter from "eventemitter3";
import { document } from "./util/document";
import { renderable } from "./util/renderable";
import { useCommunicationClient } from "./util/useCommunicationClient";
import { CanvasDirector } from "~/modules/canvas/core";
import { ResizeFollower, UIControlResize } from "~/modules/canvas/ui-controls/UIControlResize";
import { LinkNewFollower, UIControlLinkNew } from "~/modules/canvas/ui-controls/UIControlLinkNew";
import { UIControlRepositionChildren, RepositionChildrenFollower } from "../ui-controls/UIControlRepositionChildren";
import type { Ref } from "vue";
export { document, renderable, useCommunicationClient }

type EmittedEvents = {
  'document:creationstart': (renderable: Mysli.Renderable) => {},
  'document:creationend': (title: string, parentRenderable: Mysli.Renderable) => {}
}

export const thoughtApi = () => {
  const client = useCommunicationClient()
  const emitter = new EventEmitter<EmittedEvents>()
  const state: Mysli.ActiveEntityStates<Mysli.Renderable> = {
    selected: null,
    hovered: null,
  }
  const uiControls: { 
    resize: UIControlResize | null,
    linkNew: UIControlLinkNew | null,
    repositionChildren: UIControlRepositionChildren | null
   } = {
    resize: null,
    linkNew: null,
    repositionChildren: null
  }

  emitter.on('document:creationend', async (title: string, parent: Mysli.Renderable) => {
    const { data } = await client.createDocument(title, parent, { skipRefresh: true })    
    if (data) {
      const { error } = await client.moveNode(data.id, parent.id, { skipRefresh: true }) 
      if (!error) {
        data.parent_id = parent.id
        parent.content.push(renderable.fromDocument(data))
      }
      client.appendToData(renderable.fromDocument(data))
    }
  })

  return {
    client,
    on: (...args: Parameters<EventEmitter<EmittedEvents>['on']>) => {
      emitter.on(...args);
    },
    off: (...args: Parameters<EventEmitter<EmittedEvents>['off']>) => {
      emitter.off(...args);
    },
    commit: (...args: any) => {
      (emitter.emit as any)(...args);
    },
    loadCanvasApplication(canvasRef: Ref<HTMLCanvasElement>) {
      const canvasDirector = new CanvasDirector(
        canvasRef,
        client.nonReactiveData,
        state,
        {
          onSelect: (entity) => {
            if (entity.followers.length > 0) return
              uiControls.resize = new UIControlResize(entity)
              uiControls.linkNew = new UIControlLinkNew(entity)
              uiControls.repositionChildren = new UIControlRepositionChildren(entity, canvasDirector)
              entity.followers = [
                uiControls.resize.followers,
                uiControls.linkNew.followers,
                uiControls.repositionChildren.followers
              ].flat()
          },
          onDeselect: (entity) => {
            entity.followers = []
          },
          onFollowerTouchStart: (follower) => {
            if (follower instanceof ResizeFollower) follower.styleDragStart()
            if (follower instanceof LinkNewFollower) {
              follower.styleMouseDown()
              emitter.emit('document:creationstart', state.selected as Mysli.Renderable)
            }
            if (follower instanceof RepositionChildrenFollower) {
              follower.styleMouseDown()
              follower.reposition()
            }
          },
          onFollowerTouchEnd: (follower) => {
            if (follower instanceof ResizeFollower) follower.styleDragStop()
            if (follower instanceof LinkNewFollower) follower.styleMouseUp() 
            if (follower instanceof RepositionChildrenFollower) follower.styleMouseUp()
          },
          onFollowerMousedown: (follower) => {
            if (follower instanceof ResizeFollower) follower.styleDragStart()
            if (follower instanceof LinkNewFollower) {
              follower.styleMouseDown()
              emitter.emit('document:creationstart', state.selected as Mysli.Renderable)
            }
            if (follower instanceof RepositionChildrenFollower) {
              follower.styleMouseDown()
              follower.reposition()
            }
          },
          onFollowerMouseup: (follower) => {
            if (follower instanceof ResizeFollower) follower.styleDragStop()
            if (follower instanceof LinkNewFollower) follower.styleMouseUp() 
            if (follower instanceof RepositionChildrenFollower) follower.styleMouseUp()
          },
          onFollowerDrag: (follower, _viewport, { deltaX, deltaY }) => {
            if (!state.selected) return
            if (follower instanceof ResizeFollower) {
              follower.resizeEntity(deltaX, deltaY, (dx, dy) => {
                canvasDirector.moveSelectedByNotAnimated(dx, dy)
              })
            }
          },
          onKeyPress(key) {
            if (key === 'Delete' && state.selected) {
              client.deleteDocument(state.selected)
            }
          }
        }
      )
    }

  }
}