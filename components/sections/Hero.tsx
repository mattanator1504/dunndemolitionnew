import { HeroSceneMount } from '@/components/three/HeroSceneMount';
import { DemoTitle } from '@/components/fx/DemoTitle';
import { QuoteButton } from '@/components/site/QuoteButton';
import { CallButton } from '@/components/site/CallButton';
import { site } from '@/lib/site';

// Home hero: the whole stage is a brick wall, and the headline is set on it.
// The H1 and the poster (the wall's first frame) render first; LCP is never the 3D.
// On capable desktops (html.js-pin, set before first paint) the hero is a tall, see-through
// track whose sticky stage sits over the start of the page (app/page.tsx pulls the page up
// underneath it). Scrolling the track knocks the wall out from the middle and the page
// behind shows through. HeroSceneMount writes --p and data-cleared; globals.css fades the
// poster and the copy from them. Everywhere else it's a plain full-height wall hero.
export function Hero() {
  return (
    <section id="hero" className="hero on-ink group/hero relative isolate bg-ink text-paper">
      <div className="hero-stage relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col overflow-hidden">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet="/images/hero-wall-poster-1080.webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-wall-poster.webp"
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
              className="hero-poster absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <HeroSceneMount heroId="hero" />
          {/* Small screens: the type runs across the middle of the wall, so shade it all. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,17,0.55),rgba(18,18,17,0.35)_45%,rgba(18,18,17,0.8))] lg:hidden" />
        </div>

        <div className="hero-copy container-x flex flex-1 flex-col py-8 lg:py-12">
          <ul className="label flex flex-wrap gap-x-8 gap-y-2 text-paper/80">
            <li>
              <span className="text-accent">●</span> Est. {site.foundingYear}
            </li>
            <li>{site.license}</li>
            <li>Virginia · North Carolina · Maryland</li>
          </ul>

          <h1 className="mt-auto pt-16" aria-label="We break it down. Demolition contractor for Hampton Roads, Virginia, North Carolina and Maryland">
            <DemoTitle
              as="span"
              text="We break it down."
              accent="down"
              crumble={false}
              className="display block max-w-[8.6ch] text-[clamp(3.4rem,13vw,6rem)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)] lg:text-[clamp(4.25rem,8vw,10rem)]"
            />
            <span className="mt-7 block max-w-[30rem] text-[clamp(1.05rem,1.4vw,1.25rem)] font-medium leading-snug text-paper/85">
              Demolition contractor for Hampton Roads, Virginia, North Carolina and Maryland
            </span>
          </h1>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 lg:mt-12">
            <div className="flex flex-wrap gap-3">
              <QuoteButton />
              <CallButton className="bg-ink/40 text-paper backdrop-blur-sm" />
            </div>
            {/* Scroll cue, pinned mode only. Decorative: drawn from data-t, out of the word count. */}
            <p
              aria-hidden="true"
              data-t="Scroll to break through"
              className="hero-cue label hidden items-center gap-3 text-paper/80 after:content-[attr(data-t)]"
            >
              <span className="hero-cue-arrow inline-block text-accent">↓</span>
            </p>
          </div>
        </div>
        <div className="hazard h-4 shrink-0 [.js-pin_&]:hidden" aria-hidden="true" />
      </div>
    </section>
  );
}
