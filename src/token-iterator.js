import LineIterator from './line-iterator'
import {compare, minPoint, traverse, traversalDistance, ZERO_POINT} from './point-helpers'

export default class TokenIterator {
  constructor (screenLineIndex) {
    this.screenLineIndex = screenLineIndex
    this.lineIterator = new LineIterator(screenLineIndex)
  }

  seekToScreenPosition (targetPosition) {
    let clippedTargetPosition = targetPosition
    if (clippedTargetPosition.row < 0) {
      clippedTargetPosition = ZERO_POINT
    }
    if (clippedTargetPosition.column < 0) {
      clippedTargetPosition = {row: clippedTargetPosition.row, column: 0}
    }
    let lastScreenRow = this.screenLineIndex.getLastScreenRow()
    if (clippedTargetPosition.row > lastScreenRow) {
      clippedTargetPosition = {row: lastScreenRow, column: Infinity}
    }

    this.lineIterator.seekToScreenPosition(clippedTargetPosition)

    let tokens = this.lineIterator.getTokens()
    let targetColumn = clippedTargetPosition.column
    let startIndex = 0
    let endIndex = tokens.length
    let token

    while (startIndex < endIndex) {
      this.tokenIndex = Math.floor((startIndex + endIndex) / 2)
      token = tokens[this.tokenIndex]

      if (targetColumn <= token.screenStartOffset) {
        endIndex = this.tokenIndex
      } else {
        if (targetColumn <= token.screenEndOffset) {
          this.tokenIndex = this.tokenIndex
          return true
        } else {
          startIndex = this.tokenIndex + 1
        }
      }
    }
    return false
  }

  seekToBufferPosition (targetPosition) {
    let clippedTargetPosition = targetPosition
    if (clippedTargetPosition.row < 0) {
      clippedTargetPosition = ZERO_POINT
    }
    if (clippedTargetPosition.column < 0) {
      clippedTargetPosition = {row: clippedTargetPosition.row, column: 0}
    }

    this.lineIterator.seekToBufferPosition(clippedTargetPosition)

    clippedTargetPosition = minPoint(clippedTargetPosition, this.lineIterator.getBufferEnd())

    let tokens = this.lineIterator.getTokens()

    let targetOffsetInLine = traversalDistance(clippedTargetPosition, this.lineIterator.getBufferStart())
    let startIndex = 0
    let endIndex = tokens.length

    while (startIndex < endIndex) {
      this.tokenIndex = Math.floor((startIndex + endIndex) / 2)
      let token = tokens[this.tokenIndex]

      if (compare(targetOffsetInLine, token.bufferStartOffset) <= 0) {
        endIndex = this.tokenIndex
      } else {
        if (compare(targetOffsetInLine, token.bufferEndOffset) <= 0) {
          break
        } else {
          startIndex = this.tokenIndex + 1
        }
      }
    }

    while (this.tokenIndex > 0 && compare(targetOffsetInLine, this.getCurrentToken().bufferStartOffset) === 0) {
      this.tokenIndex--
    }
  }

  moveToSuccessor () {
    this.tokenIndex++
    while (this.tokenIndex === this.lineIterator.getTokens().length) {
      if (this.lineIterator.moveToSuccessor()) {
        this.tokenIndex = 0
      } else {
        return false
      }
    }
    return true
  }

  getScreenStart () {
    let row = this.lineIterator.getScreenRow()
    let column = this.getCurrentToken().screenStartOffset
    return {row, column}
  }

  getScreenEnd () {
    let row = this.lineIterator.getScreenRow()
    let column = this.getCurrentToken().screenEndOffset
    return {row, column}
  }

  getBufferStart () {
    let lineStart = this.lineIterator.getBufferStart()
    let tokenStartOffset = this.getCurrentToken().bufferStartOffset
    return traverse(lineStart, tokenStartOffset)
  }

  getBufferEnd () {
    let lineStart = this.lineIterator.getBufferStart()
    let tokenStartOffset = this.getCurrentToken().bufferEndOffset
    return traverse(lineStart, tokenStartOffset)
  }

  getMetadata () {
    return this.getCurrentToken().metadata
  }

  getCurrentToken () {
    return this.lineIterator.getTokens()[this.tokenIndex]
  }
}
