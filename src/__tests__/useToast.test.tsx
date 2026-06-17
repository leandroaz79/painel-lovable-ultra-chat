import { renderHook, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../hooks/useToast'
import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.useRealTimers()
})

describe('useToast', () => {
  it('should throw error when used without ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within a ToastProvider'
    )
  })

  it('should add a toast when showToast is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })

    act(() => {
      result.current.showToast('Test message')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Test message')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('should add an error type toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })

    act(() => {
      result.current.showToast('Error!', 'error')
    })

    expect(result.current.toasts[0].type).toBe('error')
  })

  it('should remove toast when removeToast is called', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })

    act(() => {
      result.current.showToast('Remove me')
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.removeToast(result.current.toasts[0].id)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('should auto-remove toast after timeout', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })

    act(() => {
      result.current.showToast('Auto remove')
    })
    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(3700)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper: ToastProvider })

    act(() => {
      result.current.showToast('First')
      result.current.showToast('Second')
      result.current.showToast('Third')
    })

    expect(result.current.toasts).toHaveLength(3)
    expect(result.current.toasts[0].message).toBe('First')
    expect(result.current.toasts[2].message).toBe('Third')
  })
})
