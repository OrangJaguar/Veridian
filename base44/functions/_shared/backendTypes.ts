export type EntityRecord = Record<string, unknown> & { id?: string };

export type EntityHandle = {
  filter: (query?: Record<string, unknown>) => Promise<EntityRecord[]>;
  list: () => Promise<EntityRecord[]>;
  create: (data: Record<string, unknown>) => Promise<EntityRecord>;
  update: (id: string, patch: Record<string, unknown>) => Promise<EntityRecord>;
  delete: (id: string) => Promise<void>;
};

export type BackendUser = {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
};

export type BackendClient = {
  auth: {
    me: () => Promise<BackendUser | null>;
    deleteCurrentUser: () => Promise<void>;
  };
  entities: Record<string, EntityHandle>;
  asServiceRole: { entities: Record<string, EntityHandle> };
  integrations: {
    Core: {
      SendEmail: (input: { to: string; subject: string; body: string }) => Promise<unknown>;
      UploadFile: (input: { file: Blob }) => Promise<{ file_url?: string; url?: string }>;
    };
  };
};
