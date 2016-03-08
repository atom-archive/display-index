import {compare, traverse, traversalDistance, minPoint, isZero} from '../src/point-helpers'

export default class ReferenceScreenLineIndex {
  constructor () {
    this.screenLines = []
  }

  splice (startRow, rowCount, screenLines) {
    this.screenLines.splice(startRow, rowCount, ...screenLines)
  }

  buildTokenIterator () {
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

  getBufferLineCount () {
    return this.getLastBufferRow() + 1
  }

  lineLengthForScreenRow (screenRow) {
    let screenLine = this.screenLines[screenRow]
    return screenLine ? screenLine.screenExtent : null
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
    let token
    for (this.tokenIndex = 0; this.tokenIndex < tokens.length; this.tokenIndex++) {
      token = tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      if (this.containsScreenPosition(clippedTargetPosition)) break

      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
    }

    if (token.screenExtent > 0
        && compare(clippedTargetPosition, this.screenEnd) === 0
        && this.tokenIndex < tokens.length - 1) {
      this.moveToSuccessor()
    }
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
    let token
    for (this.tokenIndex = 0; this.tokenIndex < tokens.length; this.tokenIndex++) {
      token = tokens[this.tokenIndex]
      this.screenEnd = traverse(this.screenStart, {row: 0, column: token.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, token.bufferExtent)

      if (this.containsBufferPosition(clippedTargetPosition)) break
      if (this.tokenIndex === tokens.length - 1) break

      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
    }

    if (compare(clippedTargetPosition, this.bufferEnd) === 0
        && !isZero(token.bufferExtent)
        && this.tokenIndex < tokens.length - 1) {
      this.moveToSuccessor()
    }
  }

  moveToSuccessor () {
    let nextToken

    if (this.tokenIndex < this.lineIterator.getTokens().length - 1) {
      this.tokenIndex++
      this.screenStart = this.screenEnd
      this.bufferStart = this.bufferEnd
      nextToken = this.getCurrentToken()
    } else if (this.lineIterator.moveToSuccessor()) {
      this.tokenIndex = 0
      nextToken = this.getCurrentToken()
      this.screenStart = this.lineIterator.getScreenStart()
      this.bufferStart = this.lineIterator.getBufferStart()
    }

    if (nextToken) {
      this.screenEnd = traverse(this.screenStart, {row: 0, column: nextToken.screenExtent})
      this.bufferEnd = traverse(this.bufferStart, nextToken.bufferExtent)
      return true
    } else {
      return false
    }
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
    return tokens[this.tokenIndex]
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

  translateBufferPosition (bufferPosition) {
    if (compare(bufferPosition, this.getBufferStart()) < 0) {
      throw new Error(`Position ${formatPoint(bufferPosition)} is less than the current token's start (${formatPoint(this.getBufferStart())})`)
    }

    return minPoint(this.getScreenEnd(), traverse(this.getScreenStart(), traversalDistance(bufferPosition, this.getBufferStart())))
  }

  translateScreenPosition (screenPosition) {
    if (compare(screenPosition, this.getScreenStart()) < 0) {
      throw new Error(`Position ${formatPoint(screenPosition)} is less than the current token's start (${formatPoint(this.getScreenStart())})`)
    }

    return minPoint(this.getBufferEnd(), traverse(this.getBufferStart(), traversalDistance(screenPosition, this.getScreenStart())))
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

    if (compare(targetPosition, this.bufferEnd) === 0
        && !isZero(this.getCurrentScreenLine().bufferExtent)
        && this.currentScreenRow < screenLineCount - 1) {
      this.moveToSuccessor()
    }
  }

  moveToSuccessor () {
    if (this.currentScreenRow < this.screenLineIndex.getScreenLineCount() - 1) {
      this.currentScreenRow++
      let screenLine = this.getCurrentScreenLine()
      this.bufferStart = this.bufferEnd
      this.bufferEnd = traverse(this.bufferStart, screenLine.bufferExtent)
      return true
    } else {
      return false
    }
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
