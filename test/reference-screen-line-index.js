import {compare, traverse} from '../src/point-helpers'

export default class ReferenceScreenLineIndex {
  constructor () {
    this.screenLines = []
  }

  splice (startRow, rowCount, screenLines) {
    this.screenLines.splice(startRow, rowCount, ...screenLines)
  }

  buildIterator () {
    return new ReferenceTokenIterator(this)
  }

  getLastScreenRow () {
    return this.getScreenLineCount() - 1
  }

  getScreenLineCount () {
    return this.screenLines.length
  }

  getLastBufferRow () {
    let bufferPosition = {row: 0, column: 0}

    for (let screenLine of this.screenLines) {
      bufferPosition = traverse(bufferPosition, screenLine.bufferExtent)
    }

    return bufferPosition.row
  }
}

class ReferenceTokenIterator {
  constructor (screenLineIndex) {
    this.screenLineIndex = screenLineIndex
    this.screenLines = screenLineIndex.screenLines
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

    this.screenStart = {row: targetPosition.row, column: 0}

    // find containing token
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

  seekToBufferPosition (targetPosition) {
    if (targetPosition.row < 0) {
      targetPosition = {row: 0, column: 0}
    }
    if (targetPosition.column < 0) {
      targetPosition = {row: targetPosition.row, column: 0}
    }

    let lastBufferRow = this.getLastBufferRow()
    if (targetPosition.row > lastBufferRow) {
      targetPosition = {row: lastBufferRow, column: Infinity}
    }

    // find containing screen line
    let lineBufferStart = {row: 0, column: 0}
    let screenRow = 0
    while (true) {
      this.screenLine = this.screenLines[screenRow]

      let lineBufferEnd = traverse(lineBufferStart, this.screenLine.bufferExtent)
      let lineContainsTargetPosition =
        compare(lineBufferStart, targetPosition) <= 0
          && compare(targetPosition, lineBufferEnd) < 0

      if (lineContainsTargetPosition || screenRow === this.getLastScreenRow()) break

      lineBufferStart = lineBufferEnd
      screenRow++
    }

    this.screenStart = {row: screenRow, column: 0}
    this.bufferStart = lineBufferStart

    // find containing token
    for (this.tokenIndex = 0; this.tokenIndex < this.screenLine.tokens.length; this.tokenIndex++) {
      let token = this.screenLine.tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      let tokenContainsTarget =
        compare(this.bufferStart, targetPosition) <= 0
          && compare(targetPosition, this.bufferEnd) < 0

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
    return this.screenLineIndex.getLastScreenRow()
  }

  getLastBufferRow () {
    return this.screenLineIndex.getLastBufferRow()
  }
}
