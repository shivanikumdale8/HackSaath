import SmartTeamFinder from '../components/SmartTeamFinder';

/**
 * Team Finder Page
 * Title: Team Finder
 * Heading: 30-32px desktop, 26-28px mobile.
 */
export default function TeamFinderPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-4 border-b border-[#1e2a44]">
        <h1 className="text-[26px] sm:text-[32px] font-bold text-white tracking-tight leading-tight">
          Team Finder
        </h1>
        <p className="mt-1 text-[14px] sm:text-[15px] text-slate-400 max-w-2xl leading-normal">
          Discover and connect with fellow student builders by domain expertise, technical skills, and availability.
        </p>
      </div>

      <SmartTeamFinder />
    </div>
  );
}
