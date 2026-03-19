from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

import os
from typing import Any, Dict, List, Optional

app = FastAPI(title="MI Platform API", version="0.1.0")

# Test and Development: uvicorn backend.main:app --reload --port 8000

# TODO: lock this down to specific origins in production.
origins_env = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
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
            {"timestamp": "03:23", "text": '"I think we should add push notifications too"'},
            {"timestamp": "12:45", "text": '"I don\'t think we can hit the March 15 deadline"'},
            {"timestamp": "18:02", "text": '"Let\'s just add it, we can figure out scope later"'},
            {"timestamp": "31:10", "text": '"We need to talk to the sponsor about the timeline"'},
        ],
    },
    "rpt-002": {
        "id": "rpt-002",
        "meetingId": "mtg-002",
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
            {"timestamp": "05:15", "text": '"Can we just skip the migration and write to the new schema?"'},
            {"timestamp": "14:40", "text": '"What if we just use MongoDB instead?"'},
            {"timestamp": "28:55", "text": '"Power Automate is completely blocked right now"'},
            {"timestamp": "42:30", "text": '"We might need a manual upload fallback"'},
        ],
    },
    "rpt-004": {
        "id": "rpt-004",
        "meetingId": "mtg-004",
        "risks": [],
        "details": "Quick weekly sync. Looked at mockups, talked testing. Everything on track, nothing flagged.",
        "references": [
            {"timestamp": "08:20", "text": '"Mockups look good, let\'s start building"'},
        ],
    },
}


class FlagUpdateRequest(BaseModel):
    status: str


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

    TODO (Azure DB): fetch from Azure DB; `path` should match the stored OneDrive reference.
    """
    return dashboard_projects


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> Dict[str, Any]:
    # TODO (Azure DB): Replace lookups with Azure DB query.
    #
    # IMPORTANT: A project should be able to exist without any meetings/reports.
    # If it's listed in `dashboard_projects`, it should be considered a valid project.
    project: Optional[Dict[str, Any]] = projects.get(project_id)
    if project:
        return project

    dash = _find_dashboard_project(project_id)
    if dash:
        # Minimal shape expected by the frontend. `latestMeetingAt` may be missing when no meetings exist.
        return {"id": dash["id"], "title": dash.get("name", f"Project {dash['id']}")}

    raise HTTPException(status_code=404, detail="Project not found")


@app.get("/api/projects/{project_id}/meetings")
def get_project_meetings(project_id: str) -> List[Dict[str, Any]]:
    # TODO (Azure DB): Replace in-memory lookup with Azure DB query.
    return meetings.get(project_id, [])


@app.get("/api/reports/{report_id}")
def get_report(report_id: str) -> Dict[str, Any]:
    # TODO (Azure DB): Replace in-memory lookup with Azure DB query.
    report: Optional[Dict[str, Any]] = reports.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


def _update_flag_in_reports(flag_id: str, new_status: str) -> bool:
    updated = False
    for report in reports.values():
        for risk in report.get("risks", []):
            if risk.get("id") == flag_id:
                risk["status"] = new_status
                updated = True
    return updated


@app.patch("/api/flags/{flag_id}")
def update_flag_status(flag_id: str, payload: FlagUpdateRequest) -> Dict[str, Any]:
    # TODO (Azure DB): Replace with Azure DB update and return the updated flag DTO.
    updated = _update_flag_in_reports(flag_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Flag not found")
    return {"id": flag_id, "status": payload.status}


@app.post("/api/reports/{report_id}/email")
def email_report(report_id: str) -> Dict[str, Any]:
    # TODO (Azure DB + Email service): Send the report via an email provider (e.g., SendGrid)
    # and track delivery status in Azure DB.
    _ = report_id
    return {"success": True}

