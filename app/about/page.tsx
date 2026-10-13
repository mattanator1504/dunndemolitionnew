import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { site } from '@/lib/site';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHead } from '@/components/sections/SectionHead';
import { PhotoSlab } from '@/components/sections/PhotoSlab';
import { QuoteCta } from '@/components/sections/QuoteCta';
import { PhotoReel } from '@/components/sections/PhotoReel';
import { Photo } from '@/components/site/Photo';

// Primary keyword: "demolition company Virginia Beach" (provisional, see references/used-keywords.md)
export const metadata = buildMetadata({
  title: 'About Our Demolition Company, Since 1974 | Dunn Demolition',
  description:
    'Dunn Demolition has been a demolition company in Virginia Beach and Chesapeake since 1974: 3 experienced crews, VA Class A license, fully insured.',
  path: '/about',
});

export default function AboutPage() {
  const facts = [
    { value: String(site.foundingYear), label: 'Year established' },
    { value: `${site.stats.projectsPerYear}`, label: 'Demolition projects a year, or so' },
    { value: `${site.stats.operatorYears}+`, label: 'Years of combined operator experience' },
    { value: String(site.stats.crews), label: `Crews of ${site.stats.crewSize} people` },
  ];
  return (
    <>
      <PageHero
        crumbs={[{ name: 'About', path: '/about' }]}
        title="A demolition company since 1974"
        lede={
          <p>
            Dunn Demolition is a demolition company based in Virginia Beach and Chesapeake, taking down houses, commercial buildings and industrial plants
            across Virginia, North Carolina and Maryland for more than 50 years.
          </p>
        }
        image="excavator-old-industrial-building"
      />

      <section aria-label="Dunn Demolition by the numbers" className="bg-concrete pb-6 pt-10">
        <dl className="container-x grid grid-cols-2 border-t border-ink lg:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.label} data-reveal style={{ '--i': i } as React.CSSProperties} className={`flex flex-col-reverse justify-end gap-3 py-6 pr-4 ${i ? 'lg:border-l lg:border-line lg:pl-4' : ''} ${i % 2 ? 'border-l border-line pl-4' : ''}`}>
              <dt className="label text-muted">{f.label}</dt>
              <dd className="num font-display text-[clamp(2.6rem,5vw,4.75rem)] font-black leading-[0.8] tracking-[-0.04em] [font-stretch:125%]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Demolition and site work photos" className="bg-concrete pb-10">
        <div className="container-x grid grid-cols-2 gap-3 lg:grid-cols-12 lg:grid-rows-2 lg:gap-4">
          {[
            { n: 'excavator-dismantling-industrial-building', c: 'col-span-2 aspect-[16/10] lg:col-span-7 lg:row-span-2 lg:aspect-auto' },
            { n: 'aerial-heavy-equipment', c: 'aspect-square lg:col-span-5 lg:aspect-[16/9]' },
            { n: 'loader-at-night', c: 'aspect-square lg:col-span-3 lg:aspect-[4/3]' },
            { n: 'broken-concrete-rubble', c: 'col-span-2 aspect-[16/9] lg:col-span-2 lg:aspect-auto' },
          ].map((p) => (
            <div key={p.n} className={`group relative overflow-hidden ${p.c}`} data-reveal="blocks">
              <Photo name={p.n} sizes="(min-width: 1024px) 50vw, 100vw" className="photo absolute inset-0 h-full w-full scale-[1.14] object-cover transition-[filter] duration-500 group-hover:[filter:none]" parallax />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-paper py-20 lg:py-28" aria-labelledby="experience-title">
        <div className="container-x grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHead id="experience-title" title="Experience you can check" />
            <div className="prose-dunn mt-6 text-muted" data-reveal>
              <p>
                Aren’t all demolition contractors about the same? No, and it’s a common misconception. Professional practices vary over a wide range. We
                employ skilled people, run the right equipment and follow proper procedures.
              </p>
              <p>
                Our field crews are some of the most experienced in the business. Our excavator operators alone have more than {site.stats.operatorYears} years of
                combined field experience. We run {site.stats.crews} crews with {site.stats.crewSize} people on each, and we never take on more than{' '}
                {site.stats.maxProjects} projects at a time. That’s how every part of every job gets managed properly.
              </p>
              <p>
                We can give you a long list of references from clients and associates. With around {site.stats.projectsPerYear} jobs a year, it’s a long list.
              </p>
            </div>
          </div>
          <PhotoSlab name="excavator-brick-rubble" sizes="(min-width: 1024px) 45vw, 100vw" shadow="accent" />
        </div>
      </section>

      <section className="on-ink bg-ink py-20 text-paper lg:py-28" aria-labelledby="insured-title">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHead id="insured-title" title="Licensed and insured for demolition" />
            <p className="lede mt-6 text-dust" data-reveal>
              Ask any contractor for the declaration page of their policy. It states what they’re actually insured to do. Clients are often surprised how many
              demolition jobs are taken on by landscapers instead of demolition companies.
            </p>
          </div>
          <ul className="grid gap-4 self-end sm:grid-cols-2">
            {[site.license, ...site.insurance, `Member, ${site.memberships[0]}`].map((item, i) => (
              <li key={item} className="slab flex items-center gap-4 p-5 font-bold uppercase leading-tight [font-stretch:110%] lg:text-base" data-reveal style={{ '--i': i } as React.CSSProperties}>
                <span className="h-4 w-4 shrink-0 bg-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper py-20 lg:py-28" aria-labelledby="permits-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <PhotoSlab name="rubble-street-demolition" sizes="(min-width: 1024px) 45vw, 100vw" className="lg:order-2" />
          <div>
            <SectionHead id="permits-title" title="We handle the paperwork too" />
            <div className="prose-dunn mt-6 text-muted" data-reveal>
              <p>
                Most cities have several steps to securing a demolition permit these days. Our office staff know the utility disconnect and municipal
                procedures, and we help pull the permit for our projects unless the owner already has one.
              </p>
              <p>
                It takes a big job off your plate, and it’s a large part of why we typically need {site.timing.leadTime} of lead time.{' '}
                <Link href="/faqs#permits" className="link-under font-semibold text-ink">
                  More on permits
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <PhotoReel />
      <QuoteCta title="Work with us on your next project" />
    </>
  );
}
