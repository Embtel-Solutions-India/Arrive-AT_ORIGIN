export const blogPosts = [];

export const formatPostDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
