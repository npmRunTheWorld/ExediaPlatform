export type AiUse = 'none' | 'assisted';

export type Person = {
  _id: string;
  userName: string;
  image?: string | null;
  bio?: string | null;
  commissions?: boolean | null;
  contactUrl?: string | null;
};

export type Card = {
  _id: string;
  _createdAt: string;
  title?: string | null;
  category?: string | null;
  ai?: AiUse | null;
  hasCredentials?: boolean | null;
  featured?: boolean | null;
  imageUrl: string;
  w?: number | null;
  h?: number | null;
  lqip?: string | null;
  palette?: string[] | null;
  processCount: number;
  saves: number;
  maker?: Person | null;
  sourceName?: string | null;
};

export type Credit = { _key: string; role: string; name: string; url?: string | null };

export type ProcessShot = { _key: string; url: string; w?: number | null; h?: number | null; caption?: string | null };

export type Comment = { _key: string; comment: string; postedBy?: Person | null };

export type Piece = Card & {
  about?: string | null;
  destination?: string | null;
  medium?: string | null;
  sourceUrl?: string | null;
  credits?: Credit[] | null;
  processShots?: ProcessShot[] | null;
  comments?: Comment[] | null;
  savedBy?: Person[] | null;
  userId?: string | null;
};

export type TrailStop = { _key: string; note?: string | null; piece?: Card | null };

export type Trail = {
  _id: string;
  _updatedAt: string;
  title: string;
  about?: string | null;
  owner?: Person | null;
  collaborators?: Person[] | null;
  items?: TrailStop[] | null;
  count?: number;
};

export type Report = {
  _id: string;
  _createdAt: string;
  reason: string;
  details?: string | null;
  status: 'open' | 'kept' | 'hidden';
  piece?: (Card & { hidden?: boolean | null }) | null;
  reporter?: Person | null;
};
