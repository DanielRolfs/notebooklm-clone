# NotebookLM Clone

## Task:

Build a clone of NotebookLM (https://notebooklm.google.com).

The implementation, scope, and structure are up to you. The use of AI tools is strongly encouraged.
Also send us the GitHub repository link, the live deployment, and a Loom video of no more than 10 minutes so we can see how you went about it.
In the video, briefly explain your approach and exactly what you did. Test your clone live once.
Send us your finished result as a reply to this email. As soon as we’ve reviewed it, we’ll get back to you with the next steps.

## Procedure:

1. Test NotebookLM (10 min) (all screenshots)
2. Identify key features: (30 min)
   1. Google Account login
   2. Add resources
      1. Embed: Upload, web search, YouTube link, copied text, drag-and-drop (screenshots 1, 2).
      2. Remove: Play Books, Drive (Screenshots 1, 2)
   3. Create a note (button at the top left of the menu bar: Creates a “Notes” folder and a new note within it the first time; the new note opens on the right).
      1. Remove: Text styling features, Export to Docs (at the bottom of the 3-dot menu)
      2. Add: 3 dots on the left side of the note with “Remove” and “Rename,” and the “Remove” button on the right side of the note.
   4. After uploading files
      1. LLM response
3. Improve Initial Analysis (5 min)
4. Grill with Docs (Matt Pocock Skill)(30 min)
5. Build, review and deploy with AI agents: a manager session, parallel subagents in git worktrees, one pull request per feature tested on its Vercel preview (about 2 h 30 min, wall-clock)

## Basic AI Instructions:

For features I haven’t explicitly listed above, their icons should be grayed out and a tooltip should appear with the text “This was not part of the scope of the clone” (or something similar that sounds good and is short).
Keep planning documents brief so I can quickly skim through them to verify what you’re implementing.
Push micro-commits to topic-specific branches so I can review them.
Justify the complexity of the code; don’t overcomplicate the app, but of course make it enterprise-ready.

## Tech Stack:

- Next.js
- Claude API Key
- LangGraph
