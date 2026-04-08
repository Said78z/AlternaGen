"""Job matching utilities for AlternaGen."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class JobOffer:
    """Represents a job offer for an alternance position."""

    title: str
    company: str
    location: str
    skills: list[str] = field(default_factory=list)
    score: float = 0.0


@dataclass
class CandidateProfile:
    """Represents a candidate looking for an alternance."""

    name: str
    skills: list[str] = field(default_factory=list)
    preferred_locations: list[str] = field(default_factory=list)


def compute_skill_match(offer_skills: list[str], candidate_skills: list[str]) -> float:
    """Return the ratio of matching skills between an offer and a candidate."""
    if not offer_skills:
        return 0.0
    matched = {s.lower() for s in offer_skills} & {s.lower() for s in candidate_skills}
    return len(matched) / len(offer_skills)


def compute_location_match(offer_location: str, preferred_locations: list[str]) -> float:
    """Return 1.0 if the offer location matches a preferred location, else 0.0."""
    return 1.0 if offer_location.lower() in {loc.lower() for loc in preferred_locations} else 0.0


def score_job_offer(
    offer: JobOffer,
    candidate: CandidateProfile,
    skill_weight: float = 0.7,
    location_weight: float = 0.3,
) -> float:
    """Compute a relevance score for a job offer given a candidate profile."""
    skill_score = compute_skill_match(offer.skills, candidate.skills)
    location_score = compute_location_match(offer.location, candidate.preferred_locations)
    return skill_weight * skill_score + location_weight * location_score


def rank_job_offers(
    offers: list[JobOffer], candidate: CandidateProfile
) -> list[JobOffer]:
    """Return job offers sorted by relevance score (descending)."""
    scored = [
        JobOffer(
            title=offer.title,
            company=offer.company,
            location=offer.location,
            skills=offer.skills,
            score=score_job_offer(offer, candidate),
        )
        for offer in offers
    ]
    return sorted(scored, key=lambda o: o.score, reverse=True)


def filter_offers_by_score(
    offers: list[JobOffer], min_score: float = 0.5
) -> list[JobOffer]:
    """Return only the offers whose score is at or above *min_score*."""
    return [offer for offer in offers if offer.score >= min_score]


def format_offer_summary(offer: JobOffer) -> str:
    """Return a short human-readable summary of a job offer."""
    skills_str = ", ".join(offer.skills) if offer.skills else "N/A"
    return (
        f"{offer.title} @ {offer.company} ({offer.location}) "
        f"— skills: {skills_str} — score: {offer.score:.2f}"
    )


def normalize_skill_list(skills: list[str]) -> list[str]:
    """Return a deduplicated, lowercased and sorted list of skills."""
    return sorted({skill.strip().lower() for skill in skills if skill.strip()})


def parse_location(raw: str) -> str | None:
    """Extract a clean location string, or return None if the input is empty."""
    cleaned = raw.strip()
    return cleaned if cleaned else None
