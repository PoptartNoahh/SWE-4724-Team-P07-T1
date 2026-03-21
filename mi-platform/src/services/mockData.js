// fake data for now, swap out when backend is ready

export const projects = {
  1: {
    id: 1,
    title: 'Team Alpha Capstone',
    latestMeetingAt: '2026-03-10T14:00:00Z',
  },
  2: {
    id: 2,
    title: 'Team Beta Capstone',
    latestMeetingAt: '2026-03-08T10:30:00Z',
  },
}

export const meetings = {
  1: [
    {
      id: 'mtg-001',
      meetingDate: '2026-03-10T14:00:00Z',
      duration: '47 min',
      details: 'Talked about the API stuff and whether we can actually hit the deadline or not.',
      riskLevel: 'yellow',
      reportId: 'rpt-001',
    },
    {
      id: 'mtg-002',
      meetingDate: '2026-03-03T14:00:00Z',
      duration: '32 min',
      details: 'Kickoff meeting, went over the scope doc and split up tasks.',
      riskLevel: 'green',
      reportId: 'rpt-002',
    },
    {
      id: 'mtg-003',
      meetingDate: '2026-02-24T14:00:00Z',
      duration: '55 min',
      details: 'Long one about the database and whether Power Automate is even gonna work for us.',
      riskLevel: 'red',
      reportId: 'rpt-003',
    },
  ],
  2: [
    {
      id: 'mtg-004',
      meetingDate: '2026-03-08T10:30:00Z',
      duration: '40 min',
      details: 'Quick sync, looked at the mockups and talked about testing.',
      riskLevel: 'green',
      reportId: 'rpt-004',
    },
  ],
}

export const reports = {
  'rpt-001': {
    id: 'rpt-001',
    meetingId: 'mtg-001',
    /** Short blurb for project report cards */
    description:
      'Sprint review: API ~60% done; scope creep on notifications and pipeline deadline concerns.',
    /** 0 = none, 1 = low, 2 = moderate, 3 = high */
    riskScore: 2,
    reportDate: '2026-03-10T14:00:00Z',
    risks: [
      {
        id: 'flag-001',
        flagType: 'Scope Creep',
        explanation: 'Someone brought up adding push notifications which is not in the spec at all.',
        status: 'pending',
      },
      {
        id: 'flag-002',
        flagType: 'Timeline Risk',
        explanation: 'A couple people said the March 15 deadline for the pipeline is not gonna happen.',
        status: 'pending',
      },
    ],
    details:
      'Sprint review for backend API work. FastAPI endpoints are like 60% done. The team wants to add push notifications which wasn\'t in the original scope. There were also concerns about hitting the pipeline deadline.',
    references: [
      {
        timestamp: '03:23',
        text: '"I think we should add push notifications too"',
        riskId: 'flag-001',
      },
      {
        timestamp: '12:45',
        text: '"I don\'t think we can hit the March 15 deadline"',
        riskId: 'flag-002',
      },
      {
        timestamp: '18:02',
        text: '"Let\'s just add it, we can figure out scope later"',
        riskId: 'flag-001',
      },
      {
        timestamp: '31:10',
        text: '"We need to talk to the sponsor about the timeline"',
        riskId: 'flag-002',
      },
    ],
  },
  'rpt-002': {
    id: 'rpt-002',
    meetingId: 'mtg-002',
    description: 'Kickoff: roles, scope doc, and task split — no risks flagged.',
    riskScore: 0,
    reportDate: '2026-03-03T14:00:00Z',
    risks: [],
    details:
      'Normal kickoff meeting. Went over the scope doc, talked about roles, handed out tasks. Nothing flagged.',
    references: [
      { timestamp: '02:10', text: '"Let\'s go around and confirm everyone\'s role"' },
      { timestamp: '15:30', text: '"The scope doc looks good to me"' },
    ],
  },
  'rpt-003': {
    id: 'rpt-003',
    meetingId: 'mtg-003',
    description: 'Architecture debate: migration shortcuts, Mongo vs SQL, and Power Automate blocked by IT.',
    riskScore: 3,
    reportDate: '2026-02-24T14:00:00Z',
    risks: [
      {
        id: 'flag-003',
        flagType: 'Conduct Concern',
        explanation:
          'Someone suggested skipping the database migration to save time which goes against the project spec.',
        status: 'pending',
      },
      {
        id: 'flag-004',
        flagType: 'Scope Creep',
        explanation: 'There was talk about switching to MongoDB which is a big departure from the approved design.',
        status: 'dismissed',
      },
      {
        id: 'flag-005',
        flagType: 'Timeline Risk',
        explanation: 'Power Automate integration is completely stuck because IT hasn\'t given us permissions.',
        status: 'confirmed',
      },
    ],
    details:
      'Big architecture debate. Someone wanted to skip the DB migration which got flagged. Also some talk about ditching Azure SQL for Mongo. Power Automate is blocked on IT permissions which is holding things up.',
    references: [
      {
        timestamp: '05:15',
        text: '"Can we just skip the migration and write to the new schema?"',
        riskId: 'flag-003',
      },
      {
        timestamp: '14:40',
        text: '"What if we just use MongoDB instead?"',
        riskId: 'flag-004',
      },
      {
        timestamp: '28:55',
        text: '"Power Automate is completely blocked right now"',
        riskId: 'flag-005',
      },
      {
        timestamp: '42:30',
        text: '"We might need a manual upload fallback"',
        riskId: 'flag-005',
      },
    ],
  },
  'rpt-004': {
    id: 'rpt-004',
    meetingId: 'mtg-004',
    description: 'Weekly sync on mockups and testing — on track.',
    riskScore: 0,
    reportDate: '2026-03-08T10:30:00Z',
    risks: [],
    details: 'Quick weekly sync. Looked at mockups, talked testing. Everything on track, nothing flagged.',
    references: [{ timestamp: '08:20', text: '"Mockups look good, let\'s start building"' }],
  },
}
