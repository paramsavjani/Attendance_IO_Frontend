export type NoticeType = "CANCELLED_LECTURE" | "QUIZ" | "MARKS" | "OTHER";

export interface NoticeCreator {
  id: string;
  name: string;
  pictureUrl?: string | null;
  sid?: string | null;
}

export interface UrgentNotice {
  id: string;
  subjectId: string;
  subjectCode?: string;
  subjectName?: string;
  createdBy: NoticeCreator;
  title: string;
  message: string;
  noticeType: NoticeType;
  createdAt: string;
  reportCount?: number;
  isFlaggedSpam?: boolean;
}

export interface CreateNoticePayload {
  subjectId: string;
  title: string;
  message: string;
  noticeType: NoticeType;
}

export interface ReportNoticePayload {
  noticeId: string;
  reason?: string;
}

