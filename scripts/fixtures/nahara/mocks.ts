// Stable, read-only fixtures. Browser tests never contact the real database.
const history = {
  select: () => history,
  eq: () => history,
  gte: () => history,
  lte: () => history,
  order: async () => ({ data: [] }),
};
const client = { from: () => history };
export const createClient = () => client;
// Fixture-only audience switch; never used by production auth.
export const useAuth = () => {
  const role = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("fixtureRole");
  return { loading: false, user: role ? { id: "fixture-user" } : null, isAdmin: role === "admin", isStaff: role === "ops", isWargaRegistry: false };
};
