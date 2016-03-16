import {traverse, ZERO_POINT} from './point-helpers'

let idCounter = 0

export default class LineNode {
  constructor ({screenExtent, bufferExtent, tokens, softWrappedAtStart, softWrappedAtEnd}, left, right, priority) {
    this.screenExtent = screenExtent
    this.bufferExtent = bufferExtent
    this.tokens = tokens
    this.softWrappedAtStart = softWrappedAtStart
    this.softWrappedAtEnd = softWrappedAtEnd
    this.left = left
    this.right = right
    this.priority = priority
    this.id = ++idCounter
    this.parent = null

    this.computeTokenOffsets()
    this.computeSubtreeProperties()
  }

  computeTokenOffsets () {
    let screenStartOffset = 0
    let bufferStartOffset = ZERO_POINT
    let tokenCount = this.tokens.length

    if (tokenCount === 0) throw new Error('Lines must contain at least one token')

    for (let i = 0; i < tokenCount; i++) {
      let token = this.tokens[i]
      let screenEndOffset = screenStartOffset + token.screenExtent
      let bufferEndOffset = traverse(bufferStartOffset, token.bufferExtent)
      token.screenStartOffset = screenStartOffset
      token.screenEndOffset = screenEndOffset
      token.bufferStartOffset = bufferStartOffset
      token.bufferEndOffset = bufferEndOffset
      screenStartOffset = screenEndOffset
      bufferStartOffset = bufferEndOffset
    }
  }

  computeSubtreeProperties () {
    let leftSubtreeRowCount = this.left ? this.left.subtreeRowCount : 0
    let rightSubtreeRowCount = this.right ? this.right.subtreeRowCount : 0
    this.subtreeRowCount = leftSubtreeRowCount + 1 + rightSubtreeRowCount

    let leftMax = this.left ? this.left.maxScreenExtent : -1
    let rightMax = this.right ? this.right.maxScreenExtent : -1
    this.maxScreenExtent = Math.max(leftMax, this.screenExtent, rightMax)

    let leftSubtreeBufferExtent = this.left ? this.left.subtreeBufferExtent : ZERO_POINT
    let rightSubtreeBufferExtent = this.right ? this.right.subtreeBufferExtent : ZERO_POINT
    this.subtreeBufferExtent = traverse(traverse(leftSubtreeBufferExtent, this.bufferExtent), rightSubtreeBufferExtent)
  }

  getLeftSubtreeRowCount () {
    if (this.left) {
      return this.left.subtreeRowCount
    } else {
      return 0
    }
  }

  getLeftSubtreeBufferExtent () {
    if (this.left) {
      return this.left.subtreeBufferExtent
    } else {
      return ZERO_POINT
    }
  }
}
