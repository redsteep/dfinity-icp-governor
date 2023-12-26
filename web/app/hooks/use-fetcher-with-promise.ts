import type { SubmitFunction } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { useCallback, useEffect, useRef } from "react";

export function useFetcherWithPromise<T>() {
  let resolveRef = useRef<any>();
  let promiseRef = useRef<Promise<T>>();
  let fetcher = useFetcher<T>();

  if (!promiseRef.current) {
    promiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }

  const resetResolver = useCallback(() => {
    promiseRef.current = new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, [promiseRef, resolveRef]);

  const submit = useCallback(
    async (...args: Parameters<SubmitFunction>) => {
      fetcher.submit(...args);
      return promiseRef.current;
    },
    [fetcher, promiseRef]
  );

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      resolveRef.current?.(fetcher.data);
      resetResolver();
    }
  }, [fetcher, resetResolver]);

  return { ...fetcher, submit };
}
