import {compare, traverse, minPoint} from '../src/point-helpers'

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

  lineLengthForScreenRow (screenRow) {
    return this.screenLines[screenRow].screenExtent
  }

  getMaxScreenLineLength () {
    let maxScreenLineLength = -1
    for (let screenLine of this.screenLines) {
      maxScreenLineLength = Math.max(maxScreenLineLength, screenLine.screenExtent)
    }
    return maxScreenLineLength
  }

  getScreenRowsWithMaxLineLength () {
    let maxScreenLineLength = -1
    let screenRows = []
    for (let screenRow = 0; screenRow < this.screenLines.length; screenRow++) {
      let screenLine = this.screenLines[screenRow]
      if (screenLine.screenExtent > maxScreenLineLength) {
        maxScreenLineLength = screenLine.screenExtent
        screenRows = []
      }
      if (screenLine.screenExtent === maxScreenLineLength) {
        screenRows.push(screenRow)
      }
    }
    return screenRows
  }
}

class ReferenceTokenIterator {
  constructor (screenLineIndex) {
    this.screenLineIndex = screenLineIndex
    this.lineIterator = new ReferenceLineIterator(screenLineIndex)
  }

  seekToScreenPosition (targetPosition) {
    let clippedTargetPosition = targetPosition

    if (targetPosition.row < 0) {
      clippedTargetPosition = {row: 0, column: 0}
    }
    if (targetPosition.column < 0) {
      clippedTargetPosition = {row: targetPosition.row, column: 0}
    }
    if (targetPosition.row > this.getLastScreenRow()) {
      clippedTargetPosition = {row: this.getLastScreenRow(), column: Infinity}
    }

    this.lineIterator.seekToScreenRow(clippedTargetPosition.row)

    clippedTargetPosition = minPoint(clippedTargetPosition, this.lineIterator.getScreenEnd())

    this.screenStart = this.lineIterator.getScreenStart()
    this.bufferStart = this.lineIterator.getBufferStart()

    let tokens = this.lineIterator.getTokens()
    for (this.tokenIndex = 0; this.tokenIndex < tokens.length; this.tokenIndex++) {
      let token = tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      if (this.containsScreenPosition(clippedTargetPosition)) break

      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
    }

    return this.containsScreenPosition(targetPosition)
  }

  seekToBufferPosition (targetPosition) {
    let clippedTargetPosition = targetPosition

    if (targetPosition.row < 0) {
      clippedTargetPosition = {row: 0, column: 0}
    }
    if (targetPosition.column < 0) {
      clippedTargetPosition = {row: targetPosition.row, column: 0}
    }
    if (targetPosition.row > this.getLastBufferRow()) {
      clippedTargetPosition = {row: this.getLastBufferRow(), column: Infinity}
    }

    this.lineIterator.seekToBufferPosition(clippedTargetPosition)

    this.screenStart = this.lineIterator.getScreenStart()
    this.bufferStart = this.lineIterator.getBufferStart()

    let tokens = this.lineIterator.getTokens()
    for (this.tokenIndex = 0; this.tokenIndex < tokens.length; this.tokenIndex++) {
      let token = tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      if (this.containsBufferPosition(clippedTargetPosition)) break
      if (this.tokenIndex === tokens.length - 1) break

      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
    }

    return this.containsBufferPosition(targetPosition)
  }

  moveToSuccessor () {
    this.screenStart = this.screenEnd
    this.bufferStart = this.bufferEnd
    this.tokenIndex++

    let token = this.getCurrentToken()
    while (!token) {
      if (this.lineIterator.moveToSuccessor()) {
        this.screenStart = this.lineIterator.getScreenStart()
        this.bufferStart = this.lineIterator.getBufferStart()
        this.tokenIndex = 0
        token = this.getCurrentToken()
      } else {
        return false
      }
    }

    this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
    this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)
    return true
  }

  getMetadata () {
    let token = this.getCurrentToken()
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

  getCurrentToken () {
    let tokens = this.lineIterator.getTokens()
    return tokens ? tokens[this.tokenIndex] : null
  }

  containsScreenPosition (screenPosition) {
    return compare(this.screenStart, screenPosition) <= 0
      && compare(screenPosition, this.screenEnd) <= 0
  }

  containsBufferPosition (bufferPosition) {
    return compare(this.bufferStart, bufferPosition) <= 0
      && compare(bufferPosition, this.bufferEnd) <= 0
  }

  getLastScreenRow () {
    return this.screenLineIndex.getLastScreenRow()
  }

  getLastBufferRow () {
    return this.screenLineIndex.getLastBufferRow()
  }
}

class ReferenceLineIterator {
  constructor (screenLineIndex) {
    this.screenLineIndex = screenLineIndex
  }

  seekToScreenRow (targetRow) {
    this.bufferStart = {row: 0, column: 0}

    let screenLineCount = this.screenLineIndex.screenLines.length
    for (this.currentScreenRow = 0; this.currentScreenRow < screenLineCount; this.currentScreenRow++) {
      this.bufferEnd = traverse(this.bufferStart, this.getCurrentScreenLine().bufferExtent)
      if (this.currentScreenRow === targetRow) break
      this.bufferStart = this.bufferEnd
    }
  }

  seekToBufferPosition (targetPosition) {
    this.bufferStart = {row: 0, column: 0}

    let screenLineCount = this.screenLineIndex.screenLines.length
    for (this.currentScreenRow = 0; this.currentScreenRow < screenLineCount; this.currentScreenRow++) {
      this.bufferEnd = traverse(this.bufferStart, this.getCurrentScreenLine().bufferExtent)
      if (this.containsBufferPosition(targetPosition)) break
      if (this.currentScreenRow === screenLineCount - 1) break
      this.bufferStart = this.bufferEnd
    }
  }

  moveToSuccessor () {
    this.bufferStart = this.bufferEnd
    this.currentScreenRow++
    let screenLine = this.getCurrentScreenLine()
    if (!screenLine) return false
    this.bufferEnd = traverse(this.bufferStart, screenLine.bufferExtent)
    return true
  }

  getScreenStart () {
    return {row: this.currentScreenRow, column: 0}
  }

  getScreenEnd () {
    return {row: this.currentScreenRow, column: this.getCurrentScreenLine().screenExtent}
  }

  getBufferStart () {
    return this.bufferStart
  }

  getBufferEnd () {
    return this.bufferEnd
  }

  getTokens () {
    let screenLine = this.getCurrentScreenLine()
    return screenLine ? screenLine.tokens : null
  }

  containsBufferPosition (bufferPosition) {
    return compare(this.bufferStart, bufferPosition) <= 0
      && compare(bufferPosition, this.bufferEnd) <= 0
  }

  getCurrentScreenLine () {
    return this.screenLineIndex.screenLines[this.currentScreenRow]
  }
}
