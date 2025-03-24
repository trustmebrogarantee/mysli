// @ts-nocheck
import { lerp } from "~/shared/lib/math";

export class AnimationPool {
  constructor() {
    this.animatedObjects = new Map();
  }

  alter(animatedObject, alterationFn) {
    if (!this.animatedObjects.has(animatedObject)) return
    const settings = this.animatedObjects.get(animatedObject)
    if (!settings) return
    alterationFn()
    if (settings.paths.every(path => animatedObject[path] === settings.target[path])) {
      this.animatedObjects.delete(animatedObject)
    }
  }

  alterAll () {
    for (const animatedObject of this.animatedObjects.keys()) {
      this.alter(animatedObject, () => {
        const settings = this.animatedObjects.get(animatedObject)
        for (const path of settings.paths) {
          animatedObject[path] = lerp(animatedObject[path], settings.target[path], 0.1)
        }
      })
    }
  }

  add(object, animatedFieldPaths: string[], target: object) {
    this.animatedObjects.set(object, {
      paths: animatedFieldPaths,
      target,
    })
  }

  remove(object) {
    this.animatedObjects.delete(object)
  }
}