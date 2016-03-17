import ReferenceDisplayIndex from './reference-display-index'

describe('ReferenceDisplayIndex iterator', () => {
  it('seeks to the leftmost token containing a given screen position', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToScreenPosition(point(0, 0))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    iterator.seekToScreenPosition(point(0, 5))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    iterator.seekToScreenPosition(point(0, 6))
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    iterator.seekToScreenPosition(point(1, 2))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')

    iterator.seekToScreenPosition(point(2, 2))
    assertIteratorState(iterator, point(2, 0), point(2, 5), point(3, 10), point(3, 10), 'f')

    iterator.seekToScreenPosition(point(2, 15))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
  })

  it('seeks to the closest token to an invalid screen position', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToScreenPosition(point(3, 2))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    iterator.seekToScreenPosition(point(-1, 2))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    iterator.seekToScreenPosition(point(1, -2))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')
  })

  it('seeks to the leftmost token containing a given buffer position', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(0, 0))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    iterator.seekToBufferPosition(point(0, 6))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    iterator.seekToBufferPosition(point(1, 1))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    iterator.seekToBufferPosition(point(2, 6))
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    iterator.seekToBufferPosition(point(2, 7))
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    iterator.seekToBufferPosition(point(3, 0))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')

    iterator.seekToBufferPosition(point(3, 10))
    assertIteratorState(iterator, point(2, 0), point(2, 5), point(3, 10), point(3, 10), 'f')

    iterator.seekToBufferPosition(point(3, 11))
    assertIteratorState(iterator, point(2, 5), point(2, 10), point(3, 10), point(3, 15), 'g')

    iterator.seekToBufferPosition(point(3, 20))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    iterator.seekToBufferPosition(point(3, 20))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
  })

  it('seeks to the closest token to an invalid buffer position', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(4, 2))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    iterator.seekToBufferPosition(point(-1, 2))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    iterator.seekToBufferPosition(point(1, -2))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')
  })

  it('iterates forward and backward through tokens', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(0, 0))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    iterator.moveToSuccessor()
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    iterator.moveToSuccessor()
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    iterator.moveToSuccessor()
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')

    iterator.moveToSuccessor()
    assertIteratorState(iterator, point(1, 5), point(1, 10), point(3, 5), point(3, 10), 'e')

    iterator.moveToPredecessor()
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')

    iterator.moveToPredecessor()
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    iterator.moveToPredecessor()
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    iterator.moveToPredecessor()
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')
  })

  it('returns false and remains on the last token if attempting to iterate off the end of the last line', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(3, 15))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    assert(!iterator.moveToSuccessor())
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
  })

  it('returns false and remains on the first token if attempting to iterate off the beginning of the first line', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(0, 0))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    assert(!iterator.moveToPredecessor())
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')
  })

  it('ensures that translated positions are contained within the current token', () => {
    let displayIndex = buildDisplayIndex()
    let iterator = displayIndex.buildTokenIterator()

    iterator.seekToBufferPosition(point(3, 15))

    assert.deepEqual(iterator.translateBufferPosition(point(3, 16)), point(2, 11))
    assert.deepEqual(iterator.translateScreenPosition(point(2, 11)), point(3, 16))

    assert.deepEqual(iterator.translateBufferPosition(point(3, 21)), point(2, 15))
    assert.deepEqual(iterator.translateScreenPosition(point(2, 16)), point(3, 20))

    assert.throws(() => iterator.translateBufferPosition(point(3, 14)))
    assert.throws(() => iterator.translateScreenPosition(point(2, 9)))
  })
})

function point(row, column) {
  return {row, column}
}

function assertIteratorState (iterator, screenStart, screenEnd, bufferStart, bufferEnd, metadata) {
  assert.deepEqual(iterator.getScreenStart(), screenStart)
  assert.deepEqual(iterator.getScreenEnd(), screenEnd)
  assert.deepEqual(iterator.getBufferStart(), bufferStart)
  assert.deepEqual(iterator.getBufferEnd(), bufferEnd)
  assert.equal(iterator.getMetadata(), metadata)
}

function buildDisplayIndex () {
  let displayIndex = new ReferenceDisplayIndex()

  displayIndex.splice(0, 0, [
    {
      screenExtent: 11,
      bufferExtent: point(3, 0),
      tokens: [
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'a'},
        {screenExtent: 1, bufferExtent: point(2, 5), metadata: 'b'}, // fold
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'c'}
      ]
    },
    {
      screenExtent: 10,
      bufferExtent: point(0, 10), // soft wrap
      tokens: [
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'd'},
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'e'}
      ]
    },
    { // soft wrap continuation
      screenExtent: 15,
      bufferExtent: point(0, 10), // last line of buffer
      tokens: [
        {screenExtent: 5, bufferExtent: point(0, 0), metadata: 'f'}, // hanging indent
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'g'},
        {screenExtent: 5, bufferExtent: point(0, 5), metadata: 'h'}
      ]
    }
  ])

  return displayIndex
}
