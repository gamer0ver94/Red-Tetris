import { useMemo, useState } from 'react';
import './HistorySection.css';
import HistoryCard from "./HistoryCard"
export default function HistorySection() {
  const [who, setWho] = useState<'me' | 'all'>('me');
  const [searchName, setSearchName] = useState('');

  const cards = useMemo(
    () => [
      {
        key: 'me',
        who: 'me' as const,
        title: 'My Matches',
        list: 'score' as const,
      },
      {
        key: 'all',
        who: 'all' as const,
        title: 'Most Recent (All Matches)',
        list: 'date' as const,
      },
    ],
    []
  );

  const active = who === 'me' ? cards[0] : cards[1];

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
              onClick={() => setWho('all')}
              type="button"
            >
              All Histories
            </button>
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
        scope={active.who} 
        list={active.list} 
        title={active.title} 
        start={0} 
        end={10}
        username={searchName || undefined}
      />
    </div>
  );
}

