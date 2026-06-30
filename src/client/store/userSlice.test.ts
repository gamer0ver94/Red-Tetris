import reducer, { clearCsrfToken, clearUsername, setCsrfToken, setUsername } from './userSlice'

describe('userSlice', () => {
  it('sets username', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, setUsername('alice'))
    expect(next.username).toBe('alice')
  })

  it('clears username', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const withUser = reducer(initial, setUsername('alice'))
    const next = reducer(withUser, clearUsername())
    expect(next.username).toBeNull()
  })

  it('sets csrf token', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, setCsrfToken('abc123'))
    expect(next.csrf_token).toBe('abc123')
  })

  it('clears csrf token', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const withToken = reducer(initial, setCsrfToken('abc123'))
    const next = reducer(withToken, clearCsrfToken())
    expect(next.csrf_token).toBeNull()
  })
})

