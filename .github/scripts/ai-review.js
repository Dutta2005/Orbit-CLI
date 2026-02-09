const axios = require("axios");
const fs = require("fs");

const GITHUB_API = "https://api.github.com";
const repo = process.env.GITHUB_REPOSITORY;
const prNumber = process.env.GITHUB_REF.split("/")[2];
const token = process.env.GITHUB_TOKEN;

async function getPRDiff() {
  const res = await axios.get(
    `${GITHUB_API}/repos/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );
  return res.data;
}

async function aiReview(diff) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are a senior software engineer performing an AI-assisted GitHub PR review.

Your goals:
- Be concise and high-signal
- Ignore trivial formatting changes
- Focus on correctness, security, performance, and maintainability
- Assume this is part of a large production repository

Rules:
- Do NOT restate the diff
- Do NOT comment on unchanged code
- Skip files that only contain comments, formatting, or renames
- If the diff is too large, review only the most impactful changes

Severity levels:
- 🔴 Critical (must fix)
- 🟡 Important (should fix)
- 🟢 Optional (nice to have)

Output must be VALID Markdown and follow the exact structure below.
`
        },
        {
          role: "user",
          content: `
Review the following GitHub Pull Request diff.

Respond using this exact format:

## 🔍 Summary
<2–3 sentence high-level assessment>

## 🔴 Critical Issues
- Bullet list (or "None")

## 🟡 Important Improvements
- Bullet list (or "None")

## 🟢 Optional Suggestions
- Bullet list (or "None")

## ✅ Overall Verdict
One of: Approve / Request Changes / Comment Only

PR Diff:
\`\`\`diff
${diff}
\`\`\`
`
        }
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  );

  return res.data.choices[0].message.content;
}


async function commentPR(comment) {
  await axios.post(
    `${GITHUB_API}/repos/${repo}/issues/${prNumber}/comments`,
    { body: `🤖 **AI Code Review**\n\n${comment}` },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

(async () => {
  const diff = await getPRDiff();
  const review = await aiReview(diff);
  await commentPR(review);
})();
