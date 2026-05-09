from __future__ import annotations

import asyncio
import json
import subprocess
from typing import Any

from inspect_ai.scorer import Score, Scorer, Target, mean, scorer
from inspect_ai.solver import TaskState

from dataset import repo_root
from solver import BRIDGE_PATH


def _run_bridge(payload: dict[str, Any]) -> dict[str, Any]:
    completed = subprocess.run(
        [str(repo_root() / "node_modules" / ".bin" / "tsx"), str(BRIDGE_PATH)],
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        cwd=repo_root(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(f"bridge failed: {completed.stderr}\n{completed.stdout}")
    response = json.loads(completed.stdout)
    if "error" in response:
        raise RuntimeError(str(response["error"]))
    return response


def _last_turn_field(observation: dict[str, Any], field: str) -> Any:
    turns = observation.get("turns")
    if not isinstance(turns, list) or not turns:
        return None
    last = turns[-1]
    if not isinstance(last, dict):
        return None
    return last.get(field)


@scorer(metrics=[mean()])
def career_agent_scorer() -> Scorer:
    async def score(state: TaskState, target: Target) -> Score:
        observation = state.store.get("observation")
        if not isinstance(observation, dict):
            return Score.unscored(explanation="solver did not record an observation")
        expectations = json.loads(target.text)
        response = await asyncio.to_thread(
            _run_bridge,
            {
                "command": "judge",
                "observation": observation,
                "expectations": expectations,
            },
        )
        judgement = response["judgement"]
        metadata = {
            "hardPassFail": judgement["passed"],
            "hardAssertions": judgement["hardAssertions"],
            "hardPassRate": judgement["hardPassRate"],
            "softScoreBreakdown": judgement["softScores"],
            "averageSoftScore": judgement["averageSoftScore"],
            "taxonomy": judgement["errorTaxonomy"],
            "suggestedFixes": judgement["suggestedFixes"],
            "createdObjects": [_last_turn_field(observation, "createdObjects")],
            "actionLevel": _last_turn_field(observation, "actionLevel"),
            "intent": _last_turn_field(observation, "intent"),
            "evidenceSufficiency": _last_turn_field(observation, "evidenceSufficiency"),
            "latencyMs": [turn.get("latencyMs") for turn in observation.get("turns", []) if isinstance(turn, dict)],
            "tokenUsage": [turn.get("tokenUsage") for turn in observation.get("turns", []) if isinstance(turn, dict)],
            "agentRunIds": [turn.get("agentRunId") for turn in observation.get("turns", []) if isinstance(turn, dict)],
            "agentStepCounts": [turn.get("agentStepsCount") for turn in observation.get("turns", []) if isinstance(turn, dict)],
            "assistantOutputs": state.store.get("assistant_outputs"),
        }
        return Score(
            value=1.0 if judgement["passed"] else 0.0,
            answer=state.output.completion,
            explanation="judgeCase passed" if judgement["passed"] else "; ".join(judgement["suggestedFixes"]),
            metadata=metadata,
        )

    return score
