import { QueryClient } from "@tanstack/react-query";

const Dispose = Symbol.for("dispose");

type Disposable<T> = {
  ref: T;
  [Dispose]: () => void;
};

export function createDisposableRef<T>(
  ref: T,
  dispose: () => void,
): Disposable<T> {
  return { ref, [Dispose]: dispose };
}

export const disposeOnQueryCacheEviction = (client: QueryClient) => {
  const cache = client.getQueryCache();
  const needsDispose = new Map<string, Disposable<unknown>>();

  const add = (queryHash: string, newValue: Disposable<unknown>) => {
    const existing = needsDispose.get(queryHash);
    if (existing === newValue) {
      return;
    }

    if (existing) {
      remove(queryHash);
    }

    if (newValue?.[Dispose]) {
      needsDispose.set(queryHash, newValue);
    }
  };

  const remove = (queryHash: string) => {
    const oldValue = needsDispose.get(queryHash);
    if (oldValue?.[Dispose]) {
      needsDispose.delete(queryHash);

      try {
        oldValue[Dispose]();
      } catch (err) {
        console.error(
          "dispose-on-cache-eviction: error disposing",
          queryHash,
          err,
        );
      }
    }
  };

  cache.subscribe((event) => {
    if (event.type == "added" || event.type == "updated") {
      const value = cache.get(event.query.queryHash)?.state.data;
      add(event.query.queryHash, value as any);
    }

    if (event.type == "removed") {
      remove(event.query.queryHash);
    }
  });

  return client;
};
