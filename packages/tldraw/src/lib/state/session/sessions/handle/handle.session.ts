import { Vec } from '@tldraw/core'
import { TLDrawShape } from '../../../../shape'
import { Session } from '../../../state-types'
import { Data } from '../../../state-types'
import { TLDR } from '../../../tldr'

export class HandleSession implements Session {
  id = 'transform_single'
  commandId: string
  delta = [0, 0]
  origin: number[]
  shiftKey = false
  initialShape: TLDrawShape
  handleId: string

  constructor(data: Data, handleId: string, point: number[], commandId = 'move_handle') {
    const shapeId = data.pageState.selectedIds[0]
    this.origin = point
    this.handleId = handleId
    this.initialShape = TLDR.getShape(data, shapeId)
    this.commandId = commandId
  }

  start = (data: Data) => data

  update = (
    data: Data,
    point: number[],
    shiftKey: boolean,
    altKey: boolean,
    metaKey: boolean
  ): Data => {
    const { initialShape, origin } = this

    const shape = TLDR.getShape(data, initialShape.id)

    TLDR.assertShapeHasProperty(shape, 'handles')

    this.shiftKey = shiftKey

    const delta = Vec.vec(origin, point)

    const handles = initialShape.handles!

    const handleId = this.handleId as keyof typeof handles

    const change = TLDR.getShapeUtils(shape).onHandleChange(
      shape,
      {
        [handleId]: {
          ...shape.handles[handleId],
          point: Vec.round(Vec.add(handles[handleId].point, delta)), // Vec.rot(delta, shape.rotation)),
        },
      },
      { delta, shiftKey, altKey, metaKey }
    )

    if (!change) return data

    return {
      ...data,
      page: {
        ...data.page,
        shapes: {
          ...data.page.shapes,
          [shape.id]: {
            ...shape,
            ...change,
          },
        },
      },
    }
  }

  cancel = (data: Data) => {
    const { initialShape } = this

    return {
      ...data,
      page: {
        ...data.page,
        shapes: {
          ...data.page.shapes,
          [initialShape.id]: initialShape,
        },
      },
    }
  }

  complete(data: Data) {
    return {
      id: this.commandId,
      before: {
        page: {
          shapes: {
            [this.initialShape.id]: this.initialShape,
          },
        },
      },
      after: {
        page: {
          shapes: {
            [this.initialShape.id]: TLDR.onSessionComplete(
              data,
              data.page.shapes[this.initialShape.id]
            ),
          },
        },
      },
    }
  }
}
