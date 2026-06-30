import reducer, {
  clearLobbyReadyState,
  playerJoined,
  playerLeft,
  setPlayerReadyStatus,
  setReadyByUsername,
} from './lobbySlice'

describe('lobbySlice', () => {
  it('sets whole readyByUsername map', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(
      initial,
      setReadyByUsername({ alice: 'ready', bob: 'not-ready' })
    )
    expect(next.readyByUsername).toEqual({ alice: 'ready', bob: 'not-ready' })
  })

  it('sets player ready status', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(
      initial,
      setPlayerReadyStatus({ username: 'alice', status: 'ready' })
    )
    expect(next.readyByUsername.alice).toBe('ready')
  })

  it('playerJoined adds player with not-ready if missing', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, playerJoined({ username: 'alice' }))
    expect(next.readyByUsername.alice).toBe('not-ready')
  })

  it('playerJoined does nothing if player already exists', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const withReady = reducer(
      initial,
      setReadyByUsername({ alice: 'ready' })
    )
    const next = reducer(withReady, playerJoined({ username: 'alice' }))
    expect(next.readyByUsername.alice).toBe('ready')
  })

  it('playerLeft removes player', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const withPlayer = reducer(
      initial,
      setReadyByUsername({ alice: 'ready', bob: 'not-ready' })
    )
    const next = reducer(withPlayer, playerLeft({ username: 'alice' }))
    expect(next.readyByUsername).toEqual({ bob: 'not-ready' })
  })

  it('clearLobbyReadyState resets to empty object', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const withPlayers = reducer(
      initial,
      setReadyByUsername({ alice: 'ready' })
    )
    const next = reducer(withPlayers, clearLobbyReadyState())
    expect(next.readyByUsername).toEqual({})
  })
})



