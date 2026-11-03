---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- For codebase or architecture questions, when `graphify-out/graph.json` exists:
  * **Primary (Isolated & Dynamic):** Run CLI `graphify query "<question>"`. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. CLI strictly operates on the local `./graphify-out/` of this workspace and will never cross-contaminate with other projects.
  * **MCP (Optional):** If using MCP tools, strictly target ServerName `graphify-expo` (`query_graph`, `shortest_path`, `get_node`). NEVER target servers from other projects (`graphify-platform`, `graphify-khoas`). Note: `query_graph` accepts parameter `{"question": "<text>"}` (or alias `{"query": "<text>"}`).
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
