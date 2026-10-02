// Compatibility URL for the structured coach; the one-shot generator is retired.
export { default } from "./coach";
export const config = {
  api: { bodyParser: { sizeLimit: "64kb" } },
  maxDuration: 180,
};
