import { getSelectedChildren, getActiveChildIndex, setActiveChildIndex, removeChild, clearSelectedChild } from '../../data/tournamentData';

export default function ChildSwitcher({ children, activeIndex, onSwitch, onClear }) {
  if (!children || children.length === 0) return null;

  function handleSwitch(idx) {
    setActiveChildIndex(idx);
    onSwitch(idx);
  }

  function handleRemove(idx) {
    removeChild(idx);
    const updated = getSelectedChildren();
    if (updated.length === 0) {
      onClear();
    } else {
      onSwitch(getActiveChildIndex());
    }
  }

  if (children.length === 1) {
    const child = children[0];
    return (
      <div className="bg-orange-900/40 border border-orange-700 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-orange-200">
          Viewing as <strong className="text-orange-100">{child.playerName}</strong>
          {' — '}
          <span className="text-orange-300">{child.teamName}</span>
          {' '}
          <span className="text-orange-400">({child.division})</span>
        </span>
        <button
          onClick={() => { clearSelectedChild(); onClear(); }}
          className="ml-3 text-orange-400 hover:text-orange-200 underline text-xs"
        >
          Change
        </button>
      </div>
    );
  }

  // Multiple children
  return (
    <div className="bg-orange-900/40 border border-orange-700 rounded-lg px-3 py-2 space-y-1.5">
      <div className="text-orange-400 text-xs font-semibold uppercase tracking-wide">Your Children</div>
      {children.map((child, idx) => (
        <div
          key={`${child.playerName}-${idx}`}
          className={`flex items-center justify-between rounded px-2 py-1.5 text-sm cursor-pointer transition-colors ${
            idx === activeIndex
              ? 'bg-orange-800/50 ring-1 ring-orange-500'
              : 'hover:bg-orange-900/30'
          }`}
          onClick={() => handleSwitch(idx)}
        >
          <span className={idx === activeIndex ? 'text-orange-100 font-bold' : 'text-orange-200'}>
            {child.playerName}
            <span className="text-orange-300 ml-1">— {child.teamName}</span>
            <span className="text-orange-400 ml-1">({child.division})</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
            className="text-orange-500 hover:text-orange-300 text-xs ml-2"
            title="Remove"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
