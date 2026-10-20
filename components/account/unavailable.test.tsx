import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccountsUnavailable } from "./unavailable";

describe("sign-in and sign-up while accounts are off", () => {
  it.each(["Signing in", "Signing up"] as const)(
    "%s: sends the export it recommends to Your data, not the top of /progress",
    (verb) => {
      const html = renderToStaticMarkup(<AccountsUnavailable verb={verb} />);
      expect(html).toContain("exporting it from the progress");
      expect(html).toMatch(/<a[^>]*href="\/progress#your-data"[^>]*>Go to Progress<\/a>/);
      expect(html).not.toMatch(/href="\/progress"/);
    },
  );
});
