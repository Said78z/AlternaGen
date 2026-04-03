"""Shared pytest fixtures for the AlternaGen test suite."""

import pytest


# ---------------------------------------------------------------------------
# User profile fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def junior_profile() -> dict:
    """Candidate profile with Bac+3 education and beginner-friendly skills."""
    return {
        "skills": ["python", "react", "sql"],
        "preferred_locations": ["Paris", "Lyon"],
        "education_level": "Bac+3",
    }


@pytest.fixture
def senior_profile() -> dict:
    """Candidate profile with Master-level education and advanced skills."""
    return {
        "skills": ["java", "kubernetes", "aws"],
        "preferred_locations": ["Paris"],
        "education_level": "Master",
    }


@pytest.fixture
def empty_profile() -> dict:
    """Profile with no skills or location preferences."""
    return {
        "skills": [],
        "preferred_locations": [],
        "education_level": None,
    }


# ---------------------------------------------------------------------------
# Job offer fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def junior_job() -> dict:
    """A junior alternance job in Paris requiring Python and SQL."""
    return {
        "title": "Développeur Junior Alternance",
        "description": "We are looking for a Python developer with SQL skills.",
        "location": "Paris",
    }


@pytest.fixture
def senior_job() -> dict:
    """A senior engineering role in Lyon requiring cloud/Java expertise."""
    return {
        "title": "Senior Lead Engineer",
        "description": "AWS, Kubernetes, and Java expertise required.",
        "location": "Lyon",
    }


@pytest.fixture
def neutral_job() -> dict:
    """A generic engineering job with no strong seniority signal."""
    return {
        "title": "Software Engineer",
        "description": "Looking for a TypeScript developer.",
        "location": "Bordeaux",
    }
