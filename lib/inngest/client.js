
// create connection to exicte operations on inngest

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "nextstep", // Unique app ID
  name: "NextStep",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
});