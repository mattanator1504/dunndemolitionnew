import { site } from '@/lib/site';

const line =
  'Houses, commercial buildings and industrial plants, taken down with excavators, not explosives. Up to 75% of the material gets recycled.';

// The first thing behind the hero's wall: one statement that lights up word by word
// as it crosses the screen (MotionRoot sets --lit per word), then four numbers from stats.md.
export function Statement() {
  const stats = [
    { value: String(site.foundingYear), count: undefined, label: 'In business since' },
    { value: String(site.stats.crews), count: site.stats.crews, label: `Crews, never more than ${site.stats.maxProjects} jobs at once` },
    { value: site.stats.recycledRange, count: undefined, label: 'Of removed material recycled' },
    { value: `${site.stats.projectsPerYear}`, count: site.stats.projectsPerYear, label: 'Or so demolition projects a year' },
  ];
  return (
    <section aria-label="Dunn Demolition at a glance" className="relative bg-paper pb-20 pt-24 lg:pb-28 lg:pt-36 [.js-pin_&]:pt-[calc(150svh+2.25rem)]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="container-x relative h-full">
          <div className="guides" />
        </div>
      </div>
      <div className="container-x relative">
        <p
          data-words
          className="max-w-[68rem] text-[clamp(1.9rem,4.4vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.025em] [font-stretch:108%]"
        >
          {line.split(' ').map((w, i) => (
            <span key={i} className="w">
              {w}{' '}
            </span>
          ))}
        </p>

        <dl className="mt-20 grid grid-cols-2 border-t border-ink lg:mt-28 lg:grid-cols-4">
          {stats.map((it, i) => (
            <div
              key={it.label}
              data-reveal
              style={{ '--i': i } as React.CSSProperties}
              className={`@container flex flex-col-reverse justify-end gap-3 border-line pb-2 pt-6 pr-4 ${i % 2 ? 'border-l pl-4' : ''} ${i > 1 ? 'border-t lg:border-t-0' : ''} ${i === 2 ? 'lg:border-l lg:pl-4' : ''}`}
            >
              <dt className="label max-w-[14rem] text-muted">{it.label}</dt>
              <dd className="num whitespace-nowrap font-display text-[clamp(2rem,19cqi,5.25rem)] font-black leading-[0.8] tracking-[-0.04em] [font-stretch:125%]">
                <span data-countup={it.count}>{it.value}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
