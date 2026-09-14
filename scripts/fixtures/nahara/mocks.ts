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
export const useAuth = () => ({ isAdmin: false });
