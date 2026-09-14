import path from "node:path";
import { fileURLToPath } from "node:url";
const fixture = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(fixture, "../../..");
export default {
  webpack(config, { webpack }) {
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /@\/lib\/(supabase\/client|hooks\/useAuth)$/,
      path.join(fixture, "mocks.ts"),
    ));
    config.resolve.alias["@/lib/supabase/client$"] = path.join(fixture, "mocks.ts");
    config.resolve.alias["@/lib/hooks/useAuth$"] = path.join(fixture, "mocks.ts");
    config.resolve.alias["@"] = root;
    return config;
  },
};
