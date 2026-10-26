/**
 * HackSaath Brand Logo Mark and Wordmark
 * Real visual asset referenced from /assets/hacksaath-logo.png and /assets/hacksaath-symbol.png
 * Visual: 3 teammates embracing a glowing idea bulb
 * Tagline: "Find Your Team. Build Your Idea."
 * Palette: Navy Blue, Teal, White, Light-Gray
 */

export default function Logo({
  size = 'sm',
  variant = 'symbol', // 'symbol' | 'full'
  showText = false,
  showTagline = false,
  className = '',
  light = false,
}) {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', full: 'h-8', text: 'text-sm', sub: 'text-[10px]' },
    sm: { icon: 'w-8 h-8', full: 'h-10', text: 'text-xl', sub: 'text-[11px]' },
    md: { icon: 'w-10 h-10', full: 'h-12', text: 'text-2xl', sub: 'text-xs' },
    lg: { icon: 'w-12 h-12', full: 'h-16', text: 'text-3xl', sub: 'text-sm' },
    xl: { icon: 'w-16 h-16', full: 'h-24', text: 'text-4xl', sub: 'text-base' },
    '2xl': { icon: 'w-24 h-24', full: 'h-36', text: 'text-5xl', sub: 'text-lg' },
  };

  const current = sizeMap[size] || sizeMap.sm;

  if (variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <img
          src="/assets/hacksaath-logo.png"
          alt="HackSaath — Find Your Team. Build Your Idea."
          className={`${current.full} w-auto object-contain transition-transform duration-200 hover:scale-[1.02] drop-shadow-md rounded-xl`}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Real HackSaath Logo Symbol Image */}
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[#09152e] border border-[#1e2e54]/50 shadow-sm ${current.icon} flex items-center justify-center p-0.5 group-hover:border-teal-500/50 transition-colors`}>
        <img
          src="/assets/hacksaath-symbol.png"
          alt="HackSaath Symbol"
          className="w-full h-full object-cover rounded-lg"
          loading="eager"
        />
      </div>

      {/* Typography Wordmark */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-sans tracking-tight leading-none ${current.text}`}
          >
            <span className="font-bold text-white">Hack</span>
            <span className="font-extrabold text-[#00b4d8] ml-0.5">Saath</span>
          </span>
          {showTagline && (
            <span className={`text-slate-400 font-normal tracking-normal leading-tight mt-0.5 ${current.sub}`}>
              Find Your Team. Build Your Idea.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
