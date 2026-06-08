export type Stage = 'give-code' | 'report';

export interface ReportStatus {
  color: 'red' | 'green';
  message?: string;
}

export interface CodeEntry {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  reportCode: string;
  reportText: string;
  reportStatus: ReportStatus;
}

export interface AppState {
  stage: Stage;
  currentIndex: number;
  entries: CodeEntry[];
  userCode: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface EntriesResponse {
  entries: CodeEntry[];
  total: number;
}
