from app.schemas.news import NewsSummary

BASE = {
    "id": 847,
    "video_id": 921,
    "short_summary": "kısa",
    "long_summary": "uzun",
    "language": "tr",
    "source": "llm",
    "created_at": "2026-11-18T15:02:25",
}


def test_null_highlights_become_empty_list() -> None:
    assert NewsSummary.model_validate({**BASE, "highlights": None}).highlights == []


def test_highlights_list_is_kept() -> None:
    assert NewsSummary.model_validate({**BASE, "highlights": ["a", "b"]}).highlights == ["a", "b"]
