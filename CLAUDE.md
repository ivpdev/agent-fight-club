# Claude Instructions

## Architecture Decision Records (ADRs)

When we make design decisions during brainstorming or implementation:
- Document them as Architecture Decision Records in `docs/adr/`
- Use format: `NNN-title-in-kebab-case.md` (e.g., `001-use-typescript.md`)
- Include: Context, Decision, Consequences
- Keep ADRs concise and focused on a single decision
- Create the `docs/adr/` directory if it doesn't exist

## Discussion vs Implementation

**IMPORTANT:** When the user shares ideas or asks "what do you think?", respond with analysis and discussion FIRST, not code changes.

### Signs the user wants discussion, not implementation:
- "I think it make sense to..."
- "How about we..."
- "What do you think about..."
- "Should we..."
- Asking for opinion or architectural advice

### What to do:
1. **Acknowledge** the idea
2. **Analyze** pros and cons
3. **Discuss** alternatives and tradeoffs
4. **Ask** if they want to proceed with implementation

### What NOT to do:
- Don't immediately start writing code
- Don't create tasks or update task status
- Don't make file changes

### When to implement:
- User explicitly says "let's do it", "implement this", "go ahead"
- User asks you to "write", "create", "update" specific code
- Clear action-oriented request with no ambiguity

**Example:**
```
User: "I think it make sense to refactor X to use Y instead"

❌ Wrong: [Immediately creates tasks and starts editing files]

✅ Right: "That's a great architectural insight! Let me analyze the pros and cons:
- Pros: ...
- Cons: ...
- Implementation complexity: ...
Would you like me to proceed with this refactoring?"
```

## TODOs in Specifications

**IMPORTANT:** Specification files (SPEC.md, etc.) may contain TODO sections or comments.

- TODOs in specs are for the **user**, not for Claude
- TODOs indicate future extensions the user plans to write
- **IGNORE all TODOs** when implementing specifications
- Only implement what is explicitly specified, not what is marked as TODO
- Do not mention or ask about TODOs unless specifically relevant to current work