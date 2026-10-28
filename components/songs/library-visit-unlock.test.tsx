import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS } from "@/lib/progress-shape";
import { DEFAULT_BROWSE } from "./browse-controls";
import { SONGS } from "./data";
import { bandForSong, bandOpen } from "./lib";
import { Library } from "./library";

const fixture = vi.hoisted(() => ({
  recents: [] as { id: string; at: string }[],
  queue: [] as string[],
  buttons: [] as { label: unknown; click?: () => void; disabled?: boolean }[],
}));
vi.mock("@/lib/pro", async (original) => ({
  ...await original<typeof import("@/lib/pro")>(),
  useIsPro: () => false,
}));
vi.mock("./favorites", async (original) => ({
  ...await original<typeof import("./favorites")>(),
  useMastered: () => new Set<string>(),
  useFavorites: () => [],
  useRecentlyPlayed: () => fixture.recents,
  recordSongPlayed: vi.fn(),
}));
vi.mock("./setlist", async (original) => ({
  ...await original<typeof import("./setlist")>(),
  useSetlist: () => ({ ids: fixture.queue, cursor: -1 }),
  beginSetlist: () => fixture.queue[0] ?? null,
}));
vi.mock("./taste", () => ({
  useTaste: () => ({ kind: "skipped" }),
  saveTaste: vi.fn(),
  skipTaste: vi.fn(),
}));
vi.mock("@/components/ui", async (original) => {
  const actual = await original<typeof import("@/components/ui")>();
  return {
    ...actual,
    Button: (props: ComponentProps<typeof actual.Button>) => {
      fixture.buttons.push({ label: props.children, click: props.onClick as (() => void) | undefined, disabled: props.disabled });
      return <actual.Button {...props} />;
    },
  };
});

const locked = SONGS.find((song) => !bandOpen(bandForSong(song), new Set(), SONGS))!;
const sibling = SONGS.find((song) => song.id !== locked.id && bandForSong(song) === bandForSong(locked))!;

function render(visitUnlockedSongId?: string, query = "") {
  const select = vi.fn();
  const html = renderToStaticMarkup(
    <Library
      progress={DEFAULT_PROGRESS}
      onSelect={select}
      browse={{ ...DEFAULT_BROWSE, query }}
      onBrowseChange={() => {}}
      visitUnlockedSongId={visitUnlockedSongId}
    />,
  );
  return { html, select };
}

function card(html: string, title: string) {
  const from = html.indexOf(`<h3 class="text-lg">${title}</h3>`);
  expect(from).toBeGreaterThan(-1);
  return html.slice(from, html.indexOf("</a>", from));
}

beforeEach(() => {
  fixture.recents = [{ id: locked.id, at: new Date().toISOString() }];
  fixture.queue = [locked.id];
  fixture.buttons = [];
});

describe("a song opened by a page link during this visit", () => {
  it("keeps that card startable after Exit while siblings still require mastery", () => {
    expect(locked).toBeDefined();
    expect(sibling).toBeDefined();
    const { html } = render(locked.id);
    expect(card(html, locked.title)).not.toContain('aria-label="Locked"');
    expect(card(html, locked.title)).toMatch(/<button[^>]*>Sing<\/button>/);
    expect(card(html, sibling.title)).toContain('aria-label="Locked"');
    expect(card(html, sibling.title)).toMatch(/<button[^>]*disabled=""[^>]*>Locked<\/button>/);
  });

  it("keeps the linked song in recently sung and the visible setlist", () => {
    const { html, select } = render(locked.id);
    expect(html).toContain(">Recently sung</span>");
    expect(html).toContain("Start setlist");
    expect(html).toContain(`Remove ${locked.title} from the setlist`);
    fixture.buttons.find((button) => button.label === "Start setlist")!.click!();
    expect(select).toHaveBeenCalledExactlyOnceWith(locked);
  });

  it("opens a card's Sing straight into the count-in, and every other start on Ready", () => {
    // One tap fewer before the first note; the dice and the setlist still open on Play.
    const { select } = render(locked.id);
    fixture.buttons.find((button) => button.label === "Sing")!.click!();
    expect(select).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }), { autoStart: true });
  });

  it("lets the dice start the linked song when the search selects it", () => {
    const { select } = render(locked.id, locked.title);
    fixture.buttons.find((button) => button.label === "Surprise me")!.click!();
    expect(select).toHaveBeenCalledExactlyOnceWith(locked);
  });

  it("relocks that song on a visit without the page link", () => {
    const { html } = render();
    expect(card(html, locked.title)).toContain('aria-label="Locked"');
    expect(html).not.toContain(">Recently sung</span>");
    expect(html).not.toContain("Start setlist");
  });

  it("cannot add a song outside the entitled catalog", () => {
    const { html } = render("not-in-this-book");
    expect(card(html, locked.title)).toContain('aria-label="Locked"');
    expect(html).not.toContain("Start setlist");
  });
});
