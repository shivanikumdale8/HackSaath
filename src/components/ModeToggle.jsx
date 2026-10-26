/**
 * ModeToggle Component for HackSaath
 * Switches between Team Finder, Skill Exchange, and Freelance modes
 * Aligned with HackSaath Navy Blue and Teal design theme.
 */
const MODES = [
  { value: 'team', label: 'Team Finder', hint: 'Find teammates for hackathons and projects' },
  { value: 'exchange', label: 'Skill Exchange', hint: 'Swap skills, no money' },
  { value: 'freelance', label: 'Freelance', hint: 'Paid student tasks & gigs' },
];

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-[#1e2a44] bg-[#0c1224] p-1 shadow-sm">
      {MODES.map((option) => {
        const active = option.value === mode;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            title={option.hint}
            aria-pressed={active}
            className={`rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition cursor-pointer ${
              active
                ? 'bg-teal-500 text-slate-950 font-semibold shadow-md shadow-teal-500/20'
                : 'text-slate-400 hover:bg-[#111a33] hover:text-white'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
