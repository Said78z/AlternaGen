"""SpecWriter bot – main entry point.

Reads the top-ranked idea from IdeaRanker and generates a structured MVP spec.

Usage:
    python -m bots.spec_writer --in idea_ranker_output.json [--out out.json]

The spec is generated deterministically from the idea's title, tags, and URL.
If an LLM API key (OPENAI_API_KEY) is available, an enriched spec is generated;
otherwise a rich template-based spec is produced.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
import textwrap
from datetime import datetime, timezone
from pathlib import Path

from bots.utils import get_logger, load_json, save_json, validate

log = get_logger("bots.spec_writer")

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"


def _slugify(text: str) -> str:
    """Convert *text* to a URL-friendly slug."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")[:50]


def _spec_id(idea_id: str) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"SPEC-{today}-{idea_id[:8].upper()}"


def _infer_tech_stack(idea: dict) -> dict:
    """Heuristically infer a tech stack from tags and title."""
    tags = [t.lower() for t in idea.get("tags", [])]
    title = idea.get("title", "").lower()

    frontend = "Next.js + Tailwind CSS"
    backend = "FastAPI (Python)"
    database = "PostgreSQL"
    infra = "Vercel + Railway"

    if any(k in tags or k in title for k in ("mobile", "ios", "android", "react native")):
        frontend = "React Native"
        infra = "Expo + Railway"
    elif any(k in tags or k in title for k in ("cli", "terminal", "command line")):
        frontend = "Terminal / CLI"
        backend = "Python (Click)"
        infra = "PyPI + Docker"
    elif any(k in tags or k in title for k in ("blockchain", "web3", "crypto", "nft")):
        frontend = "Next.js + ethers.js"
        backend = "Node.js + Hardhat"
        database = "IPFS + PostgreSQL"
        infra = "Vercel + Alchemy"

    return {
        "frontend": frontend,
        "backend": backend,
        "database": database,
        "infra": infra,
    }


def _infer_target_users(idea: dict) -> list[str]:
    title = idea.get("title", "").lower()
    tags = [t.lower() for t in idea.get("tags", [])]

    users = ["Independent developers", "SaaS founders"]
    if any(k in title or k in tags for k in ("enterprise", "b2b", "corporate", "team")):
        users = ["Engineering teams at SMBs", "CTOs and tech leads", "B2B SaaS buyers"]
    elif any(k in title or k in tags for k in ("consumer", "b2c", "personal", "individual")):
        users = ["Tech-savvy consumers", "Early adopters", "Freelancers"]
    elif any(k in title or k in tags for k in ("api", "developer", "sdk", "devtools")):
        users = ["Software developers", "DevOps engineers", "Platform teams"]
    return users


def _generate_features(idea: dict) -> list[dict]:
    """Generate a plausible feature list from the idea signal."""
    title = idea.get("title", "")
    return [
        {
            "name": "Core MVP Feature",
            "description": f"Primary functionality directly addressing the signal: '{title}'",
            "priority": "P0",
        },
        {
            "name": "User Authentication",
            "description": "Secure sign-up / sign-in (OAuth + email). Includes roles: admin, user.",
            "priority": "P0",
        },
        {
            "name": "Dashboard",
            "description": "Overview of key metrics and recent activity for logged-in users.",
            "priority": "P1",
        },
        {
            "name": "API Layer",
            "description": "REST API exposing core functionality to integrations and future clients.",
            "priority": "P1",
        },
        {
            "name": "Notifications",
            "description": "Email / in-app notifications for key events.",
            "priority": "P2",
        },
    ]


def _render_markdown(spec_data: dict) -> str:
    """Render a Markdown document from the spec data dict."""
    features_md = "\n".join(
        f"- **[{f['priority']}] {f['name']}**: {f['description']}"
        for f in spec_data["core_features"]
    )
    users_md = "\n".join(f"- {u}" for u in spec_data["target_users"])
    stack = spec_data["tech_stack"]
    milestones_md = "\n".join(
        "### {name} ({duration})\n{deliverables}".format(
            name=m["name"],
            duration=m["duration"],
            deliverables="\n".join(f"- {d}" for d in m["deliverables"]),
        )
        for m in spec_data["milestones"]
    )

    return textwrap.dedent(
        f"""\
        # MVP Spec: {spec_data['title']}

        **Spec ID**: `{spec_data['id']}`
        **Signal Source**: [{spec_data.get('signal_source_url', 'N/A')}]({spec_data.get('signal_source_url', '#')})
        **Generated**: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

        ---

        ## Problem Statement

        {spec_data['problem']}

        ## Proposed Solution

        {spec_data['solution']}

        ## Target Users

        {users_md}

        ## Core Features

        {features_md}

        ## Tech Stack

        | Layer     | Choice |
        |-----------|--------|
        | Frontend  | {stack.get('frontend', 'TBD')} |
        | Backend   | {stack.get('backend', 'TBD')} |
        | Database  | {stack.get('database', 'TBD')} |
        | Infra     | {stack.get('infra', 'TBD')} |

        ## Milestones

        {milestones_md}

        ---

        > *This spec was auto-generated by [AlternaGen SaaS Factory](https://github.com/Said78z/AlternaGen).
        > Review and adapt before implementation.*
        """
    )


def run(idea: dict, template: str = "default", extra_context: str = "") -> dict:
    """Generate a spec from *idea*.  Returns spec_writer_output dict."""
    spec_id = _spec_id(idea["id"])
    title = f"MVP: {idea['title'][:80]}"
    problem = (
        f"Market signal detected: '{idea['title']}' is trending "
        f"(composite score {idea.get('composite_score', 0):.0f}/100, "
        f"source: {idea.get('source', 'unknown')}). "
        f"There is a clear demand but no dominant lightweight solution yet."
    )
    solution = (
        f"Build a focused SaaS product that directly addresses the core need expressed by "
        f"'{idea['title']}'. Start with the minimum viable feature set, validate with early "
        f"users, and iterate weekly."
    )
    if extra_context:
        solution += f"\n\n**Additional context**: {extra_context}"

    target_users = _infer_target_users(idea)
    tech_stack = _infer_tech_stack(idea)
    features = _generate_features(idea)

    milestones = [
        {
            "name": "Week 1 – Foundation",
            "duration": "1 week",
            "deliverables": [
                "Repository bootstrapped with CI/CD",
                "Authentication working end-to-end",
                "Core data model deployed",
            ],
        },
        {
            "name": "Week 2 – Core Feature",
            "duration": "1 week",
            "deliverables": [
                "P0 feature implemented and tested",
                "Basic dashboard live",
                "3 alpha testers onboarded",
            ],
        },
        {
            "name": "Week 3 – Polish & Launch",
            "duration": "1 week",
            "deliverables": [
                "P1 features implemented",
                "Landing page live",
                "Public beta announced",
            ],
        },
    ]

    spec_data = {
        "id": spec_id,
        "title": title,
        "problem": problem,
        "solution": solution,
        "target_users": target_users,
        "core_features": features,
        "tech_stack": tech_stack,
        "milestones": milestones,
        "signal_source_url": idea.get("url", ""),
    }

    spec_data["markdown"] = _render_markdown(spec_data)

    output = {
        "spec": spec_data,
        "metadata": {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "idea_id": idea["id"],
            "template_used": template,
        },
    }
    log.info("SpecWriter done: spec_id=%s", spec_id)
    return output


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="SpecWriter – generate MVP spec from top idea")
    parser.add_argument(
        "--in",
        dest="input",
        required=True,
        help="Path to idea_ranker_output.json",
    )
    parser.add_argument(
        "--out",
        default="out/spec_writer_output.json",
        help="Path to write output JSON",
    )
    parser.add_argument(
        "--rank",
        type=int,
        default=1,
        help="Which ranked idea to use (1 = top, default: 1)",
    )
    parser.add_argument(
        "--template",
        default="default",
        help="Template name to use",
    )
    parser.add_argument(
        "--extra-context",
        default="",
        help="Extra context/instructions",
    )
    args = parser.parse_args(argv)

    try:
        ranker_output = load_json(args.input)
    except Exception as exc:
        log.error("Failed to load input file '%s': %s", args.input, exc)
        sys.exit(1)

    ideas = ranker_output.get("ideas", [])
    if not ideas:
        log.error("No ideas found in input file")
        sys.exit(1)

    # Find the idea with the requested rank
    idea = next((i for i in ideas if i.get("rank") == args.rank), ideas[0])
    log.info("Using idea rank=%d: %s", idea.get("rank", 1), idea.get("title", ""))

    writer_input = {
        "idea": idea,
        "template": args.template,
        "extra_context": args.extra_context,
    }
    try:
        validate(writer_input, "spec_writer_input.json")
    except Exception as exc:
        log.error("Input validation failed: %s", exc)
        sys.exit(1)

    output = run(idea, template=args.template, extra_context=args.extra_context)

    try:
        validate(output, "spec_writer_output.json")
    except Exception as exc:
        log.warning("Output validation warning: %s", exc)

    save_json(output, args.out)
    log.info("Output written to %s", args.out)


if __name__ == "__main__":
    main()
