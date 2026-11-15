import { Markdown } from "@/lib/markdown";
import type { BlogPost } from "@/lib/blog/types";
import { InfographicFigure } from "./infographic";
import { BlogVideoEmbed } from "./video";

/** `::infographic key` or `::video key`, alone on a line. */
export const MEDIA_LINE = /^::(infographic|video)\s+([a-z0-9-]+)\s*$/;

/**
 * Splits a post body on its media directives: the prose between them goes
 * through the site's markdown renderer, each directive becomes its figure.
 * An unknown key renders nothing here and fails lib/blog/blog.test.ts.
 */
export function ArticleBody({ post }: { post: BlogPost }) {
  const parts: React.ReactNode[] = [];
  let buf: string[] = [];
  let k = 0;
  const flush = () => {
    if (buf.length) parts.push(<Markdown key={`m${k++}`} source={buf.join("\n")} />);
    buf = [];
  };
  for (const line of post.body.split("\n")) {
    const m = MEDIA_LINE.exec(line.trim());
    if (!m) {
      buf.push(line);
      continue;
    }
    flush();
    if (m[1] === "infographic") {
      const data = post.infographics[m[2]];
      if (data) parts.push(<InfographicFigure key={`i${k++}`} data={data} />);
    } else {
      const video = post.videos[m[2]];
      if (video) parts.push(<BlogVideoEmbed key={`v${k++}`} video={video} />);
    }
  }
  flush();
  return <>{parts}</>;
}
