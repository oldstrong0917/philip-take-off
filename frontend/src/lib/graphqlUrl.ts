export function getGraphqlUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL?.trim();

  if (envUrl) {
    if (
      typeof window !== "undefined" &&
      /^https?:\/\/backend(?::|\/|$)/i.test(envUrl)
    ) {
      return "/graphql";
    }

    return envUrl;
  }

  // In browser production deployments, default to same-origin route.
  if (typeof window !== "undefined") {
    return "/graphql";
  }

  return "http://localhost:4000/graphql";
}
