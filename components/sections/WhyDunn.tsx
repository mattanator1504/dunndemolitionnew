import Link from 'next/link';
import { Photo } from '@/components/site/Photo';
import { site } from '@/lib/site';
import { Split } from '@/components/fx/Split';

// Sticky split: the claim holds still on the left while the proof scrolls past on the right.
export function WhyDunn() {
  const points = [
    {
      tag: 'Insurance',
      title: 'Insured for demolition, not just liability',
      body: 'We carry demolition insurance on top of general liability, workers’ comp and commercial vehicle cover. Plenty of outfits doing demolition don’t. Whoever you hire, ask for the declaration page of their policy.',
    },
    {
      tag: 'Crews',
      title: 'Experienced crews, never spread thin',
      body: `Our excavator operators have ${site.stats.operatorYears}+ years of combined experience. We run ${site.stats.crews} crews and never take on more than ${site.stats.maxProjects} jobs at once.`,
    },
  ];
  return (
    <section className="relative bg-paper py-24 lg:py-36" aria-labelledby="why-title">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:sticky lg:top-32 lg:col-span-5 lg:self-start">
          <h2 id="why-title" className="h-section lg:text-[clamp(2.3rem,4vw,4.25rem)]" data-reveal aria-label="Not every demolition contractor is the same">
            <Split text="Not every demolition contractor is the same" />
          </h2>
          <p className="lede mt-6 text-muted" data-reveal>
            <Link href="/about" className="link-under font-medium text-ink">
              More about Dunn Demolition
            </Link>
          </p>
        </div>

        <ol className="lg:col-span-6 lg:col-start-7">
          {points.map((p, i) => (
            <li key={p.tag} className="border-t border-ink py-10 first:pt-8 lg:py-14" data-reveal>
              <p className="label flex justify-between text-muted">
                <span>{p.tag}</span>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
              </p>
              <h3 className="mt-6 text-[clamp(1.8rem,3vw,2.8rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] [font-stretch:115%]">{p.title}</h3>
              <p className="mt-5 max-w-xl text-muted">{p.body}</p>
            </li>
          ))}
          <li className="relative aspect-[16/10] overflow-hidden" data-reveal="blocks">
            <Photo name="excavator-brick-rubble" sizes="(min-width: 1024px) 50vw, 100vw" className="photo absolute inset-0 h-full w-full scale-[1.14] object-cover" parallax />
          </li>
        </ol>
      </div>
    </section>
  );
}
