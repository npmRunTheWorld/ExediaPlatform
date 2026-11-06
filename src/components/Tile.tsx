/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import Avatar from './Avatar';
import type { Card } from '@/lib/types';

// Sanity serves resized images from its CDN when you add w= and auto=format.
export function sized(url: string, width: number) {
  return `${url}?w=${width}&auto=format&fit=max`;
}

export function Badges({ card }: { card: Pick<Card, 'processCount' | 'hasCredentials' | 'ai' | 'featured'> }) {
  return (
    <div className="badges">
      {card.processCount > 0 && <span className="badge b-proc"><i />Process shown</span>}
      {card.hasCredentials && <span className="badge b-cred"><i />Credentials</span>}
      {card.ai === 'assisted' && <span className="badge b-ai"><i />AI assisted</span>}
    </div>
  );
}

export default function Tile({ card }: { card: Card }) {
  const ratio = card.w && card.h ? `${card.w} / ${card.h}` : undefined;
  return (
    <Link className="tile" href={`/piece/${card._id}`}>
      <img
        className="art"
        src={sized(card.imageUrl, 600)}
        alt={card.title ?? ''}
        loading="lazy"
        width={card.w ?? undefined}
        height={card.h ?? undefined}
        style={{ aspectRatio: ratio, backgroundImage: card.lqip ? `url(${card.lqip})` : undefined, backgroundSize: 'cover' }}
      />
      <Badges card={card} />
      <span className="meta">
        {card.title && <span className="t">{card.title}</span>}
        <span className="byline">
          <Avatar person={card.maker} />
          <span>{card.sourceName ? `${card.sourceName}, shared by ${card.maker?.userName ?? 'someone'}` : card.maker?.userName ?? 'Unknown maker'}</span>
        </span>
      </span>
    </Link>
  );
}
