import {compare, traverse} from '../src/point-helpers'

export default class ReferenceScreenLineIndex {
  constructor () {
    this.screenLines = []
  }

  splice (startRow, rowCount, screenLines) {
    this.screenLines.splice(startRow, rowCount, ...screenLines)
  }

  buildIterator () {
    return new ReferenceTokenIterator(this.screenLines)
  }
}

class ReferenceTokenIterator {
  constructor (screenLines) {
    this.screenLines = screenLines
  }

  seekToScreenPosition (targetPosition) {
    if (targetPosition.row < 0) {
      targetPosition = {row: 0, column: 0}
    }
    if (targetPosition.column < 0) {
      targetPosition = {row: targetPosition.row, column: 0}
    }
    if (targetPosition.row > this.getLastScreenRow()) {
      targetPosition = {row: this.getLastScreenRow(), column: Infinity}
    }

    this.bufferStart = {row: 0, column: 0}

    // find containing screen line
    for (let screenRow = 0; screenRow < this.screenLines.length; screenRow++) {
      this.screenLine = this.screenLines[screenRow]
      if (screenRow === targetPosition.row) break
      this.bufferStart = traverse(this.bufferStart, this.screenLine.bufferExtent)
    }

    // find containing token
    this.screenStart = {row: targetPosition.row, column: 0}
    for (this.tokenIndex = 0; this.tokenIndex < this.screenLine.tokens.length; this.tokenIndex++) {
      let token = this.screenLine.tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      let tokenContainsTarget =
        compare(this.screenStart, targetPosition) <= 0
          && compare(targetPosition, this.screenEnd) < 0

      if (tokenContainsTarget) return true

      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
    }

    return false
  }

  getMetadata () {
    let token = this.screenLine.tokens[this.tokenIndex]
    return token ? token.metadata : null
  }

  getScreenStart () {
    return this.screenStart
  }

  getScreenEnd () {
    return this.screenEnd
  }

  getBufferStart () {
    return this.bufferStart
  }

  getBufferEnd () {
    return this.bufferEnd
  }

  getLastScreenRow () {
    return this.screenLines.length - 1
  }
}
