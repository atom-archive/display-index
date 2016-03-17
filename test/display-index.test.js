import Random from 'random-seed'
import ReferenceDisplayIndex from './reference-display-index'
import DisplayIndex from '../src/display-index'
import {traverse} from '../src/point-helpers'
import './helpers/add-to-html-helpers'

describe('DisplayIndex', () => {
  it('behaves identically to a linear reference implementation under random mutations and queries', function () {
    this.timeout(Infinity)

    let tokenCount

    for (let i = 0; i < 100; i++) {
      let seed = Date.now()
      let random = new Random(seed)
      tokenCount = 0

      let referenceIndex = new ReferenceDisplayIndex()
      let realIndex = new DisplayIndex(seed)

      try {
        for (var j = 0; j < 3; j++) {
          let preSpliceIds = getLineIds(realIndex)
          let removedIds = performRandomSplice(random, realIndex, referenceIndex)
          let postSpliceIds = getLineIds(realIndex)
          assert.deepEqual(removedIds, Array.from(subtractSets(preSpliceIds, postSpliceIds)))
          verify(random, realIndex, referenceIndex)
        }
      } catch (exception) {
        exception.message += ` (Random seed: ${seed})`
        throw exception
      }
    }

    function getLineIds (index) {
      let ids = new Set
      let iterator = index.buildScreenLineIterator()
      if (iterator.seekToScreenRow(0)) {
        do {
          ids.add(iterator.getId())
        } while (iterator.moveToSuccessor())
      }
      return ids
    }

    function subtractSets (a, b) {
      let result = new Set(a)
      b.forEach(x => result.delete(x))
      return result
    }

    function verify (random, realIndex, referenceIndex) {
      let realIterator = realIndex.buildTokenIterator()
      let referenceIterator = referenceIndex.buildTokenIterator()

      // test seeking to random points, moving to successor
      for (let i = 0; i < 10; i++) {
        let screenRow = random.intBetween(0, referenceIndex.getScreenLineCount() - 1)
        let screenColumn = random.intBetween(0, referenceIndex.lineLengthForScreenRow(screenRow))

        referenceIterator.seekToScreenPosition(point(screenRow, screenColumn))
        realIterator.seekToScreenPosition(point(screenRow, screenColumn))
        assertEqualIterators(realIterator, referenceIterator)

        let bufferStart = referenceIterator.getBufferStart()
        referenceIterator.seekToBufferPosition(bufferStart)
        realIterator.seekToBufferPosition(bufferStart)
        assertEqualIterators(realIterator, referenceIterator)

        verifyPointTranslation(random, realIterator, referenceIterator, referenceIndex)

        let j = 10
        while (referenceIterator.moveToSuccessor() && --j > 0) {
          assert(realIterator.moveToSuccessor())
          assertEqualIterators(realIterator, referenceIterator)
        }

        if (j > 0) {
          assert(!realIterator.moveToSuccessor())
          assertEqualIterators(realIterator, referenceIterator)
        }

        let k = 0
        while (referenceIterator.moveToPredecessor() && --k > 10) {
          assert(realIterator.moveToPredecessor())
          assertEqualIterators(realIterator, referenceIterator)
        }

        if (k > 10) {
          assert(!realIterator.moveToPredecessor())
          assertEqualIterators(realIterator, referenceIterator)
        }
      }

      // verify longest screen line summarization
      let maxScreenLineLength = referenceIndex.getMaxScreenLineLength()
      let longestScreenRows = referenceIndex.getScreenRowsWithMaxLineLength()
      let maxScreenPosition = realIndex.getScreenPositionWithMaxLineLength()

      assert.equal(maxScreenPosition.column, maxScreenLineLength, 'Invalid longest screen column')
      assert(longestScreenRows.indexOf(maxScreenPosition.row) !== -1, `Invalid longest screen row ${maxScreenPosition.row}`)
    }

    function assertEqualIterators (realIterator, referenceIterator) {
      assert.deepEqual(realIterator.getScreenStart(), referenceIterator.getScreenStart(), 'Invalid screen start')
      assert.deepEqual(realIterator.getScreenEnd(), referenceIterator.getScreenEnd(), 'Invalid screen end')
      assert.deepEqual(realIterator.getBufferStart(), referenceIterator.getBufferStart(), 'Invalid buffer start')
      assert.deepEqual(realIterator.getBufferEnd(), referenceIterator.getBufferEnd(), 'Invalid buffer end')
      assert.deepEqual(realIterator.getMetadata(), referenceIterator.getMetadata(), 'Invalid metadata')
    }

    function verifyPointTranslation (random, realIterator, referenceIterator, referenceIndex) {
      let screenRow = random.intBetween(-1, referenceIndex.getScreenLineCount() + 1)
      let screenColumn = random.intBetween(-1, (referenceIndex.lineLengthForScreenRow(screenRow) || 0) + 1)
      let screenPosition = point(screenRow, screenColumn)

      let expectedBufferPosition
      try {
        expectedBufferPosition = referenceIndex.translateScreenPosition(screenPosition)
      } catch (exception) {}

      if (expectedBufferPosition) {
        assert.deepEqual(realIndex.translateScreenPosition(screenPosition), expectedBufferPosition)
      } else {
        assert.throws(() => realIndex.translateScreenPosition(screenPosition))
      }

      let bufferRow = random.intBetween(-1, referenceIndex.getLastBufferRow() + 1)
      let bufferColumn = random.intBetween(-1, 100)
      let bufferPosition = point(bufferRow, bufferColumn)

      let expectedScreenPosition
      try {
        expectedScreenPosition = referenceIndex.translateBufferPosition(bufferPosition)
      } catch (exception) {}

      if (expectedScreenPosition) {
        assert.deepEqual(realIndex.translateBufferPosition(bufferPosition), expectedScreenPosition)
      } else {
        assert.throws(() => realIndex.translateBufferPosition(bufferPosition))
      }
    }

    function performRandomSplice (random, realIndex, referenceIndex) {
      let startRow = random.intBetween(0, referenceIndex.getScreenLineCount())
      let replaceCount = random.intBetween(0, referenceIndex.getScreenLineCount() - startRow)
      let screenLines = buildRandomScreenLines(random)

      referenceIndex.splice(startRow, replaceCount, screenLines)
      return realIndex.splice(startRow, replaceCount, screenLines)
    }

    function buildRandomScreenLines (random) {
      let screenLines = [buildRandomScreenLine(random)]
      while (random(10) < 8) screenLines.push(buildRandomScreenLine(random))
      return screenLines
    }

    function buildRandomScreenLine (random) {
      let tokens = [buildRandomToken(random)]
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
