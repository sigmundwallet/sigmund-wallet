import { isAxiosError } from "axios";
import { useState } from "react";

export const useMutation = <T, R>(mutationFn: (arg: T) => R | Promise<R>) => {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (arg: T) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mutationFn(arg);
      setData(response);

      return response;
    } catch (e) {
      setError(e as Error);
      if (isAxiosError(e)) {
        throw e.response?.data.error ? new Error(e.response?.data.error) : e;
      }
    } finally {
      setLoading(false);
    }
  };

  return [mutate, { data, loading, error }] as const;
};
