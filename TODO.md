## TODO - Player score card on ScorePage

- [ ] Create new component `PlayerScoreCard.tsx` under `src/client/components/cards/playerscorecard/`
  - [ ] Fetch `/history/score` using existing `fetchData`
  - [ ] Sort entries by `score` desc
  - [ ] Determine record status: user score >= top score (tie counts)
  - [ ] Render card: finish score, rank comparison list, record/not-record label
- [x] Update `src/client/pages/ScorePage.tsx`
  - [x] Pass current user score into `PlayerScoreCard`
  - [x] Place card into the page layout
- [x] Add minimal CSS for the new card
- [ ] Run TypeScript build/lint/tests if scripts exist (build currently fails due to existing unused variables in other files, not this change)

