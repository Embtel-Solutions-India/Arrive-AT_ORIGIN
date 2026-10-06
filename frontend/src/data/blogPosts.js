export const blogPosts = [
  {
    slug: "what-is-a-meta-human",
    title: "What does “meta-human” actually mean?",
    date: "2026-09-12",
    readTime: "4 min read",
    excerpt: "There is a part of you that circumstance never manufactured. Metaphysics is the study of it.",
    body: [
      "Most of what we call “me” was assembled: by family, by culture, by the things that happened and our decisions about them. It is real, and it is useful. But it is not the whole of you.",
      "The meta-human is the part that was here before the assembly began and remains after it is taken apart. It does not need to be fixed, improved or healed. It needs to be noticed.",
      "Metaphysics, as I practise it, is not an abstract discipline. It is the plain habit of asking: what in me is not a reaction? What is still here when the story pauses?",
      "This is demo content. Replace it with your own writing.",
    ],
  },
  {
    slug: "grief-without-stages",
    title: "Grief without stages",
    date: "2026-08-27",
    readTime: "5 min read",
    excerpt: "Loss does not follow a schedule, and you are not behind on it.",
    body: [
      "People arrive in grief carrying a quiet worry: that they are doing it wrong, or too slowly. Someone has handed them a list of stages, and they cannot find themselves on it.",
      "In session, the work is simpler. We keep company with what is actually present today — numbness, anger, relief, a sudden laugh — without asking it to be anything else.",
      "Grief is not a problem to be solved. It is love with nowhere to go, and it needs somewhere to be held.",
      "This is demo content. Replace it with your own writing.",
    ],
  },
  {
    slug: "four-movements-of-aao",
    title: "The four movements of Arrive at Origin",
    date: "2026-08-05",
    readTime: "6 min read",
    excerpt: "Clear the concept, observe, differentiate, arrive — one method, entered through many doors.",
    body: [
      "AAO is not a technique to master. It is a direction of travel, and it has four movements that repeat throughout a life.",
      "First, clear the concept: notice the idea you are standing inside. Second, observe: watch without recruiting a response. Third, differentiate: separate what is yours from what was handed to you. Fourth, arrive: rest in the position that remains.",
      "You do not complete the movements once. You return to them, each time a little less dependent on anyone else's reading of your life.",
      "This is demo content. Replace it with your own writing.",
    ],
  },
];

export const formatPostDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
