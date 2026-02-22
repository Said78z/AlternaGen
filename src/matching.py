"""
Matching service for calculating match scores between user profiles and job offers.

Scores are computed using three heuristic components:
- Skills overlap  (40%)
- Location match  (30%)
- Seniority match (30%)
"""

from __future__ import annotations


def calculate_skills_score(user_skills: list[str], job_requirements: str | None) -> int:
    """Return skills overlap score between 0 and 100.

    Args:
        user_skills: List of skills the candidate has.
        job_requirements: Free-text description of the job requirements.

    Returns:
        Integer score 0-100 representing the percentage of user skills found
        in the job requirements.  Returns 0 when either argument is falsy.
    """
    if not job_requirements or not user_skills:
        return 0

    req_lower = job_requirements.lower()
    matched = [skill for skill in user_skills if skill.lower() in req_lower]
    return round(len(matched) / len(user_skills) * 100)


def calculate_location_score(
    preferred_locations: list[str], job_location: str | None
) -> int:
    """Return location match score between 0 and 100.

    Returns 50 (neutral) when location data is unavailable on either side.

    Args:
        preferred_locations: Candidate's preferred work locations.
        job_location: Location string attached to the job offer.

    Returns:
        100 if any preferred location appears in the job location string,
        0 if none match, or 50 when data is missing.
    """
    if not job_location or not preferred_locations:
        return 50

    job_loc = job_location.lower()
    has_match = any(loc.lower() in job_loc for loc in preferred_locations)
    return 100 if has_match else 0


def calculate_seniority_score(
    education_level: str | None, job_title: str | None
) -> int:
    """Return seniority match score between 0 and 100.

    Uses simple keyword heuristics:
    - Bac+3/Bac+4 → junior level; Bac+5/Master → senior level.
    - Job titles containing *junior/alternance/stage* → junior role;
      *senior/manager/lead* → senior role.

    Returns 50 (neutral) when either argument is falsy or no keyword matches.

    Args:
        education_level: Candidate's highest qualification (e.g. "Bac+3").
        job_title: Title of the job offer.

    Returns:
        100 for a good match, 30 for a mismatch, 50 when undecided.
    """
    if not education_level or not job_title:
        return 50

    title_lower = job_title.lower()
    level_lower = education_level.lower()

    is_junior_role = any(kw in title_lower for kw in ("junior", "alternance", "stage"))
    is_senior_role = any(kw in title_lower for kw in ("senior", "manager", "lead"))

    is_junior_level = any(kw in level_lower for kw in ("bac+3", "bac+4"))
    is_senior_level = any(kw in level_lower for kw in ("bac+5", "master"))

    if (is_junior_role and is_junior_level) or (is_senior_role and is_senior_level):
        return 100
    if (is_junior_role and is_senior_level) or (is_senior_role and is_junior_level):
        return 30
    return 50


def calculate_match_score(
    user_skills: list[str],
    preferred_locations: list[str],
    education_level: str | None,
    job_requirements: str | None,
    job_location: str | None,
    job_title: str | None,
) -> dict:
    """Return a weighted match score and its component breakdown.

    Weights:
        - skills_score   × 0.40
        - location_score × 0.30
        - seniority_score × 0.30

    Args:
        user_skills: Skills the candidate has.
        preferred_locations: Candidate's preferred work locations.
        education_level: Candidate's qualification level.
        job_requirements: Free-text job description / requirements.
        job_location: Location of the job.
        job_title: Title of the job, or None if unavailable.

    Returns:
        Dictionary with keys ``score``, ``skills_score``, ``location_score``,
        and ``seniority_score``.
    """
    skills_score = calculate_skills_score(user_skills, job_requirements)
    location_score = calculate_location_score(preferred_locations, job_location)
    seniority_score = calculate_seniority_score(education_level, job_title)

    final_score = round(skills_score * 0.4 + location_score * 0.3 + seniority_score * 0.3)

    return {
        "score": final_score,
        "skills_score": skills_score,
        "location_score": location_score,
        "seniority_score": seniority_score,
    }
