# NotebookLM Clone

A small clone of Google NotebookLM. A user collects sources in one notebook, writes notes and chats with an AI about the sources.

## Language

**Notebook**:
The single workspace every user owns. It holds Sources, Notes and the chat.
_Avoid_: Project, workspace, board

**Source**:
A piece of material the user adds to the Notebook: an uploaded file, a website or YouTube link, or pasted text.
_Avoid_: Resource, document, file

**Note**:
A text document the user writes inside the Notebook.
_Avoid_: Memo, comment

**Chunk**:
A short passage of a Source's text, stored so the AI can find it by meaning.
_Avoid_: Segment, snippet, fragment

**Citation**:
A numbered pointer in a Chat answer to the Chunk it is based on.
_Avoid_: Reference, footnote

**Chat**:
The conversation in which the AI answers questions using the Sources.
_Avoid_: Assistant, thread
