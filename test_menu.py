from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parent
WEB_DIR = ROOT / "uruti-web" / "Uruti_Web-updated"
BACKEND_DIR = WEB_DIR / "src" / "backend"
MOBILE_DIR = ROOT / "uruti-Mobile" / "uruti_app"
LOG_DIR = ROOT / "test_logs"
MAX_LOG_FILES = 30


class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"


USE_COLOR = sys.stdout.isatty() and os.getenv("TERM") not in {None, "dumb"}


@dataclass
class CommandSpec:
    title: str
    cwd: Path
    command: list[str]
    note: str | None = None


@dataclass
class RunResult:
    title: str
    passed: bool
    log_path: Path
    test_counts: tuple[int, int] | None = field(default=None)
    test_details: list[str] | None = field(default=None)


def _strip_ansi(text: str) -> str:
    return re.sub(r'\x1b\[[0-9;]*[mGKHFABCDJsu]', '', text)


def _extract_pytest_details(stdout: str) -> list[str]:
    """Extract pytest test module/class names from verbose output."""
    clean = _strip_ansi(stdout or "")
    test_items = set()
    for line in clean.split('\n'):
        if ' PASSED' in line or ' FAILED' in line:
            parts = line.split()
            if parts:
                test_path = parts[0]
                if '::' in test_path:
                    components = test_path.split('::')
                    if len(components) >= 2:
                        label = components[1] if len(components[1]) > 0 else components[0].split('/')[-1]
                        status = 'passed' if 'PASSED' in line else 'failed'
                        test_items.add(f"{label} - {status}")
    return sorted(list(test_items))


def _extract_vitest_details(stdout: str) -> list[str]:
    """Extract vitest test file names."""
    clean = _strip_ansi(stdout or "")
    test_files = []
    for line in clean.split('\n'):
        # Match lines with ✓ and .test.ts or .test.tsx
        if '✓' in line and ('.test.ts' in line or '.test.tsx' in line):
            match = re.search(r'src/(?:lib|components)/(.+?)\.test\.tsx?', line)
            if match:
                test_name = match.group(1).replace('/', ' - ')
                test_files.append(f"{test_name} - passed")
    return test_files


def _extract_flutter_details(stdout: str) -> list[str]:
    """Extract flutter test descriptions from output."""
    clean = _strip_ansi(stdout or "")
    test_items = set()
    # Flutter output: "00:05 +1: test/file.dart: test description"
    for line in clean.split('\n'):
        if '+' in line and '.dart:' in line:
            # Extract the test description after the .dart: part
            parts = line.split('.dart:')
            if len(parts) > 1:
                description = parts[1].strip()
                if description and not description.startswith('/'):
                    test_items.add(f"{description} - passed")
    return sorted(list(test_items))


def _extract_test_counts(stdout: str, stderr: str) -> tuple[int, int] | None:
    """Return (passed, total) parsed from stdout/stderr, or None if unparseable."""
    combined = _strip_ansi((stdout or "") + "\n" + (stderr or ""))

    # Vitest: "Test Files  4 passed (4)" then "Tests  10 passed (10)"
    # Take the LAST "N passed (T)" match — that's the "Tests" line, not "Test Files".
    # Also handles "2 failed | 8 passed (10)" variant.
    vitest_matches = re.findall(r'(?:\d+\s+failed\s*[|]\s*)?(\d+)\s+passed\s+\((\d+)\)', combined)
    if vitest_matches:
        passed, total = vitest_matches[-1]
        return (int(passed), int(total))

    # pytest: "13 passed" or "5 failed, 13 passed" (no parenthetical total)
    m = re.search(r'(?:(\d+) failed,\s*)?(\d+) passed', combined)
    if m:
        passed = int(m.group(2))
        failed = int(m.group(1)) if m.group(1) else 0
        return (passed, passed + failed)

    # Flutter: "+6:" or "+5 -1:" lines — use last occurrence
    matches = re.findall(r'\+(\d+)(?:\s*-(\d+))?:', combined)
    if matches:
        last = matches[-1]
        passed = int(last[0])
        failed = int(last[1]) if last[1] else 0
        return (passed, passed + failed)

    return None


def _colorize(text: str, color: str) -> str:
    if not USE_COLOR:
        return text
    return f"{color}{text}{Colors.RESET}"


def _ensure_log_dir() -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)


def _cleanup_old_logs() -> None:
    if not LOG_DIR.exists():
        return
    logs = sorted(LOG_DIR.glob("*.log"), key=lambda path: path.stat().st_mtime, reverse=True)
    for stale_log in logs[MAX_LOG_FILES:]:
        try:
            stale_log.unlink()
        except OSError:
            continue


def _write_log(spec: CommandSpec, completed: subprocess.CompletedProcess[str] | None, error: str | None = None) -> Path:
    _ensure_log_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = "_".join(spec.title.lower().split())
    log_path = LOG_DIR / f"{timestamp}_{slug}.log"

    lines = [
        f"Title: {spec.title}",
        f"Working directory: {spec.cwd}",
        f"Command: {' '.join(spec.command)}",
        f"Timestamp: {datetime.now().isoformat()}",
    ]
    if spec.note:
        lines.append(f"Note: {spec.note}")

    if error is not None:
        lines.extend(["Status: FAILED", "", "Error:", error])
    elif completed is not None:
        lines.extend(
            [
                f"Status: {'PASSED' if completed.returncode == 0 else 'FAILED'}",
                f"Return code: {completed.returncode}",
                "",
                "Stdout:",
                completed.stdout or "<no stdout>",
                "",
                "Stderr:",
                completed.stderr or "<no stderr>",
            ]
        )

    log_path.write_text("\n".join(lines), encoding="utf-8")
    _cleanup_old_logs()
    return log_path


def _write_summary_log(results: list[RunResult]) -> Path:
    _ensure_log_dir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_path = LOG_DIR / f"{timestamp}_all_components_summary.log"
    lines = [
        "Title: All Components Summary",
        f"Timestamp: {datetime.now().isoformat()}",
        "",
        "Results:",
    ]
    for result in results:
        count_str = f" ({result.test_counts[0]}/{result.test_counts[1]})" if result.test_counts else ""
        lines.append(
            f"- {result.title}: {'PASSED' if result.passed else 'FAILED'}{count_str} | log={result.log_path}"
        )
        if result.test_details:
            for detail in result.test_details:
                lines.append(f"    {detail}")
    lines.append("")
    overall_passed = all(result.passed for result in results)
    lines.append(f"Overall: {'PASSED' if overall_passed else 'FAILED'}")
    log_path.write_text("\n".join(lines), encoding="utf-8")
    _cleanup_old_logs()
    return log_path


def _recent_logs(limit: int = 10) -> list[Path]:
    if not LOG_DIR.exists():
        return []
    return sorted(LOG_DIR.glob('*.log'), key=lambda path: path.stat().st_mtime, reverse=True)[:limit]


def _view_recent_logs() -> None:
    logs = _recent_logs()
    if not logs:
        print("\nNo logs found yet.")
        return

    print(f"\n{_colorize('Recent Logs', Colors.BOLD)}")
    for index, log_path in enumerate(logs, start=1):
        modified = datetime.fromtimestamp(log_path.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"{index}. {log_path.name} ({modified})")

    choice = input("\nEnter a log number to view, or press Enter to return: ").strip()
    if not choice:
        return

    try:
        selected = logs[int(choice) - 1]
    except (ValueError, IndexError):
        print("Invalid log choice.")
        return

    print(f"\n{_colorize(selected.name, Colors.CYAN)}")
    print(selected.read_text(encoding='utf-8'))


def _python_executable() -> str:
    local_python = ROOT / ".venv" / "bin" / "python"
    if local_python.exists():
        return str(local_python)
    return sys.executable


def _backend_python() -> str:
    backend_python = BACKEND_DIR / ".venv" / "bin" / "python"
    if backend_python.exists():
        return str(backend_python)
    return _python_executable()


def _frontend_command() -> CommandSpec:
    package_json_path = WEB_DIR / "package.json"
    scripts = {}
    if package_json_path.exists():
        try:
            scripts = json.loads(package_json_path.read_text(encoding="utf-8")).get(
                "scripts", {}
            )
        except json.JSONDecodeError:
            scripts = {}

    npm = shutil.which("npm") or "npm"

    if "test" in scripts:
        return CommandSpec(
            title="Web Frontend Tests",
            cwd=WEB_DIR,
            command=[npm, "run", "test"],
        )

    return CommandSpec(
        title="Web Frontend Build",
        cwd=WEB_DIR,
        command=[npm, "run", "build"],
        note="Runs a production build for the frontend.",
    )


def _frontend_test_command() -> CommandSpec:
    npm = shutil.which("npm") or "npm"
    return CommandSpec(
        title="Web Frontend Tests",
        cwd=WEB_DIR,
        command=[npm, "run", "test"],
    )


def _frontend_build_command() -> CommandSpec:
    npm = shutil.which("npm") or "npm"
    return CommandSpec(
        title="Web Frontend Build",
        cwd=WEB_DIR,
        command=[npm, "run", "build"],
        note="Runs a production build for the frontend.",
    )


def _backend_commands() -> list[CommandSpec]:
    python_bin = _backend_python()
    return [
        CommandSpec(
            title="Backend Unit Tests",
            cwd=BACKEND_DIR,
            command=[python_bin, "-m", "pytest", "-v"],
        ),
        CommandSpec(
            title="Backend Live Smoke Tests",
            cwd=BACKEND_DIR,
            command=[python_bin, "-m", "pytest", "-v", "live_tests/test_live_backend.py"],
            note="This checks the deployed backend endpoint configured in the live smoke tests.",
        ),
    ]


def _mobile_command() -> CommandSpec:
    flutter = shutil.which("flutter") or "flutter"
    return CommandSpec(
        title="Mobile Widget Tests",
        cwd=MOBILE_DIR,
        command=[flutter, "test"],
    )


def _print_header() -> None:
    print(f"\n{_colorize('URUTI Component Test Runner', Colors.BOLD)}")
    print("=" * 28)
    print(f"Root: {ROOT}")
    print(f"Logs: {LOG_DIR}")


def _print_menu() -> None:
    print("\nChoose a component to test:")
    print("1. Web frontend tests")
    print("2. Web frontend build")
    print("3. Backend")
    print("4. Mobile")
    print("5. All components")
    print("6. View recent logs")
    print("7. Quit")


def _spinner(stop_event: threading.Event, message: str) -> None:
    frames = "|/-\\"
    index = 0
    start = time.time()
    while not stop_event.is_set():
        elapsed = time.time() - start
        frame = frames[index % len(frames)]
        print(f"\r{message} {frame} {elapsed:5.1f}s", end="", flush=True)
        time.sleep(0.12)
        index += 1
    print("\r" + " " * (len(message) + 20) + "\r", end="", flush=True)


def _run_command(spec: CommandSpec) -> RunResult:
    print(f"\n{_colorize(f'[{spec.title}]', Colors.CYAN)}")
    print(f"Working directory: {spec.cwd}")
    print(f"Command: {' '.join(spec.command)}")
    if spec.note:
        print(_colorize(f"Note: {spec.note}", Colors.YELLOW))

    stop_event = threading.Event()
    spinner_thread = threading.Thread(
        target=_spinner,
        args=(stop_event, f"Running {spec.title.lower()}..."),
        daemon=True,
    )
    spinner_thread.start()

    try:
        completed = subprocess.run(
            spec.command,
            cwd=spec.cwd,
            text=True,
            capture_output=True,
            check=False,
        )
    except FileNotFoundError as exc:
        stop_event.set()
        spinner_thread.join()
        log_path = _write_log(spec, None, error=f"Required executable was not found: {exc}")
        print(_colorize("Status: FAILED", Colors.RED))
        print(f"Output:\nRequired executable was not found: {exc}")
        print(_colorize(f"Log file: {log_path}", Colors.BLUE))
        return RunResult(title=spec.title, passed=False, log_path=log_path)

    stop_event.set()
    spinner_thread.join()

    success = completed.returncode == 0
    counts = _extract_test_counts(completed.stdout or "", completed.stderr or "")
    count_str = f" ({counts[0]}/{counts[1]})" if counts is not None else ""
    log_path = _write_log(spec, completed)
    print(_colorize(f"Status: {'PASSED' if success else 'FAILED'}{count_str}", Colors.GREEN if success else Colors.RED))
    
    # Extract test details based on title
    details = None
    if 'Backend' in spec.title:
        details = _extract_pytest_details(completed.stdout or "")
    elif 'Frontend' in spec.title and 'Build' not in spec.title:
        details = _extract_vitest_details(completed.stdout or "")
    elif 'Mobile' in spec.title:
        details = _extract_flutter_details(completed.stdout or "")
    
    # Print test details if available
    if details:
        print("Details:")
        for detail in details:
            print(f"  - {detail}")
    
    print("Output:")

    stdout = completed.stdout.strip()
    stderr = completed.stderr.strip()

    if stdout:
        print(stdout)
    else:
        print("<no stdout>")

    if stderr:
        print("\nStderr:")
        print(stderr)

    print(_colorize(f"\nLog file: {log_path}", Colors.BLUE))

    return RunResult(title=spec.title, passed=success, log_path=log_path, test_counts=counts, test_details=details)


def _run_frontend() -> None:
    result = _run_command(_frontend_test_command())
    print(_colorize(f"\nWeb overall result: {'PASSED' if result.passed else 'FAILED'}", Colors.GREEN if result.passed else Colors.RED))


def _run_frontend_build() -> None:
    result = _run_command(_frontend_build_command())
    print(_colorize(f"\nWeb build result: {'PASSED' if result.passed else 'FAILED'}", Colors.GREEN if result.passed else Colors.RED))


def _run_backend() -> None:
    all_passed = True
    for spec in _backend_commands():
        result = _run_command(spec)
        all_passed = all_passed and result.passed

    print(f"\nBackend overall result: {'PASSED' if all_passed else 'FAILED'}")


def _run_mobile() -> None:
    result = _run_command(_mobile_command())
    print(_colorize(f"\nMobile overall result: {'PASSED' if result.passed else 'FAILED'}", Colors.GREEN if result.passed else Colors.RED))


def _run_all_components() -> None:
    results: list[RunResult] = []
    results.append(_run_command(_frontend_test_command()))

    for spec in _backend_commands():
        results.append(_run_command(spec))

    results.append(_run_command(_mobile_command()))
    summary_log = _write_summary_log(results)

    print(f"\n{_colorize('Overall Summary', Colors.BOLD)}")
    for result in results:
        color = Colors.GREEN if result.passed else Colors.RED
        count_str = f" ({result.test_counts[0]}/{result.test_counts[1]})" if result.test_counts else ""
        print(_colorize(f"- {result.title}: {'PASSED' if result.passed else 'FAILED'}{count_str}", color))
        if result.test_details:
            for detail in result.test_details:
                print(f"    {detail}")
    print(_colorize(f"Summary log: {summary_log}", Colors.BLUE))


def main() -> int:
    actions = {
        "1": _run_frontend,
        "2": _run_frontend_build,
        "3": _run_backend,
        "4": _run_mobile,
        "5": _run_all_components,
        "6": _view_recent_logs,
    }

    while True:
        _print_header()
        _print_menu()
        choice = input("\nEnter your choice: ").strip()

        if choice == "7":
            print("Exiting test runner.")
            return 0

        action = actions.get(choice)
        if action is None:
            print("Invalid choice. Please choose 1, 2, 3, 4, 5, 6, or 7.")
            continue

        action()
        input("\nPress Enter to return to the menu...")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except EOFError:
        print("\nInput stream ended. Exiting test runner.")
        raise SystemExit(0)
    except KeyboardInterrupt:
        print("\nInterrupted. Exiting test runner.")
        raise SystemExit(130)