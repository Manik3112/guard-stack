type MemoryDocument = Record<string, unknown> & { _id: string };

const collections = new Map<string, MemoryDocument[]>();

function getCollectionStore(name: string): MemoryDocument[] {
  if (!collections.has(name)) {
    collections.set(name, []);
  }
  return collections.get(name)!;
}

function matchesFilter(
  doc: MemoryDocument,
  filter: Record<string, unknown> = {},
): boolean {
  return Object.entries(filter).every(([key, value]) => doc[key] === value);
}

function applyUpdate(
  doc: MemoryDocument,
  update: Record<string, unknown>,
): void {
  if (update.$set && typeof update.$set === "object") {
    Object.assign(doc, update.$set as Record<string, unknown>);
    return;
  }
  Object.assign(doc, update);
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createMemoryCollection(collectionName: string) {
  const getDocs = () => getCollectionStore(collectionName);

  return {
    insertOne: async (document: Record<string, unknown>) => {
      const docs = getDocs();
      const _id = (document._id as string) ?? createId();
      const doc = { ...document, _id } as MemoryDocument;
      docs.push(doc);
      return { acknowledged: true, insertedId: _id };
    },

    insert: async (document: Record<string, unknown> | Record<string, unknown>[]) => {
      if (Array.isArray(document)) {
        const docs = getDocs();
        const insertedIds: string[] = [];
        for (const item of document) {
          const _id = (item._id as string) ?? createId();
          docs.push({ ...item, _id } as MemoryDocument);
          insertedIds.push(_id);
        }
        return { acknowledged: true, insertedCount: insertedIds.length, insertedIds };
      }
      const docs = getDocs();
      const _id = (document._id as string) ?? createId();
      const doc = { ...document, _id } as MemoryDocument;
      docs.push(doc);
      return { acknowledged: true, insertedId: _id };
    },

    find: (filter: Record<string, unknown> = {}) => ({
      toArray: async () =>
        getDocs()
          .filter((doc) => matchesFilter(doc, filter))
          .map((doc) => ({ ...doc })),
    }),

    findOne: async (filter: Record<string, unknown> = {}) => {
      const doc = getDocs().find((item) => matchesFilter(item, filter));
      return doc ? { ...doc } : null;
    },

    updateOne: async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const doc = getDocs().find((item) => matchesFilter(item, filter));
      if (!doc) {
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      }
      applyUpdate(doc, update);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    },

    update: async (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
    ) => {
      const docs = getDocs().filter((item) => matchesFilter(item, filter));
      for (const doc of docs) {
        applyUpdate(doc, update);
      }
      return {
        acknowledged: true,
        matchedCount: docs.length,
        modifiedCount: docs.length,
      };
    },

    deleteOne: async (filter: Record<string, unknown>) => {
      const docs = getDocs();
      const index = docs.findIndex((item) => matchesFilter(item, filter));
      if (index === -1) {
        return { acknowledged: true, deletedCount: 0 };
      }
      docs.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    },

    delete: async (filter: Record<string, unknown> = {}) => {
      const docs = getDocs();
      const remaining = docs.filter((item) => !matchesFilter(item, filter));
      const deletedCount = docs.length - remaining.length;
      collections.set(collectionName, remaining);
      return { acknowledged: true, deletedCount };
    },
  };
}
