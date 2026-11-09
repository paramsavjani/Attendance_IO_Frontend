export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

export interface Poll {
  id: number;
  subject: { id: number; code: string; name: string; color: string };
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  anonymous: boolean;
  /** Null when the poll is anonymous and you didn't ask it. */
  creatorName: string | null;
  isMine: boolean;
  totalVoters: number;
  myOptionIds: number[];
  isOpen: boolean;
  /** Hidden by classmates' reports; only its creator still sees it. */
  hidden: boolean;
  reportedByMe: boolean;
  /** Epoch millis. */
  createdAt: number;
  endsAt: number;
}

export interface PollFeed {
  polls: Poll[];
  unvotedOpenCount: number;
  canCreate: boolean;
  /** Too many of your polls were hidden after reports; you can't ask new ones. */
  blocked: boolean;
  createdToday: number;
  dailyLimit: number;
}

export type PollReportReason = "SPAM" | "OFFENSIVE" | "MISLEADING" | "OTHER";

export interface CreatePollInput {
  subjectId: number;
  question: string;
  options: string[];
  allowMultiple: boolean;
  anonymous: boolean;
  durationHours: number;
}
