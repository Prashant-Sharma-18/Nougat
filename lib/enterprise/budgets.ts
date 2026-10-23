export interface DepartmentBudget {
  id: string;
  name: string;
  code: string;
  head: string;
  allocatedPoints: number;
  spentPoints: number;
  monthlyCapDollars: number;
}

export interface ApprovalRequest {
  id: string;
  departmentId: string;
  departmentName: string;
  requesterName: string;
  requesterEmail: string;
  recipientName: string;
  recipientEmail: string;
  brandName: string;
  brandId: string;
  faceValue: number;
  pointsRequired: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectionReason?: string;
  orderId?: string;
}

// In-memory cost center store for Acme Corp [ORG-8821]
let departmentBudgets: DepartmentBudget[] = [
  {
    id: "dept_eng",
    name: "Engineering & Cloud Infrastructure",
    code: "ENG-401",
    head: "Devon Vance (VP Engineering)",
    allocatedPoints: 20000,
    spentPoints: 8500,
    monthlyCapDollars: 300,
  },
  {
    id: "dept_sales",
    name: "Global Sales & Strategic Partnerships",
    code: "SLS-202",
    head: "Elena Rostova (Chief Commercial Officer)",
    allocatedPoints: 15000,
    spentPoints: 6200,
    monthlyCapDollars: 250,
  },
  {
    id: "dept_ops",
    name: "Customer Operations & Support",
    code: "OPS-103",
    head: "Marcus Brody (Head of Operations)",
    allocatedPoints: 10000,
    spentPoints: 3100,
    monthlyCapDollars: 150,
  },
  {
    id: "dept_hr",
    name: "People, Culture & Talent Acquisition",
    code: "HR-501",
    head: "Siddharth Rao (Chief People Officer)",
    allocatedPoints: 5000,
    spentPoints: 1400,
    monthlyCapDollars: 100,
  },
];

let approvalRequests: ApprovalRequest[] = [
  {
    id: "appr_init_01",
    departmentId: "dept_eng",
    departmentName: "Engineering & Cloud Infrastructure",
    requesterName: "Devon Vance",
    requesterEmail: "devon.v@acmecorp.internal",
    recipientName: "Kavita Nair",
    recipientEmail: "kavita.n@acmecorp.internal",
    brandName: "Apple",
    brandId: "prod_apple_us",
    faceValue: 300,
    pointsRequired: 30000,
    reason: "Q3 High-Availability Architecture Overhaul lead bonus",
    status: "PENDING",
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "appr_init_02",
    departmentId: "dept_sales",
    departmentName: "Global Sales & Strategic Partnerships",
    requesterName: "Elena Rostova",
    requesterEmail: "elena.r@acmecorp.internal",
    recipientName: "David Miller",
    recipientEmail: "david.m@acmecorp.internal",
    brandName: "Amazon",
    brandId: "prod_amazon_us",
    faceValue: 275,
    pointsRequired: 27500,
    reason: "Exceeded annual enterprise quota by 140%",
    status: "PENDING",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export function listDepartments(): DepartmentBudget[] {
  return departmentBudgets.map((d) => ({ ...d }));
}

export function listApprovalRequests(): ApprovalRequest[] {
  return [...approvalRequests];
}

export function addDepartmentPoints(departmentId: string, additionalPoints: number): DepartmentBudget {
  const dept = departmentBudgets.find((d) => d.id === departmentId);
  if (!dept) {
    throw new Error(`Cost center '${departmentId}' not found.`);
  }
  dept.allocatedPoints += additionalPoints;
  return { ...dept };
}

export function deductDepartmentSpend(departmentId: string, pointsSpent: number) {
  const dept = departmentBudgets.find((d) => d.id === departmentId);
  if (dept) {
    dept.spentPoints += pointsSpent;
  }
}

export function createApprovalRecord(params: Omit<ApprovalRequest, "id" | "status" | "createdAt">): ApprovalRequest {
  const record: ApprovalRequest = {
    ...params,
    id: `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  approvalRequests.unshift(record);
  return record;
}

export function updateApprovalRecord(
  requestId: string,
  updates: Partial<ApprovalRequest>
): ApprovalRequest {
  const idx = approvalRequests.findIndex((r) => r.id === requestId);
  if (idx === -1) {
    throw new Error(`Approval request '${requestId}' not found.`);
  }

  approvalRequests[idx] = {
    ...approvalRequests[idx],
    ...updates,
    reviewedAt: new Date().toISOString(),
  };

  return approvalRequests[idx];
}

