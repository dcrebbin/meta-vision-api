import { describe, expect, it } from "bun:test";
import { getAvatar, getName } from "~/lib/utils";
import type { User } from "~/types";

describe("getName", () => {
  it("returns user_metadata.name when available", () => {
    const user = {
      user_metadata: { name: "John Doe" },
      identities: [],
    } as unknown as User;

    expect(getName(user)).toBe("John Doe");
  });

  it("returns identity name when user_metadata.name is not available", () => {
    const user = {
      user_metadata: {},
      identities: [{ identity_data: { name: "John Smith" } }],
    } as unknown as User;

    expect(getName(user)).toBe("John Smith");
  });

  it("returns name from email when no other name is available", () => {
    const user = {
      user_metadata: {},
      identities: [],
      email: "john.doe@example.com",
    } as unknown as User;

    expect(getName(user)).toBe("john.doe");
  });

  it("returns undefined when no name source is available", () => {
    const user = {
      user_metadata: {},
      identities: [],
    } as unknown as User;

    expect(getName(user)).toBeUndefined();
  });
});

describe("getAvatar", () => {
  it("returns identity avatar_url when available", () => {
    const avatarUrl = "https://example.com/avatar.jpg";
    const user = {
      user_metadata: {},
      identities: [{ identity_data: { avatar_url: avatarUrl } }],
    } as unknown as User;

    expect(getAvatar(user)).toBe(avatarUrl);
  });

  it("returns user_metadata avatar_url when identity avatar is not available", () => {
    const avatarUrl = "https://example.com/avatar.jpg";
    const user = {
      user_metadata: { avatar_url: avatarUrl },
      identities: [],
    } as unknown as User;
    expect(getAvatar(user)).toBe(avatarUrl);
  });

  it("returns undefined when no avatar is available", () => {
    const user = {
      user_metadata: {},
      identities: [],
    } as unknown as User;
    expect(getAvatar(user)).toBeUndefined();
  });
});
