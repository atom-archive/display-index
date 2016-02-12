import Random from 'random-seed'
import ReferenceScreenLineIndex from './reference-screen-line-index'
import {traverse} from '../src/point-helpers'

describe('ScreenLineIndex', () => {
  it('behaves identically to a linear reference implementation under random mutations and queries', () => {
    let tokenCount

    for (let i = 0; i < 1; i++) {
      let seed = Date.now()
      let seedMessage = `Random seed: ${seed}`
      let random = new Random(seed)
      tokenCount = 0

      let referenceIndex = new ReferenceScreenLineIndex()

      for (var j = 0; j < 3; j++) {
        performRandomSplice(random, null, referenceIndex)
      }
    }

    function performRandomSplice (random, realIndex, referenceIndex) {
      let startRow = random.intBetween(0, referenceIndex.getScreenLineCount())
      let replaceCount = random.intBetween(0, referenceIndex.getScreenLineCount() - startRow)
      let screenLines = buildRandomScreenLines(random)

      referenceIndex.splice(startRow, replaceCount, screenLines)
    }

    function buildRandomScreenLines (random) {
      let screenLines = []
      while (random(10) < 8) screenLines.push(buildRandomScreenLine(random))
      return screenLines
    }

    function buildRandomScreenLine (random) {
      let tokens = []
      while (random(10) < 9) tokens.push(buildRandomToken(random))

      let screenExtent = 0
      let bufferExtent = point(0, 0)

      for (let token of tokens) {
        screenExtent += token.screenExtent
        bufferExtent = traverse(bufferExtent, token.bufferExtent)
      }

      // some of the time, leave the buffer extent as if the line is
      // soft-wrapped, but most of the time traverse down another row.
      if (random(5) < 4) {
        bufferExtent = traverse(bufferExtent, point(1, 0))
      }

      return {screenExtent, bufferExtent, tokens}
    }

    function buildRandomToken (random) {
      return {
        screenExtent: random.intBetween(0, 20),
        bufferExtent: point(random.intBetween(0, 20), random.intBetween(0, 20)),
        metadata: ++tokenCount
      }
    }

    function point(row, column) {
      return {row, column}
    }
  })
})
