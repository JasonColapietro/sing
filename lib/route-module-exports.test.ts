import { describe, expect, it } from "vitest";
import * as signInPage from "@/app/sign-in/[[...sign-in]]/page";

describe("Next page module exports", () => {
  it("keeps the sign-in route limited to fields Next accepts", () => {
    expect(Object.keys(signInPage).sort()).toEqual(["default", "metadata"]);
  });
});
