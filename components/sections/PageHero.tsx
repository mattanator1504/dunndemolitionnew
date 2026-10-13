import { Breadcrumbs } from '@/components/site/Breadcrumbs';
import { QuoteButton } from '@/components/site/QuoteButton';
import { CallButton } from '@/components/site/CallButton';
import { Photo } from '@/components/site/Photo';
import { DemoTitle } from '@/components/fx/DemoTitle';

type Props = {
  crumbs: { name: string; path: string }[];
  title: string; // the page's H1, carries the primary keyword
  lede: React.ReactNode;
  image?: string;
  cta?: 'quote' | 'material' | 'none';
};

// Inner-page header, compact: title, lede and the way in on the left, the photo on the right.
// The title squeezes under the cursor and crumbles away as you scroll past (DemoTitle);
// the photo is uncovered by a grid of falling blocks.
export function PageHero({ crumbs, title, lede, image, cta = 'quote' }: Props) {
  return (
    <section className="on-ink relative isolate overflow-hidden bg-ink text-paper">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="container-x relative h-full">
          <div className="guides" />
        </div>
      </div>
      <div className={`container-x grid gap-10 pb-12 pt-8 lg:gap-12 lg:pb-16 lg:pt-12 ${image ? 'lg:grid-cols-12 lg:items-end' : ''}`}>
        <div className={image ? 'lg:col-span-7' : ''}>
          <Breadcrumbs items={crumbs} />
          <DemoTitle text={title} className="display mt-8 max-w-[14ch] text-[clamp(2.6rem,6.4vw,6.75rem)] lg:mt-12 lg:text-[clamp(2.6rem,5.8vw,6.75rem)]" />
          <div className="lede mt-7 text-dust">{lede}</div>
          {cta !== 'none' && (
            <div className="mt-8 flex flex-wrap gap-3">
              {cta === 'quote' ? <QuoteButton /> : <QuoteButton label="Request a material quote" href="#material-quote" />}
              <CallButton className="text-paper" />
            </div>
          )}
        </div>
        {image && (
          <div className="relative aspect-[16/10] overflow-hidden lg:col-span-5 lg:aspect-[4/5] lg:max-h-[34rem]" data-reveal="blocks">
            <Photo name={image} sizes="(min-width: 1024px) 38vw, 100vw" className="photo absolute inset-0 h-full w-full scale-[1.14] object-cover" eager parallax />
          </div>
        )}
      </div>
      <div className="hazard h-4" aria-hidden="true" />
    </section>
  );
}
