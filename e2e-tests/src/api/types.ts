/** A user as the API returns it, with the JWT that logs it in. */
export type User = {
  email: string;
  username: string;
  bio: string | null;
  image: string | null;
  token: string;
};

/** An author as the others see it. */
export type Profile = {
  username: string;
  bio: string | null;
  image: string | null;
  following: boolean;
  followersCount: number;
};

/** An article; the slug derives from the title and changes with it. */
export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  createdAt: string;
  updatedAt: string;
  favorited: boolean;
  favoritesCount: number;
  author: Profile;
};

export type Comment = {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: Profile;
};

export type NewUser = { username: string; email: string; password: string };
export type Credentials = { email: string; password: string };
export type NewArticle = { title: string; description: string; body: string; tagList: string[] };
export type NewComment = { body: string };

export type RegisterUserRequest = { user: NewUser };
export type LoginUserRequest = { user: Credentials };
export type CreateArticleRequest = { article: NewArticle };
export type AddCommentRequest = { comment: NewComment };

export type UserResponse = { user: User };
export type ArticleResponse = { article: Article };
/** A page of articles, newest first; articlesCount is inflated by the tag join, count the array. */
export type ArticlesResponse = { articles: Article[]; articlesCount: number };
export type ProfileResponse = { profile: Profile };
export type CommentResponse = { comment: Comment };
export type CommentsResponse = { comments: Comment[] };
/** Every error of the API, whatever the status. */
export type ErrorsResponse = { errors: { body: string[] } };
/** What a delete answers: 200 with a message, not 204. */
export type MessageResponse = { message: { body: string[] } };
