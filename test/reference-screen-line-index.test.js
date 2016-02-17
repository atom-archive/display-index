import ReferenceScreenLineIndex from './reference-screen-line-index'

describe('ReferenceScreenLineIndex', () => {
  it('seeks to the leftmost token containing a given screen position', () => {
    let screenLineIndex = buildScreenLineIndex()
    let iterator = screenLineIndex.buildTokenIterator()

    assert(iterator.seekToScreenPosition(point(0, 0)))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    assert(iterator.seekToScreenPosition(point(0, 6)))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    assert(iterator.seekToScreenPosition(point(1, 2)))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')

    assert(iterator.seekToScreenPosition(point(2, 2)))
    assertIteratorState(iterator, point(2, 0), point(2, 5), point(3, 10), point(3, 10), 'f')

    assert(iterator.seekToScreenPosition(point(2, 15)))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
  })

  it('seeks to the closest token to an invalid screen position', () => {
    let screenLineIndex = buildScreenLineIndex()
    let iterator = screenLineIndex.buildTokenIterator()

    assert(!iterator.seekToScreenPosition(point(3, 2)))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    assert(!iterator.seekToScreenPosition(point(-1, 2)))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    assert(!iterator.seekToScreenPosition(point(1, -2)))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')
  })

  it('seeks to the leftmost token containing a given buffer position', () => {
    let screenLineIndex = buildScreenLineIndex()
    let iterator = screenLineIndex.buildTokenIterator()

    assert(iterator.seekToBufferPosition(point(0, 0)))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    assert(iterator.seekToBufferPosition(point(0, 6)))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    assert(iterator.seekToBufferPosition(point(1, 1)))
    assertIteratorState(iterator, point(0, 5), point(0, 6), point(0, 5), point(2, 5), 'b')

    assert(iterator.seekToBufferPosition(point(2, 7)))
    assertIteratorState(iterator, point(0, 6), point(0, 11), point(2, 5), point(2, 10), 'c')

    assert(iterator.seekToBufferPosition(point(3, 11)))
    assertIteratorState(iterator, point(2, 5), point(2, 10), point(3, 10), point(3, 15), 'g')

    assert(iterator.seekToBufferPosition(point(3, 20)))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')

    assert(iterator.seekToBufferPosition(point(3, 20)))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
  })

  it('seeks to the closest token to an invalid buffer position', () => {
    let screenLineIndex = buildScreenLineIndex()
    let iterator = screenLineIndex.buildTokenIterator()

    assert(!iterator.seekToBufferPosition(point(4, 2)))
    assertIteratorState(iterator, point(2, 10), point(2, 15), point(3, 15), point(3, 20), 'h')
    return

    assert(!iterator.seekToBufferPosition(point(-1, 2)))
    assertIteratorState(iterator, point(0, 0), point(0, 5), point(0, 0), point(0, 5), 'a')

    assert(!iterator.seekToBufferPosition(point(1, -2)))
    assertIteratorState(iterator, point(1, 0), point(1, 5), point(3, 0), point(3, 5), 'd')
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

function buildScreenLineIndex () {
  let screenLineIndex = new ReferenceScreenLineIndex()

  screenLineIndex.splice(0, 0, [
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

  return screenLineIndex
}
