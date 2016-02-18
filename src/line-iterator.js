import {ZERO_POINT, compare, traverse} from './point-helpers'

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
    this.currentScreenRow = 0
    this.currentLineBufferStart = ZERO_POINT
    this.currentLineBufferEnd = ZERO_POINT
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

  seekToScreenPosition (targetPosition) {
    this.findNode(targetPosition.row)
  }

  seekToBufferPosition (targetPosition) {
    this.reset()

    if (!this.currentNode) return null

    while (true) {
      if (compare(targetPosition, this.currentLineBufferStart) <= 0) {
        if (this.currentNode.left) {
          this.descendLeft()
        } else {
          break
        }
      } else {
        if (compare(targetPosition, this.currentLineBufferEnd) <= 0) {
          break
        } else if (this.currentNode.right) {
          this.descendRight()
        } else {
          break
        }
      }
    }
  }

  moveToSuccessor () {
    if (!this.currentNode) return false

    if (this.currentNode.right) {
      this.descendRight()
      while (this.currentNode.left) {
        this.descendLeft()
      }
      return true
    } else {
      while (this.currentNode.parent && this.currentNode.parent.right === this.currentNode) {
        this.ascend()
      }
      this.ascend()

      return this.currentNode != null
    }
  }

  getScreenRow () {
    return this.currentScreenRow
  }

  getScreenLineLength () {
    return this.currentNode.screenExtent
  }

  getBufferStart () {
    return this.currentLineBufferStart
  }

  getBufferEnd () {
    return this.currentLineBufferEnd
  }

  getTokens (node) {
    return this.currentNode ? this.currentNode.tokens : null
  }

  getScreenPositionWithMaxLineLength () {
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

  ascend () {
    this.leftAncestor = this.leftAncestorStack.pop()
    this.leftAncestorRow = this.leftAncestorRowStack.pop()
    this.leftAncestorBufferEnd = this.leftAncestorBufferEndStack.pop()
    this.setCurrentNode(this.currentNode.parent)
  }

  pushToAncestorStacks () {
    this.leftAncestorStack.push(this.leftAncestor)
    this.leftAncestorRowStack.push(this.leftAncestorRow)
    this.leftAncestorBufferEndStack.push(this.leftAncestorBufferEnd)
  }
}
