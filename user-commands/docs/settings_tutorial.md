## TRIODE's User Commands
---
Let your community create and share custom chat commands! Give viewers the power to add their own commands that anyone in chat can use.

**Example:**
```
TRIODEOfficial: !command add hug @{{displayname}} jumps into @{{message}}'s arms and gives a big hug!
LumiaStreamBot: @TRIODEOfficial Command "!hug" has been created.
Lexie: !hug @TRIODEOfficial
LumiaStreamBot: @Lexie jumps into @TRIODEOfficial's arms and gives a big hug!
```

---
### User Commands Plugin
This plugin lets viewers create their own chat commands.

**Permissions**
Configure permissions in Lumia Stream (for example, separate rules per user level).

**Usage:**
- `!command add <name> <response>` - Create a command
- `!command edit <name> <response>` - Edit a command
- `!command delete <name>` - Delete a command
- `!command list` - List all commands

**Supported Variables:**
- `{{displayname}}` - Display name of user
- `{{message}}` - Arguments passed to the command
