import Link from 'next/link';
import { buildMetadata, faqSchema } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { Hero } from '@/components/sections/Hero';
import { Statement } from '@/components/sections/Statement';
import { ServiceIndex } from '@/components/sections/ServiceIndex';
import { Marquee } from '@/components/sections/Marquee';
import { WhyDunn } from '@/components/sections/WhyDunn';
import { StoneBanner } from '@/components/sections/StoneBanner';
import { KnockDown } from '@/components/sections/KnockDown';
import { Process } from '@/components/sections/Process';
import { FaqList } from '@/components/sections/FaqList';
import { QuoteCta } from '@/components/sections/QuoteCta';
import { homeServiceIds, serviceById } from '@/content/services';
import { homeFaqIds, faqById } from '@/content/faqs';
import { Split } from '@/components/fx/Split';

// Primary keyword: "demolition contractor Hampton Roads" (provisional, see references/used-keywords.md)
export const metadata = buildMetadata({
  title: 'Demolition Contractor in Hampton Roads, VA | Dunn Demolition',
  description:
    'Demolition contractor in Hampton Roads since 1974. Houses, commercial buildings and gut outs, VA Class A, fully insured. Free quote: 757-472-4142.',
  path: '/',
});

export default function HomePage() {
  const homeFaqs = homeFaqIds.map(faqById);
  const services = homeServiceIds.map(serviceById).map(({ id, name, short, image }) => ({ id, name, short, image }));
  return (
    <>
      <Hero />
      {/* Under js-pin the page pulls up the hero's whole track, so it starts underneath the
          pinned wall (the hero layers above it) and shows through as the wall comes down.
          The statement's extra top padding under js-pin is that track, minus one stage. */}
      <div className="relative z-10 [.js-pin_&]:-mt-[calc(250svh-11.25rem)]">
        <Statement />

        <section className="on-ink relative bg-ink py-24 text-paper lg:py-36" aria-labelledby="services-title">
          <div className="container-x">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div data-reveal>
                <h2 id="services-title" className="h-section" aria-label="What we take down">
                  <Split text="What we take down" />
                </h2>
                <p className="lede mt-6 text-dust">Demolition, plus the site work around it.</p>
              </div>
              <Link href="/services" className="label link-draw shrink-0 self-start pb-1 text-accent lg:self-end" data-reveal>
                All demolition services →
              </Link>
            </div>
            <div className="mt-16 lg:mt-20">
              <ServiceIndex items={services} />
            </div>
          </div>
        </section>

        <Marquee />
        <WhyDunn />
        <Process />
        <KnockDown />
        <StoneBanner />

        <section className="bg-paper py-24 lg:py-36" aria-labelledby="faq-title">
          <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <h2 id="faq-title" className="h-section lg:text-[clamp(2.3rem,3.9vw,4.25rem)]" data-reveal aria-label="Straight answers">
                <Split text="Straight answers" />
              </h2>
              <Link href="/faqs" className="label link-draw mt-10 inline-block pb-1" data-reveal>
                All 19 demolition FAQs →
              </Link>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <FaqList items={homeFaqs} />
            </div>
          </div>
        </section>
        <JsonLd data={faqSchema(homeFaqs)} />

        <QuoteCta pileRoom />
      </div>
    </>
  );
}
