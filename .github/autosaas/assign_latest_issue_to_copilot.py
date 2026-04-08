#!/usr/bin/env python3
"""
Assign the most recently created open issue to GitHub Copilot.
"""

import os

import requests

REPO = os.environ["REPO"]
GH_TOKEN = os.environ["GH_TOKEN"]
API_BASE = "https://api.github.com"

HEADERS = {
    "Authorization": f"Bearer {GH_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


def get_latest_issue() -> dict:
    url = f"{API_BASE}/repos/{REPO}/issues"
    params = {
        "state": "open",
        "labels": "autosaas",
        "sort": "created",
        "direction": "desc",
        "per_page": 1,
    }
    response = requests.get(url, headers=HEADERS, params=params, timeout=30)
    response.raise_for_status()
    issues = response.json()
    if not issues:
        raise RuntimeError("No open autosaas issues found in the repository.")
    return issues[0]


def assign_to_copilot(issue_number: int) -> None:
    url = f"{API_BASE}/repos/{REPO}/issues/{issue_number}/assignees"
    payload = {"assignees": ["copilot"]}
    response = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    response.raise_for_status()


def main() -> None:
    issue = get_latest_issue()
    issue_number = issue["number"]
    assign_to_copilot(issue_number)
    print(f"✅ Issue #{issue_number} assigned to Copilot — {issue['html_url']}")


if __name__ == "__main__":
    main()
