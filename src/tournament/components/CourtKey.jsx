import { courts } from '../../data/tournamentData';

export default function CourtKey() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-6">
      <h3 className="text-orange-400 font-bold mb-3 text-sm uppercase tracking-wide">Court Locations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {courts.map((court) => (
          <div key={court.id} className="flex items-start gap-2 text-sm">
            <span className="bg-orange-600 text-white font-bold px-2 py-0.5 rounded text-xs whitespace-nowrap">
              {court.name}
            </span>
            <span className="text-gray-300">{court.location}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
