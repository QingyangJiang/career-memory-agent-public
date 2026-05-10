from __future__ import annotations

import json
from pathlib import Path
from typing import Any, TypedDict, cast

from inspect_ai.dataset import MemoryDataset, Sample


class EvalCase(TypedDict):
    id: str
    title: str
    provider: str
    turns: list[dict[str, str]]
    expectations: dict[str, Any]
    tags: list[str]


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def cases_dir() -> Path:
    return repo_root() / "evals" / "career-agent" / "cases"


def read_case(path: Path) -> EvalCase:
    with path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)
    if "tags" not in raw:
        raw["tags"] = []
    return cast(EvalCase, raw)


def load_cases(case_id: str | None = None, provider: str | None = None) -> list[tuple[Path, EvalCase]]:
    cases: list[tuple[Path, EvalCase]] = []
    for path in sorted(cases_dir().glob("*.json")):
        case = read_case(path)
        if case_id is not None and case["id"] != case_id:
            continue
        if provider is not None and provider != "mock-smoke" and case["provider"] != provider:
            continue
        cases.append((path, case))
    if provider == "mock-smoke" and cases:
        path, case = cases[0]
        smoke_case: EvalCase = {
            **case,
            "provider": "mock-smoke",
            "expectations": {
                "shouldCreateEvidence": False,
                "shouldCreateOpportunity": False,
                "shouldCreateDecision": False,
                "maxMemorySuggestions": 0,
                "maxRisks": 0,
                "maxOpenQuestions": 0,
            },
        }
        return [(path, smoke_case)]
    return cases


def career_agent_dataset(case_id: str | None = None, provider: str | None = None) -> MemoryDataset:
    samples: list[Sample] = []
    for path, case in load_cases(case_id=case_id, provider=provider):
        samples.append(
            Sample(
                id=case["id"],
                input=json.dumps(case["turns"], ensure_ascii=False),
                target=json.dumps(case["expectations"], ensure_ascii=False),
                metadata={
                    "id": case["id"],
                    "title": case["title"],
                    "provider": case["provider"],
                    "tags": case.get("tags", []),
                    "case_path": str(path),
                },
            )
        )
    return MemoryDataset(samples=samples, name="career-agent-cases", location=str(cases_dir()))
