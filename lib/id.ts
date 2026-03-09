import { createHash } from "crypto";

export function storyId(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 12);
}
