"""Tests for job_matching utilities."""

import pytest

from alternagen.job_matching import (
    CandidateProfile,
    JobOffer,
    compute_location_match,
    compute_skill_match,
    filter_offers_by_score,
    format_offer_summary,
    normalize_skill_list,
    parse_location,
    rank_job_offers,
    score_job_offer,
)


class TestComputeSkillMatch:
    def test_full_match(self) -> None:
        assert compute_skill_match(["Python", "SQL"], ["Python", "SQL"]) == 1.0

    def test_partial_match(self) -> None:
        assert compute_skill_match(["Python", "SQL", "Docker"], ["Python", "SQL"]) == pytest.approx(2 / 3)

    def test_no_match(self) -> None:
        assert compute_skill_match(["Go", "Rust"], ["Python", "SQL"]) == 0.0

    def test_empty_offer_skills(self) -> None:
        assert compute_skill_match([], ["Python"]) == 0.0

    def test_case_insensitive(self) -> None:
        assert compute_skill_match(["python"], ["Python"]) == 1.0


class TestComputeLocationMatch:
    def test_matching_location(self) -> None:
        assert compute_location_match("Paris", ["Paris", "Lyon"]) == 1.0

    def test_no_matching_location(self) -> None:
        assert compute_location_match("Bordeaux", ["Paris", "Lyon"]) == 0.0

    def test_case_insensitive(self) -> None:
        assert compute_location_match("paris", ["Paris"]) == 1.0


class TestScoreJobOffer:
    def test_perfect_score(self, sample_candidate: CandidateProfile) -> None:
        offer = JobOffer(
            title="Dev",
            company="X",
            location="Paris",
            skills=["Python", "React", "SQL"],
        )
        assert score_job_offer(offer, sample_candidate) == pytest.approx(1.0)

    def test_zero_score(self, sample_candidate: CandidateProfile) -> None:
        offer = JobOffer(
            title="DevOps",
            company="Y",
            location="Bordeaux",
            skills=["Go", "Rust"],
        )
        assert score_job_offer(offer, sample_candidate) == pytest.approx(0.0)

    def test_custom_weights(self, sample_candidate: CandidateProfile) -> None:
        offer = JobOffer(
            title="Dev",
            company="X",
            location="Paris",
            skills=["Python"],
        )
        score = score_job_offer(offer, sample_candidate, skill_weight=0.5, location_weight=0.5)
        assert score == pytest.approx(0.5 * 1.0 + 0.5 * 1.0)


class TestRankJobOffers:
    def test_returns_sorted_by_score(
        self, sample_offers: list[JobOffer], sample_candidate: CandidateProfile
    ) -> None:
        ranked = rank_job_offers(sample_offers, sample_candidate)
        scores = [offer.score for offer in ranked]
        assert scores == sorted(scores, reverse=True)

    def test_returns_all_offers(
        self, sample_offers: list[JobOffer], sample_candidate: CandidateProfile
    ) -> None:
        ranked = rank_job_offers(sample_offers, sample_candidate)
        assert len(ranked) == len(sample_offers)

    def test_empty_list(self, sample_candidate: CandidateProfile) -> None:
        assert rank_job_offers([], sample_candidate) == []


class TestFilterOffersByScore:
    def test_filters_below_threshold(self) -> None:
        offers = [
            JobOffer(title="A", company="X", location="Paris", score=0.8),
            JobOffer(title="B", company="Y", location="Lyon", score=0.3),
            JobOffer(title="C", company="Z", location="Nice", score=0.5),
        ]
        filtered = filter_offers_by_score(offers, min_score=0.5)
        assert len(filtered) == 2
        assert all(o.score >= 0.5 for o in filtered)

    def test_empty_input(self) -> None:
        assert filter_offers_by_score([]) == []


class TestFormatOfferSummary:
    def test_format_with_skills(self) -> None:
        offer = JobOffer(title="Dev", company="Corp", location="Paris", skills=["Python"], score=0.75)
        summary = format_offer_summary(offer)
        assert "Dev" in summary
        assert "Corp" in summary
        assert "Paris" in summary
        assert "Python" in summary
        assert "0.75" in summary

    def test_format_no_skills(self) -> None:
        offer = JobOffer(title="Dev", company="Corp", location="Paris", score=0.0)
        summary = format_offer_summary(offer)
        assert "N/A" in summary


class TestNormalizeSkillList:
    def test_deduplicates_and_lowercases(self) -> None:
        result = normalize_skill_list(["Python", "python", "SQL"])
        assert result == ["python", "sql"]

    def test_ignores_blank_strings(self) -> None:
        result = normalize_skill_list(["Python", " ", ""])
        assert result == ["python"]

    def test_empty_input(self) -> None:
        assert normalize_skill_list([]) == []


class TestParseLocation:
    def test_returns_clean_string(self) -> None:
        assert parse_location("  Paris  ") == "Paris"

    def test_returns_none_for_empty(self) -> None:
        assert parse_location("") is None

    def test_returns_none_for_whitespace_only(self) -> None:
        assert parse_location("   ") is None
