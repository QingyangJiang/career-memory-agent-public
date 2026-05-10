from __future__ import annotations

import asyncio
import json
import subprocess
from pathlib import Path
from typing import Any

from inspect_ai.model import ModelOutput
from inspect_ai.solver import Generate, Solver, TaskState, solver

from dataset import read_case, repo_root


BRIDGE_PATH = repo_root() / "evals" / "career-agent" / "inspect" / "bridge.ts"


def _node_command() -> list[str]:
    return [str(repo_root() / "node_modules" / ".bin" / "tsx"), str(BRIDGE_PATH)]


def _run_bridge(payload: dict[str, Any]) -> dict[str, Any]:
    completed = subprocess.run(
        _node_command(),
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


def _assistant_output(observation: dict[str, Any]) -> str:
    turns = observation.get("turns")
    if not isinstance(turns, list):
        return ""
    outputs: list[str] = []
    for turn in turns:
        if isinstance(turn, dict) and isinstance(turn.get("assistant"), str):
            outputs.append(turn["assistant"])
    return "\n\n".join(outputs)


@solver
def career_agent_solver(provider: str = "mock-smoke") -> Solver:
    async def solve(state: TaskState, generate: Generate) -> TaskState:
        case_path = state.metadata["case_path"]
        if not isinstance(case_path, str):
            raise TypeError("Sample metadata.case_path must be a string")
        case = read_case(Path(case_path))
        if provider == "mock-smoke":
            case["provider"] = "mock-smoke"
        response = await asyncio.to_thread(
            _run_bridge,
            {"command": "observe", "case": case, "provider": provider},
        )
        observation = response["observation"]
        state.store.set("case", case)
        state.store.set("observation", observation)
        state.store.set("dbPath", response.get("dbPath", ""))
        state.store.set("assistant_outputs", _assistant_output(observation))
        state.output = ModelOutput.from_content(
            model=str(observation.get("model", provider)),
            content=_assistant_output(observation),
            error=observation.get("error") if isinstance(observation.get("error"), str) else None,
        )
        return state

    return solve
