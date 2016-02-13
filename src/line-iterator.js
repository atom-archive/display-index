import {ZERO_POINT, traverse} from './point-helpers'

export default class LineIterator {
  constructor (tree) {
    this.tree = tree
  }

  reset () {
    this.leftAncestor = null
    this.leftAncestorRow = -1
    this.leftAncestorBufferEnd = ZERO_POINT
    this.leftAncestorStack = []
    this.leftAncestorRowStack = [-1]
    this.leftAncestorBufferEndStack = [ZERO_POINT]
    this.currentScreenRow = -1
    this.setCurrentNode(this.tree.root)
  }

  findNode (row) {
    this.reset()

    if (!this.currentNode) return null

    while (true) {
      if (row < this.currentScreenRow) {
        if (this.currentNode.left) {
          this.descendLeft()
        } else {
          return null
        }
      } else if (row === this.currentScreenRow) {
        return this.currentNode
      } else { // row > this.currentScreenRow
        if (this.currentNode.right) {
          this.descendRight()
        } else {
          return null
        }
      }
    }
  }

  getPointWithMaxLineLength () {
    this.reset()

    if (!this.currentNode) return null

    let maxScreenExtent = this.currentNode.maxScreenExtent
    while (true) {
      if (this.currentNode.screenExtent === maxScreenExtent) {
        return {row: this.currentScreenRow, column: maxScreenExtent}
      } else if (this.currentNode.left && this.currentNode.left.maxScreenExtent === maxScreenExtent) {
        this.descendLeft()
      } else {
        this.descendRight()
      }
    }
  }

  setCurrentNode (node) {
    this.currentNode = node
    if (this.currentNode) {
      this.currentScreenRow = this.leftAncestorRow + this.currentNode.getLeftSubtreeRowCount() + 1
      this.currentLineBufferStart = traverse(this.leftAncestorBufferEnd, this.currentNode.getLeftSubtreeBufferExtent())
      this.currentLineBufferEnd = traverse(this.currentLineBufferStart, this.currentNode.bufferExtent)
    }
  }

  descendLeft () {
    this.pushToAncestorStacks()
    this.setCurrentNode(this.currentNode.left)
  }

  descendRight () {
    this.pushToAncestorStacks()
    this.leftAncestor = this.currentNode
    this.leftAncestorRow = this.currentScreenRow
    this.leftAncestorBufferEnd = this.currentLineBufferEnd
    this.setCurrentNode(this.currentNode.right)
  }

  pushToAncestorStacks () {
    this.leftAncestorStack.push(this.leftAncestor)
    this.leftAncestorRowStack.push(this.leftAncestorRow)
    this.leftAncestorBufferEndStack.push(this.leftAncestorBufferEnd)
  }
}
