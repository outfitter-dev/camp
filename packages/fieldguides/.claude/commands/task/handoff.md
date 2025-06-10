# Create Project Handoff

Create a new handoff document to capture significant changes, migrations, or
feature implementations.

## Instructions

1. **Generate timestamp**: Use the current time in format `YYYYMMDDhhmm`
2. **Create filename**: `docs/project/handoffs/YYYYMMDDhhmm-<title>.md` where
   `<title>` is a kebab-case descriptive title
3. **Use the template**: Follow the structure defined in
   @docs/project/handoffs/CLAUDE.md
4. **Check for existing handoffs**: Before creating, check if there's a recent
   related handoff to update instead
5. **If provided, look in ARGUMENTS below and use it to:**
   - Determine the handoff title/topic
   - Include any specific context or requirements mentioned
   - If no arguments provided, ask what the handoff should document

## Arguments

- $ARGUMENTS

## Key Steps

1. Check `docs/project/handoffs/` for recent related work
2. If updating existing handoff, open and append to it
3. If creating new handoff:
   - Generate proper filename with timestamp
   - Create file with template structure from @docs/project/handoffs/CLAUDE.md
   - Fill in known information
   - Leave placeholders for information to be added

## Example

If called with: `"conventions update"`

Would create: `docs/project/handoffs/202506031825-conventions-update.md`

## References

- Formatting guide: @docs/project/handoffs/CLAUDE.md
- Naming convention: @docs/project/handoffs/README.md
- Recent handoffs: Check the handoffs directory for examples
