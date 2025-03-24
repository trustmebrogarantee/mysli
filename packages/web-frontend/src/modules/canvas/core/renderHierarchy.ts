import type { Mysli } from "~/types/Mysli"

export const renderHierarchy = (ctx: CanvasRenderingContext2D, entity: Mysli.Renderable): void => {
  const children = entity.children
  if (children.length === 0) return

  const parentXCenter = entity.position.x + entity.box.width * 0.5
  const parentYBottom = entity.position.y + entity.box.height
  const BRANCH_STEP_HEIGHT = 40
  const childrenLevelY = parentYBottom + BRANCH_STEP_HEIGHT

  ctx.moveTo(parentXCenter, parentYBottom)
  ctx.lineTo(parentXCenter, childrenLevelY)

  let minCenterX = Math.min(children[0].position.x + children[0].box.width * 0.5, parentXCenter)
  let maxCenterX = Math.max(children[0].position.x + children[0].box.width * 0.5, parentXCenter)
  for (const child of children) {
    const centerX = child.position.x + child.box.width * 0.5
    if (centerX < minCenterX) minCenterX = centerX
    if (centerX > maxCenterX) maxCenterX = centerX
    ctx.moveTo(centerX, childrenLevelY)
    ctx.lineTo(centerX, child.position.y)
  }
  ctx.moveTo(minCenterX, childrenLevelY)
  ctx.lineTo(maxCenterX, childrenLevelY)

  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = entity._editorState.selected ? 'rgb(22, 115, 197)' : 'rgba(0, 0, 0, 0.2)'
  ctx.stroke();
}