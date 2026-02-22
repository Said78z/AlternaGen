# AlternaGen Hunter – VS Code Extension

A VS Code extension that lets you save apprenticeship / alternance job offers to your AlternaGen account without leaving the editor.

## Features

| Command | Keybinding | Description |
|---------|-----------|-------------|
| **AlternaGen: Save Job Offer** | `Ctrl+Alt+S` / `⌘⌥S` | Extracts job info from the active editor (or prompts you) and posts it to the AlternaGen API |
| **AlternaGen: List Saved Jobs** | – | Shows a Quick Pick list of every saved offer; opens the URL on selection |
| **AlternaGen: Clear Saved Jobs** | – | Deletes all locally cached job entries |

A context-menu entry **AlternaGen: Save Job Offer** also appears when text is selected in the editor.

## Requirements

- VS Code ≥ 1.85.0
- A running AlternaGen API (local or remote). Default endpoint: `http://localhost:3000/api/extension/save-job`

## Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `alternagen.apiUrl` | `string` | `http://localhost:3000/api/extension/save-job` | API endpoint to post job offers to |
| `alternagen.autoExtract` | `boolean` | `true` | Auto-extract job details from the active editor content |

## Getting Started (Development)

```bash
# 1. Install dependencies
cd vscode-extension
npm install

# 2. Compile (one-shot)
npm run compile

# 3. Open the extension folder in VS Code, then press F5
#    → an Extension Development Host window launches with the extension active
code .
```

Press **F5** in VS Code to open the Extension Development Host.  
Use **Ctrl+Shift+P** → `AlternaGen: Save Job Offer` to test the command.

## Publishing

```bash
npm install -g @vscode/vsce
vsce package          # creates alternagen-hunter-x.y.z.vsix
vsce publish          # requires a Personal Access Token
```

## Changelog

### 0.1.0
- Initial release: Save, List and Clear commands, configurable API URL, auto-extract heuristics, context-menu entry, keybinding.
