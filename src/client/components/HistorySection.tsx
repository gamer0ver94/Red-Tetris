import { useMemo, useState } from 'react';
import './HistorySection.css';
import HistoryCard from "./HistoryCard"

type HistoryList = 'date' | 'score' | 'win' | 'lose';

const LIST_OPTIONS: { list: HistoryList; label: string; title: string }[] = [
  { list: 'date', label: 'Recent', title: 'Most Recent (All Matches)' },
  { list: 'score', label: 'Top Scores', title: 'Top Scores (All Matches)' },
  { list: 'win', label: 'Wins', title: 'Winning Matches' },
  { list: 'lose', label: 'Losses', title: 'Losing Matches' },
];

export default function HistorySection() {
  const [who, setWho] = useState<'me' | 'all'>('me');
  const [list, setList] = useState<HistoryList>('date');
  const [searchName, setSearchName] = useState('');

  const activeList = useMemo(
    () => LIST_OPTIONS.find((option) => option.list === list) ?? LIST_OPTIONS[0],
    [list],
  );

  const title = searchName
    ? `Matches for "${searchName}"`
    : who === 'me'
      ? 'My Matches'
      : activeList.title;

  return (
    <div className="history-session">
      <div className='history-session-inner'>
        <div>
          <h1 >Match History</h1>
        </div>
        <div className='history-controls'>
          <div className='history-buttons'>
            <button
              className={`history-unselected ${who === 'me' ? 'history-selected' : ''}`}
              onClick={() => setWho('me')}
              type="button"
            >
              My History
            </button>
            <button
              className={`history-unselected ${who === 'all' ? 'history-selected' : ''}`}
              onClick={() => {
                setWho('all');
                setList('date');
              }}
              type="button"
            >
              All Histories
            </button>
          </div>
          <div className='history-buttons'>
            {LIST_OPTIONS.map((option) => (
              <button
                key={option.list}
                className={`history-unselected ${who === 'all' && list === option.list ? 'history-selected' : ''}`}
                onClick={() => {
                  setWho('all');
                  setList(option.list);
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className='history-search-input'
            placeholder="Filter by player name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
        </div>
      </div>
      <HistoryCard 
        scope={who} 
        list={list} 
        title={title} 
        start={0} 
        end={10}
        username={searchName || undefined}
      />
    </div>
  );
}
