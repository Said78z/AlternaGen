"""Pytest configuration and shared fixtures for AlternaGen tests."""

import pytest

from alternagen.job_matching import CandidateProfile, JobOffer


@pytest.fixture
def sample_candidate() -> CandidateProfile:
    """Return a sample candidate profile for use in tests."""
    return CandidateProfile(
        name="Alice Dupont",
        skills=["Python", "React", "SQL"],
        preferred_locations=["Paris", "Lyon"],
    )


@pytest.fixture
def sample_offers() -> list[JobOffer]:
    """Return a list of sample job offers for use in tests."""
    return [
        JobOffer(
            title="Développeur Full-Stack",
            company="TechCorp",
            location="Paris",
            skills=["Python", "React", "Docker"],
        ),
        JobOffer(
            title="Data Analyst",
            company="DataInc",
            location="Bordeaux",
            skills=["SQL", "Python", "Tableau"],
        ),
        JobOffer(
            title="DevOps Engineer",
            company="CloudSoft",
            location="Lyon",
            skills=["Kubernetes", "Docker", "Terraform"],
        ),
    ]
