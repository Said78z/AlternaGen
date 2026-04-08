import os
import textwrap
import datetime
import requests
from slugify import slugify
import subprocess

REPO = os.environ["REPO"]
# Limite: 1 issue/jour pour éviter le mode "infini" qui te met le feu + coûts
MAX_PER_RUN = 1

# Sources simples et publiques via API (pas de scraping)
HN_API = "https://hn.algolia.com/api/v1/search_by_date?tags=story&query=pain%20point%20saas%20b2b%20workflow&hitsPerPage=30"


def pick_problem():
    r = requests.get(HN_API, timeout=30)
    r.raise_for_status()
    hits = r.json().get("hits", [])
    # Heuristique ultra simple: on prend un titre "problème" + on garde l'URL
    for h in hits:
        title = (h.get("title") or "").strip()
        url = h.get("url") or f"https://news.ycombinator.com/item?id={h.get('objectID')}"
        if len(title) > 25:
            return title, url
    # fallback
    return "Teams waste time collecting requirements across emails/DMs", "https://news.ycombinator.com/"


def build_issue(title, source_url):
    today = datetime.date.today().isoformat()
    saas_name = "WBL-" + slugify(title)[:28].upper()

    body = f"""
# AutoSaaS MVP Task ({today})

## Source / Signal
- {source_url}

## Problem (hypothesis)
{title}

## Proposed SaaS (white-label ready)
**Name:** {saas_name}
**ICP:** Small agencies / freelancers (white-label to clients)
**Core job:** Turn messy inbound requests (DM/email/forms) into a structured brief + quote + onboarding.

## MVP scope (must-have)
1. Auth (email magic link)
2. Workspace + client records
3. "Brief Builder": questionnaire → structured brief
4. "Proposal generator": brief → proposal template (editable)
5. Stripe checkout link for a fixed-price package (stub if needed)
6. Admin dashboard (briefs + status)
7. Email notifications (brief submitted, proposal sent)

## Non-goals (not in MVP)
- Multi-language, advanced analytics, integrations beyond email/stripe

## Acceptance criteria
- User can sign up, create a client, generate a brief, generate a proposal, and send it by email.
- App runs locally + CI passes basic tests.
- README includes deploy steps (Vercel/Supabase) and env vars.

## Tech constraints
- Next.js App Router + Tailwind
- Supabase (Auth + Postgres)
- Prisma
- Stripe (test mode)
- Resend (or stub)
- Basic tests + lint

## Deliverables
- Working MVP in a PR
- DB schema + migrations
- Minimal landing page + pricing section (3 plans)
"""
    return saas_name, textwrap.dedent(body).strip()


def create_issue(title, body):
    # gh CLI is preinstalled on github runners
    tmp = "/tmp/issue_body.md"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(body)
    # Create issue and label it so you can track
    subprocess.check_call(
        [
            "gh", "issue", "create",
            "--repo", REPO,
            "--title", title,
            "--body-file", tmp,
            "--label", "autosaas,mvp",
        ]
    )


if __name__ == "__main__":
    prob_title, src = pick_problem()
    saas_name, body = build_issue(prob_title, src)
    issue_title = f"[AutoSaaS] Build MVP: {saas_name}"
    create_issue(issue_title, body)
    print("Created issue:", issue_title)
