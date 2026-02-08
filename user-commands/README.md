![User Commands](assets/logo.png)

# User Commands Plugin for Lumia Stream

Let your community create and share custom chat commands! Give viewers the power to add their own commands that anyone in chat can use.

## Installation

1. Download the latest `.lumiaplugin` file from [Releases](https://github.com/chrisle/lumia-stream/releases)
2. In Lumia Stream, go to Plugins and install the plugin
3. Follow the setup instructions in the plugin's Settings tab

## Usage

| Command | Description |
|---------|-------------|
| `!command add <name> <response>` | Create a command |
| `!command edit <name> <response>` | Edit a command |
| `!command delete <name>` | Delete a command |
| `!command list` | List all commands |

### Supported Variables

Use these in your command responses:

- `{displayname}` - Display name of the user who triggered the command
- `{message}` - Arguments passed to the command

### Example

```
TRIODEOfficial: !command add hug @{displayname} hugs @{message}!
LumiaStreamBot: Command "!hug" has been created.
Lexie: !hug @TRIODEOfficial
LumiaStreamBot: @Lexie hugs @TRIODEOfficial!
```

## Development

```bash
npm install
npm run package
```

## License

MIT
