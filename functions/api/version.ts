import { getVersionInfo } from "../../server/_core/version";

export const onRequestGet: PagesFunction = async () => {
  const versionInfo = getVersionInfo();
  return new Response(JSON.stringify(versionInfo), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
