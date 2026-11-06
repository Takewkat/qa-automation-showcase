import {
  AddComment,
  type Article,
  type Comment,
  CreateArticle,
  type NewArticle,
  type Session,
} from "@e2e/api";
import { cleanupArticles } from "@e2e/cleanup/articles.cleanup";
import { articleDraft, commentText } from "@e2e/test-data/factories";
import type { Leftovers } from "@shared/cleanup/leftovers";
import { log } from "@shared/log";

/** Seeds articles and comments as one user and remembers them, by slug or by UI title, for the cleanup. */
export class ArticlesFactory {
  private readonly slugs: string[] = [];
  private readonly titles: string[] = [];

  constructor(
    private readonly session: Session,
    private readonly author: string,
  ) {}

  /** Creates an article through the API, tracked for cleanup; a fresh draft by default. */
  async seed(draft: NewArticle = articleDraft()): Promise<Article> {
    const { article } = await new CreateArticle(this.session).create({ article: draft });
    this.slugs.push(article.slug);
    log("seed", `article ${article.slug} "${article.title}"`);
    return article;
  }

  /** Adds a comment on an article; deleting the article removes it. */
  async comment(slug: string, body: string = commentText()): Promise<Comment> {
    const { comment } = await new AddComment(this.session).add(slug, { comment: { body } });
    log("seed", `comment ${comment.id} on ${slug}`);
    return comment;
  }

  /** Remembers a title the UI will create: the teardown finds it among the author's own articles. */
  track(title: string): void {
    this.titles.push(title);
    log("track", `"${title}" will be found among ${this.author}'s articles`);
  }

  /** Removes everything seeded or tracked; see cleanupArticles. */
  teardown(): Promise<Leftovers> {
    return cleanupArticles(this.session, this.author, this.slugs, this.titles);
  }
}
