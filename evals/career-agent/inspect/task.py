from __future__ import annotations

from inspect_ai import Task, task

from dataset import career_agent_dataset
from scorer import career_agent_scorer
from solver import career_agent_solver


@task
def career_agent(provider: str = "mock-smoke", case: str | None = None) -> Task:
    return Task(
        dataset=career_agent_dataset(case_id=case, provider=provider),
        solver=career_agent_solver(provider=provider),
        scorer=career_agent_scorer(),
        model=None,
    )
