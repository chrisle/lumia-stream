# User Commands Plugin for Lumia Stream

Allow Twitch viewers to create, edit, and delete their own chat commands.

## Features

- **Privileged Access**: Only VIPs, Tier 2/3 subscribers, and moderators can
  create commands
- **Ownership Control**: Users can only edit/delete their own commands (mods can
  manage all)
- **Variable Support**: Use dynamic variables like `{displayName}` in responses
- **Persistent Storage**: Commands are stored in Lumia variables

## Installation

1. Install dependencies and build the plugin:
   ```bash
   npm install
   npm run build
   npm run package
   ```

   Or in one step:
   ```bash
   npm install && npm run package
   ```

2. Install the `dist/user_commands.lumiaplugin` file in Lumia Stream

3. Configure Chat Match rules (see below)

## Usage

### Creating Commands

```
!command add <name> <response>
```

Example:
```
!command add greet Hello {displayName}! Welcome to the stream!
```

### Editing Commands

```
!command edit <name> <new response>
```

Example:
```
!command edit greet Hey {displayName}! Great to see you!
```

### Deleting Commands

```
!command delete <name>
```

Example:
```
!command delete greet
```

### Listing Commands

```
!command list
```

## Supported Variables

Use these variables in command responses:

| Variable        | Description                              |
| --------------- | ---------------------------------------- |
| `{displayName}` | Display name of user running the command |
| `{username}`    | Username of user running the command     |
| `{channel}`     | Channel name                             |
| `{game}`        | Current game being played                |
| `{title}`       | Current stream title                     |

## Permissions

Permissions are enforced by Lumia Stream (for example via separate rules per
user level). The plugin itself assumes that anyone who can trigger the action
is allowed to manage their own commands.

## Chat Match Configuration

Configure these Chat Match rules in Lumia Stream:

### Rule 1: Manage Commands

- **Match**: `!command`
- **Action**: Trigger plugin action `manage_command`
- **Parameters**:
  - `username`: `{username}`
  - `displayName`: `{displayName}`
  - `message`: `{message}` (everything after `!command `)

### Rule 2: Execute Custom Commands

For each custom command you want to trigger, or use a wildcard pattern:

- **Match**: `!{commandName}` or specific commands
- **Action**: Trigger plugin action `execute_command`
- **Parameters**:
  - `commandName`: The command name (without `!`)
  - `username`: `{username}`
  - `displayName`: `{displayName}`
  - `channel`: `{channel}`
  - `game`: `{game}`
  - `title`: `{title}`

## Reserved Command Names

The following names cannot be used for custom commands:

- `command`, `commands`
- `help`
- `add`, `edit`, `delete`, `list`

## Storage

Commands are stored as JSON in the Lumia variable `triode-user-commands`:

```json
{
  "greet": {
    "response": "Hello {displayName}!",
    "creator": "username123",
    "createdAt": "2025-02-07T12:00:00Z",
    "updatedAt": "2025-02-07T12:00:00Z"
  }
}
```

## License

MIT
