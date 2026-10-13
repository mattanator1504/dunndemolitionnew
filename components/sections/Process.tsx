import { ProcessTimeline } from '@/components/motion/ProcessTimeline';
import { site } from '@/lib/site';
import { Split } from '@/components/fx/Split';

const steps = [
  { title: 'Site visit', body: 'We walk the site, talk through what comes down and when, and quote it. Free.' },
  { title: 'Permits and disconnects', body: 'We help pull the permit and line up utility disconnects.' },
  { title: 'Demolition', body: 'Excavators take the structure down in a controlled order. No explosives.' },
  { title: 'Haul and clean up', body: 'Debris is hauled and recycled as we go. The site is left clean.' },
];

// Four real, sequential steps, so numbering carries meaning here.
// Desktop with motion: pinned, and the steps travel sideways as you scroll down.
// Otherwise: a plain vertical list.
export function Process() {
  return (
    <section className="on-ink relative overflow-hidden bg-ink text-paper" aria-labelledby="process-title">
      <ProcessTimeline>
        <div
          className="flex flex-col gap-14 py-24 lg:[.js-motion_&]:h-[100svh] lg:[.js-motion_&]:w-max lg:[.js-motion_&]:flex-row lg:[.js-motion_&]:items-stretch lg:[.js-motion_&]:gap-0 lg:[.js-motion_&]:py-0"
          data-track
        >
          <div className="container-x flex flex-col justify-center lg:[.js-motion_&]:w-[44vw] lg:[.js-motion_&]:max-w-none lg:[.js-motion_&]:shrink-0 lg:[.js-motion_&]:pr-20" data-reveal>
            <h2 id="process-title" className="h-section lg:[.js-motion_&]:text-[clamp(2.3rem,4.6vw,4.75rem)]" aria-label="Four steps. No surprises.">
              <Split text="Four steps. No surprises." />
            </h2>
            <p className="lede mt-6 text-dust">
              Most jobs can start {site.timing.leadTime} after you say go. A typical house comes down in {site.timing.residential}.
            </p>
            <div className="mt-10 hidden h-px w-full bg-line-dark lg:block" aria-hidden="true">
              <div data-progress className="h-full origin-left scale-x-0 bg-accent" />
            </div>
          </div>
          <ol className="container-x grid gap-10 lg:grid-cols-4 lg:[.js-motion_&]:flex lg:[.js-motion_&]:max-w-none lg:[.js-motion_&]:gap-0 lg:[.js-motion_&]:px-0">
            {steps.map((s, i) => (
              <li key={s.title} data-step className="flex flex-col justify-center border-t border-line-dark pt-8 lg:[.js-motion_&]:w-[30vw] lg:[.js-motion_&]:shrink-0 lg:[.js-motion_&]:border-l lg:[.js-motion_&]:border-t-0 lg:[.js-motion_&]:px-12 lg:[.js-motion_&]:pt-0">
                <span
                  data-num
                  aria-hidden="true"
                  className="num font-display text-[clamp(6rem,14vw,15rem)] font-black lg:text-[clamp(5rem,8.5vw,9rem)] lg:[.js-motion_&]:text-[clamp(6rem,14vw,15rem)] leading-[0.8] tracking-[-0.05em] text-transparent [-webkit-text-stroke:1.5px_var(--color-dust)] [font-stretch:125%]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="h-card mt-8 text-[1.7rem] lg:text-[1.4rem] lg:[.js-motion_&]:text-[1.7rem]">{s.title}</h3>
                <p className="mt-4 max-w-xs text-dust">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </ProcessTimeline>
    </section>
  );
}
