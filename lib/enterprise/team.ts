export interface TeamMember {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  title: string;
  totalCardsReceived: number;
  totalValueReceived: number;
  lastGiftedAt?: string | null;
  createdAt: string;
}

// In-memory team directory for Acme Corp [ORG-8821]
let teamDirectory: TeamMember[] = [
  {
    id: "tm_01",
    name: "Devon Vance",
    email: "devon.v@acmecorp.internal",
    departmentId: "dept_eng",
    departmentName: "Engineering & Cloud Infrastructure",
    title: "VP Engineering",
    totalCardsReceived: 2,
    totalValueReceived: 100,
    lastGiftedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_02",
    name: "Kavita Nair",
    email: "kavita.n@acmecorp.internal",
    departmentId: "dept_eng",
    departmentName: "Engineering & Cloud Infrastructure",
    title: "Lead Cloud Architect",
    totalCardsReceived: 3,
    totalValueReceived: 175,
    lastGiftedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_03",
    name: "Marcus Brody",
    email: "marcus.b@acmecorp.internal",
    departmentId: "dept_ops",
    departmentName: "Customer Operations & Support",
    title: "Head of Operations",
    totalCardsReceived: 2,
    totalValueReceived: 75,
    lastGiftedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_04",
    name: "Elena Rostova",
    email: "elena.r@acmecorp.internal",
    departmentId: "dept_sales",
    departmentName: "Global Sales & Strategic Partnerships",
    title: "Chief Commercial Officer",
    totalCardsReceived: 1,
    totalValueReceived: 100,
    lastGiftedAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 300 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_05",
    name: "David Miller",
    email: "david.m@acmecorp.internal",
    departmentId: "dept_sales",
    departmentName: "Global Sales & Strategic Partnerships",
    title: "Enterprise Account Executive",
    totalCardsReceived: 2,
    totalValueReceived: 125,
    lastGiftedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_06",
    name: "Rachel Adams",
    email: "rachel.a@acmecorp.internal",
    departmentId: "dept_ops",
    departmentName: "Customer Operations & Support",
    title: "Senior Support Specialist",
    totalCardsReceived: 4,
    totalValueReceived: 100,
    lastGiftedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "tm_07",
    name: "Siddharth Rao",
    email: "siddharth.r@acmecorp.internal",
    departmentId: "dept_hr",
    departmentName: "People, Culture & Talent Acquisition",
    title: "Chief People Officer",
    totalCardsReceived: 1,
    totalValueReceived: 50,
    lastGiftedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString(),
  },
];

export function listTeamMembers(): TeamMember[] {
  return teamDirectory.map((m) => ({ ...m }));
}

export function addTeamMember(params: Omit<TeamMember, "id" | "totalCardsReceived" | "totalValueReceived" | "lastGiftedAt" | "createdAt">): TeamMember {
  const newMember: TeamMember = {
    ...params,
    id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    totalCardsReceived: 0,
    totalValueReceived: 0,
    lastGiftedAt: null,
    createdAt: new Date().toISOString(),
  };
  teamDirectory.unshift(newMember);
  return newMember;
}

export function recordGiftToTeamMember(memberId: string, faceValue: number) {
  const member = teamDirectory.find((m) => m.id === memberId || m.email.toLowerCase() === memberId.toLowerCase());
  if (member) {
    member.totalCardsReceived += 1;
    member.totalValueReceived += faceValue;
    member.lastGiftedAt = new Date().toISOString();
  }
}

