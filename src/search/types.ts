export type SearchRequest = {
    q: string;
    entityType?: string;
    libraryId?: number;
    status?: string;
    brand?: string;
    limit?: number;
    cursor?: string; // encodes (updated_at, id)
  };
  