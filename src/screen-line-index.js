import Random from 'random-seed'
import LineIterator from './line-iterator'
import TokenIterator from './token-iterator'
import LineNode from './line-node'

export default class ScreenLineIndex {
  constructor (seed = Date.now()) {
    this.randomGenerator = new Random(seed)
    this.root = null
    this.lineIterator = new LineIterator(this)
  }

  buildIterator () {
    return new TokenIterator(this)
  }

  splice (startRow, replacementCount, newScreenLines) {
    let startNode = this.lineIterator.findNode(startRow - 1)
    let endNode = this.lineIterator.findNode(startRow + replacementCount)

    if (startNode) {
      startNode.priority = -1
      this.bubbleNodeUp(startNode)
    }

    if (endNode) {
      endNode.priority = -2
      this.bubbleNodeUp(endNode)
    }

    let newScreenLinesSubtree = this.buildScreenLinesTree(newScreenLines)
    if (startNode) {
      startNode.right = newScreenLinesSubtree
      if (newScreenLinesSubtree) newScreenLinesSubtree.parent = startNode
      startNode.computeSubtreeProperties()
    } else if (endNode) {
      endNode.left = newScreenLinesSubtree
      if (newScreenLinesSubtree) newScreenLinesSubtree.parent = endNode
    } else {
      this.root = newScreenLinesSubtree
    }

    if (endNode) endNode.computeSubtreeProperties()

    if (startNode) {
      startNode.priority = this.generateRandom()
      this.bubbleNodeDown(startNode)
    }

    if (endNode) {
      endNode.priority = this.generateRandom()
      this.bubbleNodeDown(endNode)
    }
  }

  getLastScreenRow () {
    return this.getScreenLineCount() - 1
  }

  getScreenLineCount () {
    return this.root ? this.root.subtreeRowCount : 0
  }

  lineLengthForScreenRow (row) {
    let node = this.lineIterator.findNode(row)
    if (node) {
      return node.screenExtent
    } else {
      return null
    }
  }

  getScreenPositionWithMaxLineLength () {
    return this.lineIterator.getScreenPositionWithMaxLineLength()
  }

  bubbleNodeUp (node) {
    while (node.parent && node.priority < node.parent.priority) {
      if (node === node.parent.left) {
        this.rotateNodeRight(node)
      } else {
        this.rotateNodeLeft(node)
      }
    }
  }

  bubbleNodeDown (node) {
    while (true) {
      let leftChildPriority = node.left ? node.left.priority : Infinity
      let rightChildPriority = node.right ? node.right.priority : Infinity

      if (leftChildPriority < rightChildPriority && leftChildPriority < node.priority) {
        this.rotateNodeRight(node.left)
      } else if (rightChildPriority < node.priority) {
        this.rotateNodeLeft(node.right)
      } else {
        break
      }
    }
  }

  rotateNodeLeft (pivot) {
    let root = pivot.parent

    if (root.parent) {
      if (root === root.parent.left) {
        root.parent.left = pivot
      } else {
        root.parent.right = pivot
      }
    } else {
      this.root = pivot
    }
    pivot.parent = root.parent

    root.right = pivot.left
    if (root.right) {
      root.right.parent = root
    }

    pivot.left = root
    pivot.left.parent = pivot

    root.computeSubtreeProperties()
    pivot.computeSubtreeProperties()
  }

  rotateNodeRight (pivot) {
    let root = pivot.parent

    if (root.parent) {
      if (root === root.parent.left) {
        root.parent.left = pivot
      } else {
        root.parent.right = pivot
      }
    } else {
      this.root = pivot
    }
    pivot.parent = root.parent

    root.left = pivot.right
    if (root.left) {
      root.left.parent = root
    }

    pivot.right = root
    pivot.right.parent = pivot

    root.computeSubtreeProperties()
    pivot.computeSubtreeProperties()
  }

  buildScreenLinesTree (screenLines, start = 0, end = screenLines.length, parentPriority = 0) {
    if (start === end) return

    let priority = this.generateRandom(parentPriority)
    let middle = Math.floor((start + end) / 2)
    let left = this.buildScreenLinesTree(screenLines, start, middle, priority)
    let right = this.buildScreenLinesTree(screenLines, middle + 1, end, priority)
    let node = new LineNode(screenLines[middle], left, right, priority)
    if (left) left.parent = node
    if (right) right.parent = node

    return node
  }

  generateRandom (floor = 0) {
    return this.randomGenerator.floatBetween(floor, 1)
  }
}
