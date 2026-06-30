import reducer, { setBoard, setGameId } from './gameSlice'

describe('gameSlice', () => {
  it('sets board', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, setBoard([[".", "X"]] as any))
    expect(next.board).toEqual([[".", "X"]])
  })

  it('sets gameId', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, setGameId('game-1'))
    expect(next.gameId).toBe('game-1')
  })

  it('clears gameId when set to null', () => {
    const initial = reducer(undefined, { type: 'unknown' })
    const next = reducer(initial, setGameId(null))
    expect(next.gameId).toBeNull()
  })
})



