export type PollType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO";

export type PollStatus = "ACTIVE" | "ENDED" | "CLOSED";

export type PollReportReason =
  | "SPAM"
  | "OFFENSIVE_CONTENT"
  | "MISLEADING_OR_IRRELEVANT"
  | "HARASSMENT"
  | "OTHER";

export interface PollOption {
  id: string;
  pollId: string;
  optionText: string;
  displayOrder: number;
  voteCount: number;
}

export interface PollCreator {
  id: string;
  name: string;
  pictureUrl?: string | null;
  sid?: string | null;
}

export interface Poll {
  id: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  createdBy: PollCreator;
  title: string;
  description?: string | null;
  pollType: PollType;
  status: PollStatus;
  endDate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  options: PollOption[];
  totalVotes: number;
  /** IDs of options the current student has voted for */
  userVotedOptionIds?: string[];
  /** Report count for anti-spam tracking */
  reportCount?: number;
  /** Whether the poll has been hidden/flagged due to exceeding the spam threshold */
  isFlaggedSpam?: boolean;
  /** Whether the current student has reported this poll */
  hasReported?: boolean;
}

export interface CreatePollPayload {
  subjectId: string;
  title: string;
  description?: string;
  pollType: PollType;
  options: string[];
  endDate?: string;
  notifyStudents?: boolean;
}

export interface CastVotePayload {
  pollId: string;
  optionIds: string[];
}

export interface ReportPollPayload {
  pollId: string;
  reason: PollReportReason;
  details?: string;
  reportAuthorAsSpammer?: boolean;
}

export interface PollNotificationPreferences {
  notifyNewPolls: boolean;
  notifyPollResults: boolean;
}
