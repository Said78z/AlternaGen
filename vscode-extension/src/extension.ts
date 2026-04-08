import * as vscode from 'vscode';

/** Shape of a saved job offer. */
interface JobOffer {
  title: string;
  company: string;
  description: string;
  url: string;
  location: string;
  date: string;
}

/**
 * Attempt to extract job details from the active text editor selection or
 * the full document text (first 500 chars used as description).
 */
function extractFromEditor(): JobOffer | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  const selection = editor.selection;
  const text = selection.isEmpty
    ? editor.document.getText()
    : editor.document.getText(selection);

  // Best-effort heuristics — identical philosophy to the browser content script.
  const titleMatch = text.match(/(?:^|\n)(.*(?:alternance|apprenticeship|stage|intern)[^\n]*)/i);
  const companyMatch = text.match(/(?:entreprise|company|société)\s*[:\-–]?\s*([^\n]+)/i);
  const locationMatch = text.match(/(?:lieu|location|ville|city)\s*[:\-–]?\s*([^\n]+)/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Unknown title',
    company: companyMatch ? companyMatch[1].trim() : 'Unknown company',
    description: text.substring(0, 500),
    url: editor.document.uri.toString(),
    location: locationMatch ? locationMatch[1].trim() : 'Unknown',
    date: new Date().toISOString(),
  };
}

/** Send job data to the configured AlternaGen API. */
async function postJobToApi(jobData: JobOffer, apiUrl: string): Promise<void> {
  // Use the built-in Node.js https/http module so the extension has no extra
  // runtime dependencies (mirrors the fetch() call in the Chrome background.js).
  const { request } = apiUrl.startsWith('https') ? await import('https') : await import('http');

  return new Promise((resolve, reject) => {
    const body = JSON.stringify(jobData);
    const url = new URL(apiUrl);

    const req = request(
      {
        hostname: url.hostname,
        port: url.port || (apiUrl.startsWith('https') ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Server error: ${res.statusCode}`));
          return;
        }
        resolve();
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Extension activation
// ---------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext): void {
  // In-memory list of saved jobs (persisted via globalState).
  const savedJobs: JobOffer[] = context.globalState.get<JobOffer[]>('savedJobs', []);

  // ── Command: Save Job Offer ────────────────────────────────────────────────
  const saveJobCmd = vscode.commands.registerCommand('alternagen.saveJob', async () => {
    const config = vscode.workspace.getConfiguration('alternagen');
    const apiUrl: string = config.get('apiUrl', 'http://localhost:3000/api/extension/save-job');
    const autoExtract: boolean = config.get('autoExtract', true);

    let jobData: JobOffer | null = null;

    if (autoExtract) {
      jobData = extractFromEditor();
    }

    if (!jobData) {
      // Fallback: ask the user for the minimum required information.
      const title = await vscode.window.showInputBox({ prompt: 'Job title', placeHolder: 'e.g. Développeur Alternance React' });
      if (!title) { return; }

      const company = await vscode.window.showInputBox({ prompt: 'Company name' });
      if (!company) { return; }

      const url = await vscode.window.showInputBox({ prompt: 'Job offer URL' });

      jobData = {
        title,
        company,
        description: '',
        url: url ?? '',
        location: 'Unknown',
        date: new Date().toISOString(),
      };
    } else {
      // Let the user confirm / refine the extracted title.
      const confirmed = await vscode.window.showInputBox({
        prompt: 'Confirm or edit the job title',
        value: jobData.title,
      });
      if (!confirmed) { return; }
      jobData.title = confirmed;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'AlternaGen: Sending to API…', cancellable: false },
      async () => {
        try {
          await postJobToApi(jobData!, apiUrl);
          savedJobs.push(jobData!);
          await context.globalState.update('savedJobs', savedJobs);
          vscode.window.showInformationMessage(`✅ Job saved: "${jobData!.title}"`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`AlternaGen: Failed to save job — ${msg}`);
        }
      }
    );
  });

  // ── Command: List Saved Jobs ───────────────────────────────────────────────
  const listJobsCmd = vscode.commands.registerCommand('alternagen.listJobs', async () => {
    if (savedJobs.length === 0) {
      vscode.window.showInformationMessage('AlternaGen: No jobs saved yet.');
      return;
    }

    const items = savedJobs.map((j, i) => ({
      label: `$(briefcase) ${j.title}`,
      description: j.company,
      detail: `${j.location}  •  ${new Date(j.date).toLocaleDateString()}`,
      index: i,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Your saved job offers',
      matchOnDescription: true,
      matchOnDetail: true,
    });

    if (picked) {
      const job = savedJobs[picked.index];
      vscode.env.openExternal(vscode.Uri.parse(job.url)).then(
        undefined,
        () => { /* ignore if URL is not openable (e.g. file: URI) */ }
      );
    }
  });

  // ── Command: Clear Saved Jobs ──────────────────────────────────────────────
  const clearJobsCmd = vscode.commands.registerCommand('alternagen.clearJobs', async () => {
    const answer = await vscode.window.showWarningMessage(
      'AlternaGen: Clear all saved jobs?',
      { modal: true },
      'Yes'
    );
    if (answer === 'Yes') {
      savedJobs.length = 0;
      await context.globalState.update('savedJobs', []);
      vscode.window.showInformationMessage('AlternaGen: All saved jobs cleared.');
    }
  });

  context.subscriptions.push(saveJobCmd, listJobsCmd, clearJobsCmd);
}

export function deactivate(): void {
  // Nothing to clean up.
}
