import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFloatingPosition } from './useFloatingPosition'

vi.mock('@floating-ui/dom', () => ({
  computePosition: vi.fn().mockResolvedValue({ x: 50, y: 100 }),
  autoUpdate: vi.fn((ref, float, update) => {
    update()
    return vi.fn()
  }),
  flip: vi.fn(() => ({ name: 'flip' })),
  shift: vi.fn(() => ({ name: 'shift' })),
  offset: vi.fn(() => ({ name: 'offset' })),
}))

function makeElement(rect: Partial<DOMRect> = {}) {
  const el = document.createElement('div')
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 300,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    }),
  })
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('useFloatingPosition', () => {
  it('returns display:none when isOpen is false', () => {
    const ref = makeElement()
    const float = makeElement()
    const { result } = renderHook(() => useFloatingPosition(ref, float, false))
    expect(result.current.display).toBe('none')
  })

  it('returns display:none when reference is null', () => {
    const float = makeElement()
    const { result } = renderHook(() => useFloatingPosition(null, float, true))
    expect(result.current.display).toBe('none')
  })

  it('returns display:none when floating is null', () => {
    const ref = makeElement()
    const { result } = renderHook(() => useFloatingPosition(ref, null, true))
    expect(result.current.display).toBe('none')
  })

  it('returns positioned style when open with both elements', async () => {
    const ref = makeElement({ width: 300 })
    const float = makeElement()
    const { result } = renderHook(() => useFloatingPosition(ref, float, true))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.position).toBe('fixed')
    expect(result.current.display).toBe('block')
    expect(result.current.left).toBe('50px')
    expect(result.current.top).toBe('100px')
    expect(result.current.width).toBe('300px')
  })

  it('sets width from reference getBoundingClientRect', async () => {
    const ref = makeElement({ width: 420 })
    const float = makeElement()
    const { result } = renderHook(() => useFloatingPosition(ref, float, true))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.width).toBe('420px')
  })

  it('returns to display:none when isOpen switches to false', async () => {
    const ref = makeElement()
    const float = makeElement()
    let isOpen = true
    const { result, rerender } = renderHook(() => useFloatingPosition(ref, float, isOpen))

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.display).toBe('block')

    isOpen = false
    rerender()
    expect(result.current.display).toBe('none')
  })
})
