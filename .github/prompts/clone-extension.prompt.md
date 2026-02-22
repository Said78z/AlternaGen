# Clone / Fork a VS Code Extension

> **Reusable agent-mode prompt.**  
> Fill in the placeholders `{{REPO_URL}}` and `{{NEW_EXTENSION_NAME}}` before running,  
> or let Copilot ask you for them at the start of the session.

---

## Goal

Copy an existing VS Code extension into a new workspace and make it run locally,  
following the four steps below.

---

## Step 1 — Gather information

Ask me for:

1. The source extension's **Git URL** (or local folder path): `{{REPO_URL}}`
2. The **new extension name** (slug, lower-kebab-case): `{{NEW_EXTENSION_NAME}}`
3. Whether I want **TypeScript** or JavaScript (default: TypeScript).

If the values are already filled in above, proceed without asking.

---

## Step 2 — Create the workspace

1. Create a new folder named `{{NEW_EXTENSION_NAME}}`.
2. Clone / copy the source extension into it.
3. Update **`package.json`** fields to make it a clean fork:
   - `name` → `{{NEW_EXTENSION_NAME}}`
   - `displayName` → a human-readable version of the name
   - `publisher` → prompt me if unknown
   - `repository.url` → prompt me or leave empty
   - `bugs.url` → derived from repository URL
   - `homepage` → derived from repository URL
   - Bump `version` to `0.1.0`

---

## Step 3 — Install, build, and fix

```bash
cd {{NEW_EXTENSION_NAME}}
npm install
npm run compile        # or npm run build
```

- Fix any TypeScript errors or missing configuration files that prevent compilation.
- If there is no `tsconfig.json`, create one targeting `ES2020 / commonjs`.
- If there is no `.vscode/launch.json`, create one with the standard
  `extensionHost` debug configuration so that **F5** works.
- If there is no `.vscode/tasks.json`, create a default `npm: watch` build task.

---

## Step 4 — Validate F5 launch

Confirm that pressing **F5** in VS Code will:

1. Run the `compile` / `watch` build task as a pre-launch step.
2. Open an **Extension Development Host** window with the extension loaded.
3. Allow the user to invoke the extension's commands via the Command Palette.

Produce a short checklist of every file you created or changed and the exact
commands the user needs to run.

---

## Checklist template (fill in after completing the steps)

- [ ] Cloned / copied source into `{{NEW_EXTENSION_NAME}}/`
- [ ] Updated `package.json` fields (name, displayName, publisher, repository, bugs, homepage)
- [ ] `npm install` succeeded
- [ ] `npm run compile` succeeded with no errors
- [ ] `.vscode/launch.json` present and targets the extension folder
- [ ] `.vscode/tasks.json` present with default build task
- [ ] F5 launches Extension Development Host successfully

### Commands to run

```bash
cd {{NEW_EXTENSION_NAME}}
npm install
npm run compile
# Then open VS Code in this folder and press F5
code .
```
