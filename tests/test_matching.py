"""Unit tests for the matching service (src/matching.py).

Tests are grouped by function:
  - TestCalculateSkillsScore
  - TestCalculateLocationScore
  - TestCalculateSeniorityScore
  - TestCalculateMatchScore
"""

import pytest

from src.matching import (
    calculate_location_score,
    calculate_match_score,
    calculate_seniority_score,
    calculate_skills_score,
)


# ---------------------------------------------------------------------------
# calculate_skills_score
# ---------------------------------------------------------------------------


class TestCalculateSkillsScore:
    """Tests for the skills overlap scoring function."""

    def test_full_match_returns_100(self):
        """All user skills found in job requirements → score of 100."""
        skills = ["python", "sql"]
        requirements = "We need a Python expert with strong SQL skills."
        assert calculate_skills_score(skills, requirements) == 100

    def test_partial_match_returns_proportional_score(self):
        """Half the skills matched → score of 50."""
        skills = ["python", "java"]
        requirements = "Python experience is required."
        assert calculate_skills_score(skills, requirements) == 50

    def test_no_match_returns_0(self):
        """No user skills present in requirements → score of 0."""
        skills = ["python", "sql"]
        requirements = "Java and Kotlin proficiency required."
        assert calculate_skills_score(skills, requirements) == 0

    def test_none_requirements_returns_0(self):
        """None requirements → score of 0."""
        assert calculate_skills_score(["python"], None) == 0

    def test_empty_requirements_returns_0(self):
        """Empty string requirements → score of 0."""
        assert calculate_skills_score(["python"], "") == 0

    def test_empty_skills_returns_0(self):
        """Empty skills list → score of 0."""
        assert calculate_skills_score([], "Python required.") == 0

    def test_case_insensitive_matching(self):
        """Skill matching must be case-insensitive."""
        skills = ["Python", "SQL"]
        requirements = "python and sql required"
        assert calculate_skills_score(skills, requirements) == 100


# ---------------------------------------------------------------------------
# calculate_location_score
# ---------------------------------------------------------------------------


class TestCalculateLocationScore:
    """Tests for the location match scoring function."""

    def test_matching_location_returns_100(self):
        """Preferred location found in job location string → 100."""
        assert calculate_location_score(["Paris"], "Paris, France") == 100

    def test_no_matching_location_returns_0(self):
        """Preferred location not in job location string → 0."""
        assert calculate_location_score(["Lyon"], "Paris, France") == 0

    def test_none_job_location_returns_neutral(self):
        """Missing job location → neutral score of 50."""
        assert calculate_location_score(["Paris"], None) == 50

    def test_empty_preferred_locations_returns_neutral(self):
        """No preferred locations specified → neutral score of 50."""
        assert calculate_location_score([], "Paris") == 50

    def test_multiple_preferred_locations_any_match(self):
        """Returns 100 if any preferred location matches the job location."""
        assert calculate_location_score(["Lyon", "Paris"], "Paris, France") == 100

    def test_multiple_preferred_locations_none_match(self):
        """Returns 0 when none of the preferred locations match."""
        assert calculate_location_score(["Lyon", "Bordeaux"], "Paris, France") == 0

    def test_case_insensitive_matching(self):
        """Location matching must be case-insensitive."""
        assert calculate_location_score(["paris"], "Paris, France") == 100


# ---------------------------------------------------------------------------
# calculate_seniority_score
# ---------------------------------------------------------------------------


class TestCalculateSeniorityScore:
    """Tests for the seniority heuristic scoring function."""

    def test_junior_role_junior_level_returns_100(self):
        """Junior-level education + junior role → perfect seniority match."""
        assert calculate_seniority_score("Bac+3", "Développeur Junior Alternance") == 100

    def test_senior_role_senior_level_returns_100(self):
        """Senior-level education + senior role → perfect seniority match."""
        assert calculate_seniority_score("Master", "Senior Software Engineer") == 100

    def test_junior_level_senior_role_returns_30(self):
        """Bac+3 candidate applying for a senior role → mismatch score of 30."""
        assert calculate_seniority_score("Bac+3", "Senior Lead Engineer") == 30

    def test_senior_level_junior_role_returns_30(self):
        """Master candidate applying for a junior/stage role → mismatch score of 30."""
        assert calculate_seniority_score("Master", "Stage Développeur") == 30

    def test_none_education_returns_neutral(self):
        """Missing education level → neutral score of 50."""
        assert calculate_seniority_score(None, "Software Engineer") == 50

    def test_none_title_returns_neutral(self):
        """Missing job title → neutral score of 50."""
        assert calculate_seniority_score("Bac+3", None) == 50

    def test_neutral_role_returns_50(self):
        """A job title with no seniority keyword → neutral score of 50."""
        assert calculate_seniority_score("Bac+3", "Software Engineer") == 50

    def test_bac_plus_4_is_junior_level(self):
        """Bac+4 is treated as junior level."""
        assert calculate_seniority_score("Bac+4", "Junior Developer") == 100

    def test_bac_plus_5_is_senior_level(self):
        """Bac+5 is treated as senior level."""
        assert calculate_seniority_score("Bac+5", "Senior Engineer") == 100


# ---------------------------------------------------------------------------
# calculate_match_score
# ---------------------------------------------------------------------------


class TestCalculateMatchScore:
    """Tests for the overall weighted match score function."""

    def test_high_score_for_matching_profile_and_job(self, junior_profile, junior_job):
        """Junior profile + junior job in the same city → high overall score."""
        result = calculate_match_score(
            junior_profile["skills"],
            junior_profile["preferred_locations"],
            junior_profile["education_level"],
            junior_job["description"],
            junior_job["location"],
            junior_job["title"],
        )
        assert result["score"] >= 70

    def test_low_score_for_mismatched_profile_and_job(self, junior_profile, senior_job):
        """Junior profile + senior job → lower overall score."""
        result = calculate_match_score(
            junior_profile["skills"],
            junior_profile["preferred_locations"],
            junior_profile["education_level"],
            senior_job["description"],
            senior_job["location"],
            senior_job["title"],
        )
        assert result["score"] < 70

    def test_result_contains_component_scores(self, junior_profile, junior_job):
        """Result dict must include all three component scores."""
        result = calculate_match_score(
            junior_profile["skills"],
            junior_profile["preferred_locations"],
            junior_profile["education_level"],
            junior_job["description"],
            junior_job["location"],
            junior_job["title"],
        )
        assert "skills_score" in result
        assert "location_score" in result
        assert "seniority_score" in result

    def test_score_is_bounded_between_0_and_100(self, senior_profile, senior_job):
        """Overall score must always be within [0, 100]."""
        result = calculate_match_score(
            senior_profile["skills"],
            senior_profile["preferred_locations"],
            senior_profile["education_level"],
            senior_job["description"],
            senior_job["location"],
            senior_job["title"],
        )
        assert 0 <= result["score"] <= 100

    def test_empty_profile_returns_neutral_score(self, empty_profile, neutral_job):
        """A profile with no data should produce a neutral (non-zero) score."""
        result = calculate_match_score(
            empty_profile["skills"],
            empty_profile["preferred_locations"],
            empty_profile["education_level"],
            neutral_job["description"],
            neutral_job["location"],
            neutral_job["title"],
        )
        assert 0 <= result["score"] <= 100

    def test_none_job_title_handled_gracefully(self, junior_profile, junior_job):
        """None job_title should not raise and must return a valid score."""
        result = calculate_match_score(
            junior_profile["skills"],
            junior_profile["preferred_locations"],
            junior_profile["education_level"],
            junior_job["description"],
            junior_job["location"],
            None,
        )
        assert 0 <= result["score"] <= 100

    def test_weighted_formula(self):
        """Verify the weighted formula: 0.4*skills + 0.3*location + 0.3*seniority."""
        result = calculate_match_score(
            user_skills=["python"],
            preferred_locations=["Paris"],
            education_level="Bac+3",
            job_requirements="Python developer needed.",
            job_location="Paris",
            job_title="Junior Developer",
        )
        expected = round(100 * 0.4 + 100 * 0.3 + 100 * 0.3)
        assert result["score"] == expected
