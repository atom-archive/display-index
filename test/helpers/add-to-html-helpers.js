import ScreenLineIndex from '../../src/screen-line-index'
import LineNode from '../../src/line-node'
import {traverse, formatPoint, ZERO_POINT} from '../../src/point-helpers'

ScreenLineIndex.prototype.toHTML = function () {
  if (this.root) {
    return this.root.toHTML()
  } else {
    return ''
  }
}

LineNode.prototype.toHTML = function (leftAncestorRow = -1, leftAncestorBufferEnd = ZERO_POINT) {
  let s = '<style>'
  s += 'table { width: 100%; }'
  s += 'td { width: 50%; text-align: center; border: 1px solid gray; white-space: nowrap; }'
  s += '</style>'

  s += '<table>'

  s += '<tr>'
  let screenRow = leftAncestorRow + this.getLeftSubtreeRowCount() + 1
  let lineBufferStart = traverse(leftAncestorBufferEnd, this.getLeftSubtreeBufferExtent())
  let lineBufferEnd = traverse(lineBufferStart, this.bufferExtent)
  s += '<td colspan="2">'
  s += '<dl>'
  s += `<div>Screen Row: ${screenRow}</div>`
  s += `<div>Line Buffer Start: ${formatPoint(lineBufferStart)}</div>`
  s += `<div>Line Buffer End: ${formatPoint(lineBufferEnd)}</div>`
  s += `<div>Subtree Row Count: ${this.subtreeRowCount}</div>`
  s += `<div>Subtree Buffer Extent: ${formatPoint(this.subtreeBufferExtent)}</div>`
  s += `<div>Max Screen Extent: ${this.maxScreenExtent}</div>`
  s += `<div>Screen Extent: ${this.screenExtent}</div>`
  s += `<div>Buffer Extent: ${formatPoint(this.bufferExtent)}</div>`
  s += `<div>Id: ${this.id}</div>`
  s += `<div>Priority: ${this.priority}</div>`
  s += '</dl>'
  s += '</td>'
  s += '</tr>'

  if (this.left || this.right) {
    s += '<tr>'
    s += '<td>'
    if (this.left) {
      s += this.left.toHTML(leftAncestorRow, leftAncestorBufferEnd)
    } else {
      s += '&nbsp;'
    }
    s += '</td>'
    s += '<td>'
    if (this.right) {
      s += this.right.toHTML(screenRow, lineBufferEnd)
    } else {
      s += '&nbsp;'
    }
    s += '</td>'
    s += '</tr>'
  }

  s += '</table>'

  return s
}
