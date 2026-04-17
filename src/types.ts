export type Status = 'pending' | 'approved' | 'rejected' | 'n/a' | 'partial';

export interface Approver {
  name: string;
  wa: string;
  status: Status;
  comment?: string;
}

export interface DocumentData {
  id: string;
  title: string;
  type: 'memo' | 'general';
  date: string;
  desc?: string;
  driveId?: string;
  a1: Approver;
  a2: Approver | null;
}
