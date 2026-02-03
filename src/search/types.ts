export type SearchRequest = {
  q: string;
  entityType?: string;
  limit?: number;
  cursor?: string; // encodes (updatedAt, id)
  userId?: string; // For read-your-write consistency
};

export type SearchResult = {
  id: bigint;
  entityType: string;
  entityId: bigint;
  primaryText: string | null;
  secondaryText: string | null;
  slug: string | null;
  authorName: string | null;
  brandName: string | null;
  followerCount: number;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  tags: string[];
  attributes: any;
  updatedAt: Date;
};

export type SearchResponse = {
  results: SearchResult[];
  nextCursor: string | null;
  cached: boolean;
  latency: number;
};
