export interface FindResourcesOpts {
  ownerId?: number;
  limit?: number;
  orderBy?: string;
}

export interface ResourceRow {
  id: string;
  owner_id: string;
  type: string;
  status: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}
