import { clearSelectedChild } from '../../data/tournamentData';

export default function ChildBanner({ child, onClear }) {
  if (!child) return null;

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
