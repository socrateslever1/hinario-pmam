import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Blog Posts CRUD", () => {
  let createdPostId: number | null = null;

  beforeAll(async () => {
    // Setup: Create a test post
    createdPostId = await db.createBlogPost({
      title: "Test Blog Post",
      content: "<p>This is a test blog post</p>",
      imageUrl: "https://example.com/image.jpg",
      authorId: 1,
      published: true,
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test post
    if (createdPostId) {
      await db.deleteBlogPost(createdPostId);
    }
  });

  it("should create a blog post", async () => {
    expect(createdPostId).toBeDefined();
    expect(typeof createdPostId).toBe("number");
    expect(createdPostId).toBeGreaterThan(0);
  });

  it("should retrieve a blog post by ID", async () => {
    if (!createdPostId) throw new Error("Post not created");

    const post = await db.getBlogPostById(createdPostId);
    expect(post).toBeDefined();
    expect(post?.id).toBe(createdPostId);
    expect(post?.title).toBe("Test Blog Post");
    expect(post?.content).toBe("<p>This is a test blog post</p>");
    expect(post?.published).toBe(true);
  });

  it("should list published blog posts", async () => {
    const posts = await db.listBlogPosts(true);
    expect(Array.isArray(posts)).toBe(true);
    expect(posts.length).toBeGreaterThan(0);

    // Find our test post
    const testPost = posts.find((p) => p.id === createdPostId);
    expect(testPost).toBeDefined();
    expect(testPost?.published).toBe(true);
  });

  it("should update a blog post", async () => {
    if (!createdPostId) throw new Error("Post not created");

    const newTitle = "Updated Blog Post";
    const newContent = "<p>Updated content</p>";

    await db.updateBlogPost(createdPostId, {
      title: newTitle,
      content: newContent,
      published: false,
    });

    const updated = await db.getBlogPostById(createdPostId);
    expect(updated?.title).toBe(newTitle);
    expect(updated?.content).toBe(newContent);
    expect(updated?.published).toBe(false);
  });

  it("should handle optional fields in update", async () => {
    if (!createdPostId) throw new Error("Post not created");

    const originalPost = await db.getBlogPostById(createdPostId);
    const originalTitle = originalPost?.title;

    // Update only the published status
    await db.updateBlogPost(createdPostId, {
      published: true,
    });

    const updated = await db.getBlogPostById(createdPostId);
    expect(updated?.title).toBe(originalTitle);
    expect(updated?.published).toBe(true);
  });

  it("should create unpublished posts", async () => {
    const unpublishedId = await db.createBlogPost({
      title: "Unpublished Post",
      content: "<p>This is unpublished</p>",
      authorId: 1,
      published: false,
    });

    expect(unpublishedId).toBeDefined();

    const post = await db.getBlogPostById(unpublishedId!);
    expect(post?.published).toBe(false);

    // Cleanup
    await db.deleteBlogPost(unpublishedId!);
  });

  it("should list only published posts when filtering", async () => {
    // Create an unpublished post
    const unpublishedId = await db.createBlogPost({
      title: "Unpublished Post",
      content: "<p>This is unpublished</p>",
      authorId: 1,
      published: false,
    });

    // List published posts
    const publishedPosts = await db.listBlogPosts(true);
    const unpublishedPosts = await db.listBlogPosts(false);

    // Unpublished post should not appear in published list
    const inPublished = publishedPosts.find((p) => p.id === unpublishedId);
    expect(inPublished).toBeUndefined();

    // Unpublished post should appear in unpublished list
    const inUnpublished = unpublishedPosts.find((p) => p.id === unpublishedId);
    expect(inUnpublished).toBeDefined();

    // Cleanup
    await db.deleteBlogPost(unpublishedId!);
  });

  it("should return posts ordered by creation date (newest first)", async () => {
    const posts = await db.listBlogPosts();
    if (posts.length < 2) return; // Skip if not enough posts

    for (let i = 0; i < posts.length - 1; i++) {
      const current = new Date(posts[i].createdAt).getTime();
      const next = new Date(posts[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});
