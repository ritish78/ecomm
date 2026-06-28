type FetchOptions = RequestInit & {
  skipRefresh?: boolean; //we are preventing infinite loop on the refresh call
};

async function refreshToken(): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

export async function apiFetch(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipRefresh = false, ...fetchOptions } = options;

  const url = `process.env.NEXT_PUBLIC_BACKEND_API_URL${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });

  //if the response from the server is not 401 status code, or we are
  //in a refresh call, we return the response without doing anything to it
  if (response.status !== 401 || skipRefresh) {
    return response;
  }

  const refreshed = await refreshToken();

  if (!refreshed) {
    if (typeof window !== undefined) {
      window.dispatchEvent(new Event("auth:logout"));
    }

    return response;
  }

  return fetch(url, {
    ...fetchOptions,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
  });
}
