import LineIterator from './line-iterator'
import {compare, isZero, minPoint, traverse, traversalDistance, formatPoint, ZERO_POINT} from './point-helpers'

const ZERO_TOKEN = Object.freeze({
  screenStartOffset: 0,
  screenEndOffset: 0,
  bufferStartOffset: ZERO_POINT,
  bufferEndOffset: ZERO_POINT
})

export default class TokenIterator {
  constructor (screenLineIndex) {
    this.screenLineIndex = screenLineIndex
    this.lineIterator = new LineIterator(screenLineIndex)
    this.clearCachedPositions()
  }

  seekToScreenPosition (targetPosition) {
    this.clearCachedPositions()

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

    this.lineIterator.seekToScreenRow(clippedTargetPosition.row)

    let tokens = this.lineIterator.getTokens()

    if (!tokens) {
      return false
    }

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
          break
        } else {
          startIndex = this.tokenIndex + 1
        }
      }
    }

    // if at start of a token, rewind in case there are empty tokens before it
    while (targetColumn === token.screenStartOffset && this.tokenIndex > 0) {
      this.tokenIndex--
      token = tokens[this.tokenIndex]
    }

    // if at the end of a token, advance to beginning of next token unless
    // current token is empty
    if (targetColumn === token.screenEndOffset &&
        token.screenExtent > 0 &&
        this.tokenIndex < tokens.length - 1) {
      this.moveToSuccessor()
    }
  }

  seekToBufferPosition (targetPosition) {
    this.clearCachedPositions()

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

    if (!tokens) {
      return false
    }

    let targetOffsetInLine = traversalDistance(clippedTargetPosition, this.lineIterator.getBufferStart())
    let startIndex = 0
    let endIndex = tokens.length
    let token

    while (startIndex < endIndex) {
      this.tokenIndex = Math.floor((startIndex + endIndex) / 2)
      token = tokens[this.tokenIndex]

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

    // if at start of a token, rewind in case there are empty tokens before it
    while (compare(targetOffsetInLine, token.bufferStartOffset) === 0 && this.tokenIndex > 0) {
      this.tokenIndex--
      token = tokens[this.tokenIndex]
    }

    // if at the end of a token, advance to beginning of next token unless
    // current token is empty
    if (compare(targetOffsetInLine, token.bufferEndOffset) === 0 &&
        !isZero(token.bufferExtent) &&
        this.tokenIndex < tokens.length - 1) {
      this.moveToSuccessor()
    }
  }

  moveToSuccessor () {
    this.clearCachedPositions()

    this.tokenIndex++
    while (this.tokenIndex === this.lineIterator.getTokens().length) {
      if (this.lineIterator.moveToSuccessor()) {
        this.tokenIndex = 0
      } else {
        this.tokenIndex = this.lineIterator.getTokens().length - 1
        return false
      }
    }
    return true
  }

  getScreenStart () {
    if (this.screenStart) return this.screenStart

    let row = this.lineIterator.getScreenRow()
    let column = this.getCurrentToken().screenStartOffset
    this.screenStart = {row, column}

    return this.screenStart
  }

  getScreenEnd () {
    if (this.screenEnd) return this.screenEnd

    let row = this.lineIterator.getScreenRow()
    let column = this.getCurrentToken().screenEndOffset
    this.screenEnd = {row, column}

    return this.screenEnd
  }

  getScreenExtent () {
    return this.getCurrentToken().screenExtent
  }

  getBufferStart () {
    if (this.bufferStart) return this.bufferStart

    let lineStart = this.lineIterator.getBufferStart()
    let tokenStartOffset = this.getCurrentToken().bufferStartOffset
    this.bufferStart = traverse(lineStart, tokenStartOffset)

    return this.bufferStart
  }

  getBufferEnd () {
    if (this.bufferEnd) return this.bufferEnd

    let lineStart = this.lineIterator.getBufferStart()
    let tokenStartOffset = this.getCurrentToken().bufferEndOffset
    this.bufferEnd = traverse(lineStart, tokenStartOffset)

    return this.bufferEnd
  }

  getBufferExtent () {
    return this.getCurrentToken().bufferExtent
  }

  getMetadata () {
    return this.getCurrentToken().metadata
  }

  translateBufferPosition (bufferPosition) {
    if (compare(bufferPosition, this.getBufferStart()) < 0) {
      throw new Error(`Position ${formatPoint(bufferPosition)} is less than the current token's start (${formatPoint(this.getBufferStart())})`)
    }

    return traverse(this.getScreenStart(), traversalDistance(bufferPosition, this.getBufferStart()))
  }

  translateScreenPosition (screenPosition) {
    if (compare(screenPosition, this.getScreenStart()) < 0) {
      throw new Error(`Position ${formatPoint(screenPosition)} is less than the current token's start (${formatPoint(this.getScreenStart())})`)
    }

    return traverse(this.getBufferStart(), traversalDistance(screenPosition, this.getScreenStart()))
  }

  getCurrentToken () {
    let tokens = this.lineIterator.getTokens()
    if (tokens && tokens.length > 0) {
      return this.lineIterator.getTokens()[this.tokenIndex]
    } else {
      return ZERO_TOKEN
    }
  }

  clearCachedPositions () {
    this.screenStart = null
    this.screenEnd = null
    this.bufferStart = null
    this.bufferEnd = null
  }
}
