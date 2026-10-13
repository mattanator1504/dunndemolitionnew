import { buildMetadata, productSchema } from '@/lib/seo';
import { site } from '@/lib/site';
import { materials, money } from '@/content/pricing';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageHero } from '@/components/sections/PageHero';
import { SectionHead } from '@/components/sections/SectionHead';
import { PricingTable } from '@/components/sections/PricingTable';
import { GeniusNexForm } from '@/components/forms/GeniusNexForm';
import { Photo } from '@/components/site/Photo';
import { QuoteCta } from '@/components/sections/QuoteCta';

// Illustrative stock photos per material (the footer notes they aren't Dunn's own).
const materialImages: Record<string, string> = {
  '21a': 'crushed-stone-closeup',
  '3-stone': 'broken-concrete-rubble',
  '57-stone': 'broken-rock-pile',
  'concrete-rip-rap': 'concrete-rubble-stockpile',
  'granite-rip-rap': 'excavator-bucket-on-rubble',
};

// Primary keyword: "crushed concrete for sale" (provisional, see references/used-keywords.md)
export const metadata = buildMetadata({
  title: 'Crushed Concrete & Rip Rap for Sale | Dunn Demolition',
  description:
    'Crushed concrete for sale in Hampton Roads: 21A and #3 at $20/ton pickup, plus #57 stone and rip rap. Meets VDOT specs. Pickup or local delivery.',
  path: '/buy',
});

export default function BuyPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Buy materials', path: '/buy' }]}
        title="Crushed concrete for sale"
        lede={
          <p>
            Recycled 21A and #3 crushed concrete, #57 stone and rip rap for pickup or local delivery in Hampton Roads. Our recycled stone meets or exceeds VDOT
            specifications and comes with an engineered proctor.
          </p>
        }
        image="crushed-stone-closeup"
        cta="material"
      />

      <section aria-label="Materials" className="bg-paper pt-16 lg:pt-24">
        <ul className="container-x grid grid-cols-2 gap-3 md:grid-cols-5 lg:gap-4">
          {materials.map((m, i) => (
            <li key={m.id} data-reveal style={{ '--i': i } as React.CSSProperties}>
              <a href={`#${m.id}`} className="group block">
                <span className="relative block aspect-[3/4] overflow-hidden" data-reveal="blocks">
                  <Photo name={materialImages[m.id]} alt="" sizes="(min-width: 768px) 20vw, 50vw" maxWidth={640} className="photo absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-heavy)] group-hover:scale-110" />
                  <span className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-x-2 bg-gradient-to-t from-ink/85 to-transparent p-3 pt-12 text-paper">
                    <span className="label">{m.name}</span>
                    <span className="num font-mono text-lg text-accent" data-scramble>
                      {money(Math.min(...m.lines.map((l) => l.price)))}
                    </span>
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-paper py-20 lg:py-28" aria-labelledby="prices-title">
        <div className="container-x">
          <SectionHead id="prices-title" title="Stone prices" intro="Per ton, picked up or delivered. Freight is listed where it’s charged separately." />
          <div className="mt-12" data-reveal>
            <PricingTable />
          </div>
        </div>
      </section>

      <section id="material-quote" className="scroll-mt-20 bg-concrete py-20 lg:py-28" aria-labelledby="form-title">
        <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <SectionHead id="form-title" title="Request a material quote" />
            <div className="prose-dunn mt-6 text-muted" data-reveal>
              <p>Tell us what you need, how much, and where it’s going. We’ll come back with pricing and delivery as soon as we can.</p>
              <p>
                Rather talk? Call {site.recyclingPhone.contact} at{' '}
                <a href={site.recyclingPhone.href} className="link-under num font-semibold text-ink">
                  {site.recyclingPhone.display}
                </a>
                .
              </p>
              <p>We accept {site.payments.slice(0, -1).join(', ')} and {site.payments.at(-1)}.</p>
            </div>
            <div className="relative mt-10 hidden aspect-[4/3] overflow-hidden lg:block" data-reveal="blocks">
              <Photo name="concrete-rubble-stockpile" sizes="35vw" className="photo absolute inset-0 h-full w-full scale-[1.14] object-cover" parallax />
            </div>
          </div>
          <GeniusNexForm formId={site.forms.material} title="Material quote request" />
        </div>
      </section>

      <JsonLd data={productSchema(materials)} />
      <QuoteCta title="Got something to tear out first?" line="The concrete has to come from somewhere. If you need a driveway, slab or building removed, we’ll quote that too, free." />
    </>
  );
}
