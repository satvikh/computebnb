import json
import math
import pathlib
import random
import statistics
import sys
import time
from typing import List, Tuple


def log(stage: str, message: str) -> None:
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] [{stage}] {message}", flush=True)


def dot(left: List[float], right: List[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def norm(values: List[float]) -> float:
    return math.sqrt(dot(values, values))


def matvec(matrix: List[List[float]], vector: List[float]) -> List[float]:
    return [sum(cell * value for cell, value in zip(row, vector)) for row in matrix]


def centered_field_payload(payload: dict, size: int) -> List[List[float]]:
    phase = float(payload.get("phase", 0.6180339887))
    skew = float(payload.get("skew", 1.4142135623))
    field: List[List[float]] = []
    for i in range(size):
        row: List[float] = []
        x = (i + 0.5) / size
        for j in range(size):
            y = (j + 0.5) / size
            carrier = (
                math.sin(2.0 * math.pi * (x + phase * y))
                + 0.7 * math.cos(4.0 * math.pi * (y - phase * x))
                + 0.45 * math.sin(6.0 * math.pi * (x * y + phase))
            )
            envelope = math.exp(-2.4 * ((x - 0.5) ** 2 + (y - 0.5) ** 2))
            perturbation = 0.08 * math.sin(skew * (i + 1) * (j + 1) / size)
            row.append(carrier * envelope + perturbation)
        field.append(row)
    return field


def build_gramian(field: List[List[float]], rank: int) -> List[List[float]]:
    size = len(field)
    basis: List[List[float]] = []
    for mode in range(rank):
        fx = (mode % 6) + 1
        fy = (mode // 6) + 1
        vector: List[float] = []
        for i in range(size):
            x = (i + 0.5) / size
            for j in range(size):
                y = (j + 0.5) / size
                harmonic = (
                    math.sin(math.pi * fx * x) * math.cos(math.pi * fy * y)
                    + 0.5 * math.cos(math.pi * (fx + fy) * x * y)
                )
                vector.append(field[i][j] * harmonic)
        basis.append(vector)

    matrix: List[List[float]] = []
    for i in range(rank):
        row: List[float] = []
        for j in range(rank):
            value = dot(basis[i], basis[j]) / len(basis[i])
            if i == j:
                value += 0.05 * (i + 1)
            row.append(value)
        matrix.append(row)
    return matrix


def power_iteration(matrix: List[List[float]], steps: int) -> Tuple[float, List[float]]:
    size = len(matrix)
    vector = [1.0 / math.sqrt(size)] * size
    for step in range(steps):
        product = matvec(matrix, vector)
        scale = norm(product)
        vector = [value / scale for value in product]
        if step % 5 == 0 or step == steps - 1:
            rayleigh = dot(vector, matvec(matrix, vector))
            log("power", f"step={step:02d} dominant_rayleigh={rayleigh:.6f} residual_scale={scale:.6f}")
    eigenvalue = dot(vector, matvec(matrix, vector))
    return eigenvalue, vector


def conjugate_gradient(
    matrix: List[List[float]],
    rhs: List[float],
    steps: int,
    damping: float,
) -> Tuple[List[float], List[float]]:
    size = len(rhs)
    solution = [0.0] * size
    residual = rhs[:]
    direction = residual[:]
    residual_history = [norm(residual)]
    for step in range(steps):
        ap = matvec(matrix, direction)
        shifted = [value + damping * direction[i] for i, value in enumerate(ap)]
        numerator = dot(residual, residual)
        denominator = max(dot(direction, shifted), 1e-12)
        alpha = numerator / denominator
        solution = [solution[i] + alpha * direction[i] for i in range(size)]
        next_residual = [residual[i] - alpha * shifted[i] for i in range(size)]
        next_norm = norm(next_residual)
        residual_history.append(next_norm)
        if step % 4 == 0 or step == steps - 1:
            log(
                "cg",
                f"step={step:02d} alpha={alpha:.6e} residual_norm={next_norm:.6e}",
            )
        if next_norm < 1e-8:
            residual = next_residual
            break
        beta = dot(next_residual, next_residual) / max(numerator, 1e-12)
        direction = [next_residual[i] + beta * direction[i] for i in range(size)]
        residual = next_residual
    return solution, residual_history


def diffuse(field: List[List[float]], iterations: int, reaction: float) -> List[dict]:
    size = len(field)
    current = [row[:] for row in field]
    metrics: List[dict] = []
    for step in range(iterations):
        nxt = [[0.0 for _ in range(size)] for _ in range(size)]
        energy = 0.0
        mass = 0.0
        for i in range(size):
            for j in range(size):
                center = current[i][j]
                north = current[(i - 1) % size][j]
                south = current[(i + 1) % size][j]
                west = current[i][(j - 1) % size]
                east = current[i][(j + 1) % size]
                laplacian = north + south + east + west - 4.0 * center
                nonlinear = reaction * center * (1.0 - center * center)
                updated = center + 0.12 * laplacian + 0.015 * nonlinear
                nxt[i][j] = updated
                energy += updated * updated
                mass += updated
        current = nxt
        snapshot = {
            "step": step,
            "energy": energy / (size * size),
            "mass": mass / (size * size),
            "centerline": current[size // 2][size // 3],
        }
        metrics.append(snapshot)
        if step % 6 == 0 or step == iterations - 1:
            log(
                "pde",
                "step={step:02d} mean_energy={energy:.6f} mean_mass={mass:.6f} probe={probe:.6f}".format(
                    step=step,
                    energy=snapshot["energy"],
                    mass=snapshot["mass"],
                    probe=snapshot["centerline"],
                ),
            )
    return metrics


def monte_carlo_free_energy(seed: int, samples: int, spectrum: List[float]) -> dict:
    rng = random.Random(seed)
    beta = 1.35
    partition_accumulator = 0.0
    moment_accumulator = 0.0
    diagnostics: List[float] = []
    for sample in range(samples):
        state = [rng.gauss(0.0, 1.0) for _ in spectrum]
        quadratic = sum(lam * value * value for lam, value in zip(spectrum, state))
        quartic = 0.02 * sum(value ** 4 for value in state)
        coupling = 0.015 * sum(state[i] * state[i - 1] for i in range(1, len(state)))
        energy = 0.5 * quadratic + quartic - coupling
        weight = math.exp(-beta * energy)
        partition_accumulator += weight
        moment_accumulator += energy * weight
        diagnostics.append(energy)
        if sample % max(samples // 5, 1) == 0 or sample == samples - 1:
            running_mean = statistics.fmean(diagnostics)
            log(
                "mc",
                f"sample={sample:04d} mean_energy={running_mean:.6f} partial_Z={partition_accumulator:.6e}",
            )
    partition = partition_accumulator / samples
    expected_energy = moment_accumulator / max(partition_accumulator, 1e-12)
    free_energy = -math.log(max(partition, 1e-12)) / beta
    variance = statistics.pvariance(diagnostics) if len(diagnostics) > 1 else 0.0
    return {
        "beta": beta,
        "samples": samples,
        "free_energy": free_energy,
        "expected_energy": expected_energy,
        "energy_variance": variance,
    }


def summarize_vector(values: List[float], limit: int = 6) -> List[float]:
    return [round(value, 6) for value in values[:limit]]


def main() -> None:
    input_path = pathlib.Path(sys.argv[1])
    payload = json.loads(input_path.read_text())

    grid_size = int(payload.get("gridSize", 28))
    rank = int(payload.get("rank", 18))
    power_steps = int(payload.get("powerSteps", 18))
    cg_steps = int(payload.get("cgSteps", 20))
    diffusion_steps = int(payload.get("diffusionSteps", 24))
    monte_carlo_samples = int(payload.get("monteCarloSamples", 1200))
    reaction = float(payload.get("reaction", 0.9))
    seed = int(payload.get("seed", 20260419))

    log("boot", "starting spectral market solver")
    log(
        "boot",
        (
            f"payload gridSize={grid_size} rank={rank} powerSteps={power_steps} "
            f"cgSteps={cg_steps} diffusionSteps={diffusion_steps} "
            f"monteCarloSamples={monte_carlo_samples} seed={seed}"
        ),
    )

    field = centered_field_payload(payload, grid_size)
    field_mean = sum(sum(row) for row in field) / (grid_size * grid_size)
    field_peak = max(max(abs(value) for value in row) for row in field)
    log("field", f"constructed deterministic field mean={field_mean:.6f} peak={field_peak:.6f}")

    gramian = build_gramian(field, rank)
    diagonal_preview = summarize_vector([gramian[i][i] for i in range(rank)])
    log("matrix", f"assembled {rank}x{rank} Gramian diag_head={diagonal_preview}")

    leading_eigenvalue, leading_vector = power_iteration(gramian, power_steps)
    log(
        "spectrum",
        f"dominant_eigenvalue={leading_eigenvalue:.6f} eigenvector_head={summarize_vector(leading_vector)}",
    )

    rhs = [math.sin(0.3 * (i + 1)) + 0.2 * math.cos(0.17 * (i + 1) ** 2) for i in range(rank)]
    solution, residual_history = conjugate_gradient(gramian, rhs, cg_steps, damping=0.075)
    condition_proxy = leading_eigenvalue / max(min(abs(value) for value in diagonal_preview), 1e-6)
    log(
        "solver",
        f"solution_norm={norm(solution):.6f} final_residual={residual_history[-1]:.6e} condition_proxy={condition_proxy:.6f}",
    )

    diffusion_metrics = diffuse(field, diffusion_steps, reaction)
    final_diffusion = diffusion_metrics[-1]
    log(
        "pde",
        "terminal_state energy={energy:.6f} mass={mass:.6f} probe={probe:.6f}".format(
            energy=final_diffusion["energy"],
            mass=final_diffusion["mass"],
            probe=final_diffusion["centerline"],
        ),
    )

    synthetic_spectrum = [gramian[i][i] + 0.1 * abs(leading_vector[i]) for i in range(rank)]
    free_energy_stats = monte_carlo_free_energy(seed, monte_carlo_samples, synthetic_spectrum)

    score = (
        0.42 * math.tanh(leading_eigenvalue / 8.0)
        + 0.28 * math.exp(-residual_history[-1] * 10.0)
        + 0.18 * math.tanh(final_diffusion["energy"] * 3.0)
        + 0.12 * math.tanh(max(free_energy_stats["expected_energy"], 0.0) / 6.0)
    )
    market_stability_index = round(1000.0 * score, 3)

    summary = {
        "job": "spectral_market_solver",
        "seed": seed,
        "grid_size": grid_size,
        "rank": rank,
        "dominant_eigenvalue": round(leading_eigenvalue, 6),
        "condition_proxy": round(condition_proxy, 6),
        "solution_norm": round(norm(solution), 6),
        "final_residual": round(residual_history[-1], 12),
        "free_energy": round(free_energy_stats["free_energy"], 6),
        "expected_energy": round(free_energy_stats["expected_energy"], 6),
        "energy_variance": round(free_energy_stats["energy_variance"], 6),
        "terminal_diffusion_energy": round(final_diffusion["energy"], 6),
        "terminal_diffusion_mass": round(final_diffusion["mass"], 6),
        "market_stability_index": market_stability_index,
        "dominant_mode_head": summarize_vector(leading_vector),
        "cg_residual_head": summarize_vector(residual_history),
    }

    artifact_dir = pathlib.Path("/workspace/artifacts")
    artifact_dir.mkdir(exist_ok=True)
    artifact_path = artifact_dir / "spectral_market_solver.json"
    artifact_path.write_text(
        json.dumps(
            {
                "summary": summary,
                "diffusion_metrics_tail": diffusion_metrics[-6:],
                "free_energy": free_energy_stats,
                "solution_head": summarize_vector(solution),
            },
            indent=2,
        )
    )

    log("final", f"market_stability_index={market_stability_index:.3f}")
    log("final", f"artifact={artifact_path}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
