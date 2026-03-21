from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

import os
from dotenv import load_dotenv
from typing import Any, Dict, List, Optional, Tuple
import re
import logging
from pathlib import Path
try:
    import pyodbc
except ModuleNotFoundError:
    pyodbc = None

app = FastAPI(title="MI Platform API", version="0.1.0")
logger = logging.getLogger("mi_platform_api")

BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(BACKEND_DIR / ".env")



def get_db_connection():
    if pyodbc is None:
        raise RuntimeError(
            "pyodbc is not installed in the active Python environment. "
            "Start the backend from your project virtualenv or install pyodbc."
        )
    return pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={os.getenv('DB_SERVER')};"
        f"DATABASE={os.getenv('DB_NAME')};"
        f"UID={os.getenv('DB_USER')};"
        f"PWD={os.getenv('DB_PASSWORD')};"
        "Encrypt=yes;"
        "TrustServerCertificate=yes;"
    )

# Test and Development: uvicorn backend.main:app --reload --port 8000
# .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000

# TODO: lock this down to specific origins in production.
origins_env = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173, http://localhost:5174, http://127.0.0.1:5174")
origins = [o.strip() for o in origins_env.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Mock data (in-memory)
# -----------------------------
# These are stand-ins for Azure DB calls. They let the frontend integrate end-to-end
# while the database layer is being built.
# TODO (Azure DB): Replace these with calls to your Azure database and/or services.
projects: Dict[str, Dict[str, Any]] = {
    "1": {"id": 1, "title": "Team Alpha Capstone", "latestMeetingAt": "2026-03-10T14:00:00Z"},
    "2": {"id": 2, "title": "Team Beta Capstone", "latestMeetingAt": "2026-03-08T10:30:00Z"},
}

# Dashboard project listing (mock)
# NOTE: `path` is intentionally shaped like your OneDrive-style reference: `YYYY/term/name`.
# TODO (Azure DB): Replace this list with an Azure DB query that returns all visible projects.
dashboard_projects: List[Dict[str, Any]] = [
    {"id": 1, "path": "2026/spring/team-alpha-capstone", "name": "Team Alpha Capstone"},
    {"id": 2, "path": "2026/spring/team-beta-capstone", "name": "Team Beta Capstone"},
    {"id": 3, "path": "2025/fall/team-gamma-capstone", "name": "Team Gamma Capstone"},
    {"id": 4, "path": "2025/spring/team-delta-capstone", "name": "Team Delta Capstone"},
]


def _slugify_project_name(name: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", str(name).strip().lower())
    return normalized.strip("-") or "project"


def _resolve_projects_table(cursor: Any) -> Optional[str]:
    """
    Find the projects table in SQL Server by name (project/projects), returning
    a safely-bracketed fully-qualified identifier, e.g. [dbo].[Project].
    """
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('projects', 'project')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def get_projects_from_db() -> List[Dict[str, Any]]:
    """
    Returns dashboard project entries from Azure SQL in frontend shape:
      - id: project_id
      - path: "{project_year}/{project_semester}/{slug(project_name)}"
      - name: project_name
    """
    logger.info("[projects] starting DB retrieval from Projects table")
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        table_name = _resolve_projects_table(cursor)
        if not table_name:
            raise RuntimeError("Could not find a 'Project'/'Projects' table in the current database.")

        logger.info("[projects] resolved source table=%s", table_name)
        cursor.execute(
            f"""
            SELECT
                project_id,
                project_name,
                project_semester,
                project_year
            FROM {table_name}
            ORDER BY
                project_year DESC,
                CASE UPPER(project_semester)
                    WHEN 'SPRING' THEN 1
                    WHEN 'SUMMER' THEN 2
                    WHEN 'FALL' THEN 3
                    WHEN 'WINTER' THEN 4
                    ELSE 5
                END DESC,
                project_id DESC
            """
        )
        rows = cursor.fetchall()
        logger.info("[projects] DB query completed; rows fetched=%s", len(rows))
        result: List[Dict[str, Any]] = []
        for row in rows:
            project_id = int(row.project_id)
            project_name = str(row.project_name or f"Project {project_id}").strip()
            semester = str(row.project_semester or "").strip().lower()
            year = str(row.project_year or "").strip()
            result.append(
                {
                    "id": project_id,
                    "path": f"{year}/{semester}/{_slugify_project_name(project_name)}",
                    "name": project_name,
                }
            )
        logger.info("[projects] mapped response payload=%s", result)
        return result
    finally:
        conn.close()

def _find_dashboard_project(project_id: str) -> Optional[Dict[str, Any]]:
    try:
        pid = int(project_id)
    except ValueError:
        return None
    for p in dashboard_projects:
        if p.get("id") == pid:
            return p
    return None

meetings: Dict[str, List[Dict[str, Any]]] = {
    "1": [
        {
            "id": "mtg-001",
            "meetingDate": "2026-03-10T14:00:00Z",
            "duration": "47 min",
            "details": "Talked about the API stuff and whether we can actually hit the deadline or not.",
            "riskLevel": "yellow",
            "reportId": "rpt-001",
        },
        {
            "id": "mtg-002",
            "meetingDate": "2026-03-03T14:00:00Z",
            "duration": "32 min",
            "details": "Kickoff meeting, went over the scope doc and split up tasks.",
            "riskLevel": "green",
            "reportId": "rpt-002",
        },
        {
            "id": "mtg-003",
            "meetingDate": "2026-02-24T14:00:00Z",
            "duration": "55 min",
            "details": "Long one about the database and whether Power Automate is even gonna work for us.",
            "riskLevel": "red",
            "reportId": "rpt-003",
        },
    ],
    "2": [
        {
            "id": "mtg-004",
            "meetingDate": "2026-03-08T10:30:00Z",
            "duration": "40 min",
            "details": "Quick sync, looked at the mockups and talked about testing.",
            "riskLevel": "green",
            "reportId": "rpt-004",
        }
    ],
}

reports: Dict[str, Dict[str, Any]] = {
    "rpt-001": {
        "id": "rpt-001",
        "meetingId": "mtg-001",
        "description": (
            "Sprint review: API ~60% done; scope creep on notifications and pipeline deadline concerns."
        ),
        "risks": [
            {
                "id": "flag-001",
                "flagType": "Scope Creep",
                "explanation": "Someone brought up adding push notifications which is not in the spec at all.",
                "status": "pending",
            },
            {
                "id": "flag-002",
                "flagType": "Timeline Risk",
                "explanation": "A couple people said the March 15 deadline for the pipeline is not gonna happen.",
                "status": "pending",
            },
        ],
        "details": (
            "Sprint review for backend API work. FastAPI endpoints are like 60% done. "
            "The team wants to add push notifications which wasn't in the original scope. "
            "There were also concerns about hitting the pipeline deadline."
        ),
        "references": [
            {
                "timestamp": "03:23",
                "text": '"I think we should add push notifications too"',
                "riskId": "flag-001",
            },
            {
                "timestamp": "12:45",
                "text": '"I don\'t think we can hit the March 15 deadline"',
                "riskId": "flag-002",
            },
            {
                "timestamp": "18:02",
                "text": '"Let\'s just add it, we can figure out scope later"',
                "riskId": "flag-001",
            },
            {
                "timestamp": "31:10",
                "text": '"We need to talk to the sponsor about the timeline"',
                "riskId": "flag-002",
            },
        ],
    },
    "rpt-002": {
        "id": "rpt-002",
        "meetingId": "mtg-002",
        "description": "Kickoff: roles, scope doc, and task split — no risks flagged.",
        "risks": [],
        "details": (
            "Normal kickoff meeting. Went over the scope doc, talked about roles, handed out tasks. "
            "Nothing flagged."
        ),
        "references": [
            {"timestamp": "02:10", "text": '"Let\'s go around and confirm everyone\'s role"'},
            {"timestamp": "15:30", "text": '"The scope doc looks good to me"'},
        ],
    },
    "rpt-003": {
        "id": "rpt-003",
        "meetingId": "mtg-003",
        "description": "Architecture debate: migration shortcuts, Mongo vs SQL, and Power Automate blocked by IT.",
        "risks": [
            {
                "id": "flag-003",
                "flagType": "Conduct Concern",
                "explanation": "Someone suggested skipping the database migration to save time which goes against the project spec.",
                "status": "pending",
            },
            {
                "id": "flag-004",
                "flagType": "Scope Creep",
                "explanation": "There was talk about switching to MongoDB which is a big departure from the approved design.",
                "status": "dismissed",
            },
            {
                "id": "flag-005",
                "flagType": "Timeline Risk",
                "explanation": "Power Automate integration is completely stuck because IT hasn't given us permissions.",
                "status": "confirmed",
            },
        ],
        "details": (
            "Big architecture debate. Someone wanted to skip the DB migration which got flagged. "
            "Also some talk about ditching Azure SQL for Mongo. Power Automate is blocked on IT permissions "
            "which is holding things up."
        ),
        "references": [
            {
                "timestamp": "05:15",
                "text": '"Can we just skip the migration and write to the new schema?"',
                "riskId": "flag-003",
            },
            {
                "timestamp": "14:40",
                "text": '"What if we just use MongoDB instead?"',
                "riskId": "flag-004",
            },
            {
                "timestamp": "28:55",
                "text": '"Power Automate is completely blocked right now"',
                "riskId": "flag-005",
            },
            {
                "timestamp": "42:30",
                "text": '"We might need a manual upload fallback"',
                "riskId": "flag-005",
            },
        ],
    },
    "rpt-004": {
        "id": "rpt-004",
        "meetingId": "mtg-004",
        "description": "Weekly sync on mockups and testing — on track.",
        "risks": [],
        "details": "Quick weekly sync. Looked at mockups, talked testing. Everything on track, nothing flagged.",
        "references": [
            {"timestamp": "08:20", "text": '"Mockups look good, let\'s start building"'},
        ],
    },
}


class FlagUpdateRequest(BaseModel):
    status: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    # Matches the DB column `user_role` (the frontend/test is expected to provide it).
    role: int = 0

class LoginRequest(BaseModel):
    email: str
    password: str


class CreateProjectRequest(BaseModel):
    project_name: str
    project_semester: str
    project_sponsor: str
    project_advisor: int
    project_description: str
    project_year: int


def _resolve_users_table(cursor: Any) -> Optional[str]:
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('users', 'user')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def _resolve_reports_table(cursor: Any) -> Optional[str]:
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('reports', 'report')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def _resolve_meetings_table(cursor: Any) -> Optional[str]:
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('meetings', 'meeting')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def _get_table_column_names(cursor: Any, qualified_table: str) -> List[str]:
    schema, table = [part.strip("[]") for part in qualified_table.split(".")]
    cursor.execute(
        """
        SELECT LOWER(COLUMN_NAME) AS column_name
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        """,
        schema,
        table,
    )
    return [str(r.column_name) for r in cursor.fetchall()]


def _resolve_risk_table(cursor: Any) -> Optional[str]:
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('risk', 'risks')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def _resolve_risk_generic_table(cursor: Any) -> Optional[str]:
    """Generic risk catalog (e.g. RiskTable) — optional join from RISK."""
    cursor.execute(
        """
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
          AND LOWER(TABLE_NAME) IN ('risktable', 'risk_table')
        ORDER BY CASE WHEN TABLE_SCHEMA = 'dbo' THEN 0 ELSE 1 END, TABLE_NAME
        """
    )
    row = cursor.fetchone()
    if not row:
        return None
    return f"[{row.TABLE_SCHEMA}].[{row.TABLE_NAME}]"


def _normalize_risk_status_for_ui(raw: Optional[str]) -> str:
    if not raw:
        return "pending"
    s = str(raw).strip().lower()
    if s in ("pending", "confirmed", "dismissed"):
        return s
    if "confirm" in s:
        return "confirmed"
    if "dismiss" in s:
        return "dismissed"
    if "pending" in s:
        return "pending"
    return "pending"


def parse_transcript_excerpt_to_reference(raw: Optional[str]) -> Optional[Dict[str, str]]:
    """
    Parse WebVTT-style transcript lines stored in RISK.transcript_excerpt.

    Example:
      '4517b017-.../111-0 00:06:11.707 --> 00:06:18.187 <v Name>spoken text</v>'

    Returns dict with excerpt_id, timestamp (display), text (spoken content).
    """
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None

    time_re = re.compile(
        r"\s*(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})"
    )
    tm = time_re.search(s)
    if not tm:
        return {"excerpt_id": "", "timestamp": "", "text": s}

    excerpt_id = s[: tm.start()].strip()
    ts_display = f"{tm.group(1)} → {tm.group(2)}"
    tail = s[tm.end() :].strip()

    voice_re = re.compile(r"<v\s+([^>]+)>(.*?)</v>", re.DOTALL | re.IGNORECASE)
    vm = voice_re.search(tail)
    if vm:
        speaker = vm.group(1).strip()
        spoken = " ".join(vm.group(2).split())
        text = f"[{speaker}] {spoken}" if speaker else spoken
    else:
        text = " ".join(tail.split())

    return {
        "excerpt_id": excerpt_id,
        "timestamp": ts_display,
        "text": text,
    }


def _fetch_risks_for_report(cursor: Any, report_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Load risks linked to a report from RISK (and optionally enrich from RiskTable).
    Frontend expects: id, flagType, explanation, status (pending|confirmed|dismissed).
    """
    risk_table = _resolve_risk_table(cursor)
    if not risk_table:
        return [], []

    cols = set(_get_table_column_names(cursor, risk_table))
    rid_col = "risk_id" if "risk_id" in cols else ("id" if "id" in cols else None)
    rep_col = "report_id" if "report_id" in cols else None
    if not rid_col or not rep_col:
        return [], []

    flag_col = "flag_type" if "flag_type" in cols else None
    excerpt_col = "transcript_excerpt" if "transcript_excerpt" in cols else None
    conf_col = "confidence_score" if "confidence_score" in cols else None
    status_col = "status" if "status" in cols else None

    # Optional FK to generic RiskTable
    fk_to_generic = None
    for cand in ("risk_table_id", "generic_risk_id", "risktable_id"):
        if cand in cols:
            fk_to_generic = cand
            break

    generic_table = _resolve_risk_generic_table(cursor) if fk_to_generic else None
    join_sql = ""
    select_extra = ""
    if generic_table and fk_to_generic:
        gcols = set(_get_table_column_names(cursor, generic_table))
        g_pk = "id" if "id" in gcols else None
        content_col = "risk_content" if "risk_content" in gcols else None
        sev_col = "risk_sevarity" if "risk_sevarity" in gcols else ("risk_severity" if "risk_severity" in gcols else None)
        if g_pk and content_col:
            join_sql = f" LEFT JOIN {generic_table} g ON r.{fk_to_generic} = g.[{g_pk}]"
            select_extra = f", g.[{content_col}] AS generic_content"
            if sev_col:
                select_extra += f", g.[{sev_col}] AS generic_severity"

    select_parts = [f"r.[{rid_col}]", f"r.[{rep_col}]"]
    if flag_col:
        select_parts.append(f"r.[{flag_col}]")
    if excerpt_col:
        select_parts.append(f"r.[{excerpt_col}]")
    if conf_col:
        select_parts.append(f"r.[{conf_col}]")
    if status_col:
        select_parts.append(f"r.[{status_col}]")

    sql = f"""
        SELECT {", ".join(select_parts)}{select_extra}
        FROM {risk_table} r{join_sql}
        WHERE r.[{rep_col}] = ?
        ORDER BY r.[{rid_col}] ASC
    """

    cursor.execute(sql, report_id)
    desc = cursor.description
    rows = cursor.fetchall()
    if not rows or not desc:
        return [], []

    colnames = [str(c[0]).lower() for c in desc]

    result: List[Dict[str, Any]] = []
    references_out: List[Dict[str, Any]] = []
    for row in rows:
        d = {colnames[i]: row[i] for i in range(len(colnames))}
        rid = d.get("risk_id") if "risk_id" in d else d.get("id")
        flag_type = str(d.get("flag_type") or "").strip()
        excerpt = str(d.get("transcript_excerpt") or "").strip()
        conf = d.get("confidence_score")
        status_raw = d.get("status")
        generic_content = str(d.get("generic_content") or "").strip()
        generic_sev = d.get("generic_severity")

        parsed_ref = parse_transcript_excerpt_to_reference(excerpt if excerpt else None)
        if parsed_ref and (parsed_ref.get("timestamp") or parsed_ref.get("text")):
            references_out.append(
                {
                    "timestamp": parsed_ref.get("timestamp") or "",
                    "text": parsed_ref.get("text") or "",
                    "excerptId": parsed_ref.get("excerpt_id") or "",
                    "riskId": str(rid),
                }
            )

        explanation_parts: List[str] = []
        if flag_type:
            explanation_parts.append(flag_type)
        if parsed_ref and parsed_ref.get("text"):
            explanation_parts.append(parsed_ref["text"])
        elif excerpt:
            explanation_parts.append(excerpt[:500] + ("…" if len(excerpt) > 500 else ""))
        elif generic_content:
            explanation_parts.append(generic_content)
        if conf is not None and str(conf).strip() != "":
            try:
                explanation_parts.append(f"Confidence: {int(float(conf))}%")
            except (TypeError, ValueError):
                explanation_parts.append(f"Confidence: {conf}")
        if generic_sev is not None and str(generic_sev).strip() != "":
            explanation_parts.append(f"Severity: {generic_sev}")

        explanation = " — ".join(explanation_parts) if explanation_parts else "Risk"

        result.append(
            {
                "id": str(rid),
                "flagType": flag_type or "Risk",
                "explanation": explanation,
                "status": _normalize_risk_status_for_ui(status_raw if status_raw is not None else None),
            }
        )
    return result, references_out


def get_advisors_from_db() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        table_name = _resolve_users_table(cursor)
        if not table_name:
            raise RuntimeError("Could not find a 'User'/'Users' table in the current database.")

        cursor.execute(
            f"""
            SELECT user_id, user_name, user_email
            FROM {table_name}
            ORDER BY user_name ASC
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "id": int(r.user_id),
                "name": str(r.user_name or "").strip(),
                "email": str(r.user_email or "").strip(),
            }
            for r in rows
        ]
    finally:
        conn.close()


def _first_present_column(columns: set, candidates: Tuple[str, ...]) -> Optional[str]:
    for c in candidates:
        if c in columns:
            return c
    return None


def _normalize_risk_score_value(raw: Any) -> int:
    """Map DB value to UI risk score 0 (none) – 3 (high)."""
    if raw is None:
        return 0
    if isinstance(raw, (int, float)) and not isinstance(raw, bool):
        try:
            return max(0, min(3, int(raw)))
        except (TypeError, ValueError):
            pass
    s = str(raw).strip().lower()
    mapping = {
        "0": 0,
        "none": 0,
        "no_risk": 0,
        "norisk": 0,
        "1": 1,
        "low": 1,
        "green": 1,
        "2": 2,
        "moderate": 2,
        "medium": 2,
        "yellow": 2,
        "3": 3,
        "high": 3,
        "red": 3,
    }
    if s in mapping:
        return mapping[s]
    try:
        return max(0, min(3, int(float(s))))
    except ValueError:
        return 0


def _iso_date_maybe(val: Any) -> Optional[str]:
    if val is None:
        return None
    if hasattr(val, "isoformat"):
        try:
            return val.isoformat()
        except Exception:
            pass
    text = str(val).strip()
    return text or None


def _row_to_project_report_summary(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    rid = row_dict.get("report_id")
    if rid is None:
        rid = row_dict.get("id")
    raw_score = row_dict.get("risk_score")
    if raw_score is None:
        raw_score = row_dict.get("report_risk_score")
    if raw_score is None:
        raw_score = row_dict.get("risk_level")
    risk_score = _normalize_risk_score_value(raw_score)
    report_date = row_dict.get("rdate") or row_dict.get("mdate")
    out: Dict[str, Any] = {"id": str(rid), "riskScore": risk_score}
    iso = _iso_date_maybe(report_date)
    if iso:
        out["reportDate"] = iso
    desc_raw = row_dict.get("rdesc")
    if desc_raw is not None and str(desc_raw).strip():
        out["description"] = str(desc_raw).strip()
    return out


def get_project_reports_from_db(project_id: int) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        reports_table = _resolve_reports_table(cursor)
        if not reports_table:
            raise RuntimeError("Could not find a 'Report'/'Reports' table in the current database.")

        columns = set(_get_table_column_names(cursor, reports_table))
        report_id_col = "report_id" if "report_id" in columns else ("id" if "id" in columns else None)
        if not report_id_col:
            raise RuntimeError("Reports table is missing a report_id/id column.")

        select_aliases = [f"r.[{report_id_col}] AS report_id"]

        # Prefer report_risk_score (Azure schema) then generic risk_score
        rs_col = _first_present_column(columns, ("report_risk_score", "risk_score"))
        rl_col = _first_present_column(columns, ("risk_level",)) if rs_col is None else None
        if rs_col:
            select_aliases.append(f"r.[{rs_col}] AS risk_score")
        elif rl_col:
            select_aliases.append(f"r.[{rl_col}] AS risk_level")

        date_col_r = _first_present_column(
            columns,
            ("report_date", "created_at", "meeting_date", "date"),
        )
        if date_col_r:
            select_aliases.append(f"r.[{date_col_r}] AS rdate")

        desc_col = _first_present_column(
            columns,
            ("report_description", "description", "summary", "report_summary"),
        )
        if desc_col:
            select_aliases.append(f"r.[{desc_col}] AS rdesc")

        select_sql = ", ".join(select_aliases)

        if "project_id" in columns:
            sql = f"""
                SELECT {select_sql}
                FROM {reports_table} r
                WHERE r.project_id = ?
                ORDER BY r.[{report_id_col}] DESC
                """
            cursor.execute(sql, project_id)
        elif "meeting_id" in columns:
            meetings_table = _resolve_meetings_table(cursor)
            if not meetings_table:
                raise RuntimeError("Could not find a 'Meeting'/'Meetings' table in the current database.")

            meeting_cols = set(_get_table_column_names(cursor, meetings_table))
            if "project_id" not in meeting_cols:
                raise RuntimeError("Meetings table is missing project_id column for report linkage.")
            meeting_id_col = "meeting_id" if "meeting_id" in meeting_cols else ("id" if "id" in meeting_cols else None)
            if not meeting_id_col:
                raise RuntimeError("Meetings table is missing meeting_id/id column for report linkage.")

            m_date_col = _first_present_column(
                meeting_cols,
                ("meeting_date", "start_time", "date", "created_at"),
            )
            join_select = list(select_aliases)
            if m_date_col:
                join_select.append(f"m.[{m_date_col}] AS mdate")
            select_sql_join = ", ".join(join_select)

            sql = f"""
                SELECT {select_sql_join}
                FROM {reports_table} r
                INNER JOIN {meetings_table} m
                    ON r.[meeting_id] = m.[{meeting_id_col}]
                WHERE m.project_id = ?
                ORDER BY r.[{report_id_col}] DESC
                """
            cursor.execute(sql, project_id)
        else:
            raise RuntimeError("Reports table has neither project_id nor meeting_id linkage columns.")

        fetched = cursor.fetchall()
        desc = cursor.description
        if not desc:
            return []
        names = [str(d[0]).lower() for d in desc]
        out: List[Dict[str, Any]] = []
        for row in fetched:
            row_dict = dict(zip(names, row))
            out.append(_row_to_project_report_summary(row_dict))
        return out
    finally:
        conn.close()


@app.get("/api/ping", response_class=PlainTextResponse)
def ping() -> str:
    return "hey it works!"





@app.get("/api/projects")
def list_projects() -> List[Dict[str, Any]]:
    """
    Returns projects for the dashboard list.

    Fields:
      - id: numeric project id
      - path: OneDrive-style path identifier: YYYY/term/name
      - name: display name

    Loaded from Azure SQL `Projects` table only.
    """
    try:
        projects = get_projects_from_db()
        logger.info("[projects] returning %s projects to client", len(projects))
        return projects
    except Exception as exc:
        logger.exception("[projects] database error while loading projects")
        message = str(exc)
        # Azure SQL transient outage / unavailable DB.
        if "40613" in message or "not currently available" in message.lower():
            raise HTTPException(
                status_code=503,
                detail="Azure SQL database is temporarily unavailable. Please retry shortly.",
            )
        raise HTTPException(status_code=500, detail=f"Database error while loading projects: {exc}")


@app.get("/api/advisors")
def list_advisors() -> List[Dict[str, Any]]:
    try:
        advisors = get_advisors_from_db()
        logger.info("[advisors] returning %s advisors to client", len(advisors))
        return advisors
    except Exception as exc:
        logger.exception("[advisors] database error while loading advisors")
        raise HTTPException(status_code=500, detail=f"Database error while loading advisors: {exc}")


@app.post("/api/projects")
def create_project(payload: CreateProjectRequest) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        projects_table = _resolve_projects_table(cursor)
        if not projects_table:
            raise RuntimeError("Could not find a 'Project'/'Projects' table in the current database.")

        project_name = payload.project_name.strip()
        project_semester = payload.project_semester.strip().upper()
        project_year = int(payload.project_year)

        # Prevent duplicates for the same project name + semester + year.
        cursor.execute(
            f"""
            SELECT 1
            FROM {projects_table}
            WHERE LOWER(LTRIM(RTRIM(project_name))) = LOWER(LTRIM(RTRIM(?)))
              AND UPPER(LTRIM(RTRIM(project_semester))) = UPPER(LTRIM(RTRIM(?)))
              AND project_year = ?
            """,
            project_name,
            project_semester,
            project_year,
        )
        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail=(
                    "A project with the same name, semester, and year already exists. "
                    "Use a different semester/year or change the project name."
                ),
            )

        cursor.execute(
            f"""
            INSERT INTO {projects_table}
                (project_name, project_semester, project_sponsor, project_advisor, project_description, project_year)
            OUTPUT INSERTED.project_id
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            project_name,
            project_semester,
            payload.project_sponsor.strip(),
            payload.project_advisor,
            payload.project_description.strip(),
            project_year,
        )
        inserted = cursor.fetchone()
        conn.commit()
        project_id = int(inserted[0]) if inserted else None
        return {"message": "Project Created", "project_id": project_id}
    except HTTPException:
        conn.rollback()
        raise
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while creating project: {exc}")
    finally:
        conn.close()


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> Dict[str, Any]:
    try:
        pid = int(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project id")

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        projects_table = _resolve_projects_table(cursor)
        if not projects_table:
            raise RuntimeError("Could not find a 'Project'/'Projects' table in the current database.")

        cursor.execute(
            f"""
            SELECT project_id, project_name
            FROM {projects_table}
            WHERE project_id = ?
            """,
            pid,
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")

        return {
            "id": int(row.project_id),
            "title": str(row.project_name or f"Project {row.project_id}"),
        }
    finally:
        conn.close()


@app.get("/api/projects/{project_id}/meetings")
def get_project_meetings(project_id: str) -> List[Dict[str, Any]]:
    # TODO (Azure DB): Replace in-memory lookup with Azure DB query.
    return meetings.get(project_id, [])


@app.get("/api/projects/{project_id}/reports")
def get_project_reports(project_id: str) -> List[Dict[str, Any]]:
    try:
        pid = int(project_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid project id")
    try:
        return get_project_reports_from_db(pid)
    except Exception as exc:
        logger.exception("[reports] database error while loading project reports")
        raise HTTPException(status_code=500, detail=f"Database error while loading project reports: {exc}")


@app.get("/api/reports/{report_id}")
def get_report(report_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        reports_table = _resolve_reports_table(cursor)
        if not reports_table:
            raise RuntimeError("Could not find a 'Report'/'Reports' table in the current database.")

        columns = set(_get_table_column_names(cursor, reports_table))
        report_id_col = "report_id" if "report_id" in columns else ("id" if "id" in columns else None)
        if not report_id_col:
            raise RuntimeError("Reports table is missing report_id/id column.")

        has_long = "details" in columns
        has_short = "report_description" in columns
        if has_long and has_short:
            cursor.execute(
                f"""
                SELECT r.[{report_id_col}], r.[report_description], r.[details]
                FROM {reports_table} r
                WHERE r.[{report_id_col}] = ?
                """,
                report_id,
            )
        elif has_long:
            cursor.execute(
                f"""
                SELECT [{report_id_col}], [details]
                FROM {reports_table}
                WHERE [{report_id_col}] = ?
                """,
                report_id,
            )
        elif has_short:
            cursor.execute(
                f"""
                SELECT [{report_id_col}], [report_description]
                FROM {reports_table}
                WHERE [{report_id_col}] = ?
                """,
                report_id,
            )
        else:
            cursor.execute(
                f"""
                SELECT [{report_id_col}]
                FROM {reports_table}
                WHERE [{report_id_col}] = ?
                """,
                report_id,
            )

        row = cursor.fetchone()
        if not row:
            # Legacy fallback for existing mock IDs like rpt-001
            report: Optional[Dict[str, Any]] = reports.get(report_id)
            if report:
                return report
            raise HTTPException(status_code=404, detail="Report not found")

        description_value = ""
        details_value = ""
        if has_long and has_short and row is not None and len(row) > 2:
            description_value = str(row[1]).strip() if row[1] is not None else ""
            details_value = str(row[2]).strip() if row[2] is not None else ""
        elif has_long and row is not None and len(row) > 1:
            details_value = str(row[1]).strip() if row[1] is not None else ""
        elif has_short and row is not None and len(row) > 1:
            v = str(row[1]).strip() if row[1] is not None else ""
            details_value = v
            description_value = v

        risks, reference_points = _fetch_risks_for_report(cursor, report_id)
        payload: Dict[str, Any] = {
            "id": str(row[0]),
            "risks": risks,
            "details": details_value,
            "references": reference_points,
        }
        if description_value:
            payload["description"] = description_value
        return payload
    finally:
        conn.close()


def _update_flag_in_reports(flag_id: str, new_status: str) -> bool:
    updated = False
    for report in reports.values():
        for risk in report.get("risks", []):
            if risk.get("id") == flag_id:
                risk["status"] = new_status
                updated = True
    return updated


def _map_ui_status_to_db_risk_status(ui: str) -> str:
    """Frontend sends lowercase; DB sample uses Title Case (Pending, etc.)."""
    s = (ui or "").strip().lower()
    if s == "confirmed":
        return "Confirmed"
    if s == "dismissed":
        return "Dismissed"
    if s == "pending":
        return "Pending"
    return str(ui or "").strip() or "Pending"


def _update_risk_status_in_db(flag_id: str, new_status: str) -> bool:
    """Update RISK.status for the given risk id."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        risk_table = _resolve_risk_table(cursor)
        if not risk_table:
            return False
        cols = set(_get_table_column_names(cursor, risk_table))
        rid_col = "risk_id" if "risk_id" in cols else ("id" if "id" in cols else None)
        if not rid_col or "status" not in cols:
            return False

        db_status = _map_ui_status_to_db_risk_status(new_status)
        rid_val: Any = flag_id
        try:
            if str(flag_id).strip().isdigit():
                rid_val = int(str(flag_id).strip())
        except (TypeError, ValueError):
            pass

        cursor.execute(
            f"SELECT 1 FROM {risk_table} WHERE [{rid_col}] = ?",
            rid_val,
        )
        if not cursor.fetchone():
            conn.rollback()
            return False

        cursor.execute(
            f"""
            UPDATE {risk_table}
            SET [status] = ?
            WHERE [{rid_col}] = ?
            """,
            db_status,
            rid_val,
        )
        conn.commit()
        return True
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.patch("/api/flags/{flag_id}")
def update_flag_status(flag_id: str, payload: FlagUpdateRequest) -> Dict[str, Any]:
    allowed = {"pending", "confirmed", "dismissed"}
    incoming = (payload.status or "").strip().lower()
    if incoming not in allowed:
        raise HTTPException(
            status_code=400,
            detail="status must be one of: pending, confirmed, dismissed",
        )

    if _update_risk_status_in_db(flag_id, payload.status):
        return {"id": flag_id, "status": incoming}

    if _update_flag_in_reports(flag_id, incoming):
        return {"id": flag_id, "status": incoming}

    raise HTTPException(status_code=404, detail="Flag / risk not found")


@app.post("/api/reports/{report_id}/email")
def email_report(report_id: str) -> Dict[str, Any]:
    # Potential email service usage:
    _ = report_id
    return {"success": True}

@app.post("/api/register")
def register_user(payload: RegisterRequest):
    from backend.auth_utils import hash_password

    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM USERS WHERE user_name = ?", payload.username)
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = hash_password(payload.password)

    cursor.execute("""
        INSERT INTO Users (user_name, user_email, user_password, user_role)
        VALUES (?, ?, ?, ?)
    """, payload.username, payload.email, hashed_pw, payload.role)

    conn.commit()
    conn.close()
    return {"message": "User Created"}

@app.post("/api/login")
def login_user(payload: LoginRequest):
    from backend.auth_utils import verify_password

    email = (payload.email or "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT user_id, user_name, user_email, user_password, user_role
        FROM Users
        WHERE LOWER(LTRIM(RTRIM(user_email))) = LOWER(LTRIM(RTRIM(?)))
        """,
        email,
    )

    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id, user_name, user_email, stored_hash, role = row

    if not verify_password(payload.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "message": "Login successful",
        "user": {
            "id": int(user_id),
            "name": str(user_name or "").strip(),
            "email": str(user_email or "").strip(),
            "role": role,
        },
    }