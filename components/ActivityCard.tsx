import Link from "next/link";
import { Activity } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export function ActivityCard({
  activity,
  participantCount,
  href,
}: {
  activity: Activity;
  participantCount?: number;
  href?: string;
}) {
  const isFull =
    activity.max_participants != null &&
    participantCount != null &&
    participantCount >= activity.max_participants;

  const content = (
    <div className="glass-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{activity.title}</h3>
          {activity.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {activity.description}
            </p>
          )}
        </div>
        {isFull && (
          <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
            Penuh
          </span>
        )}
      </div>
      <div className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDateTime(activity.date)}
        </div>
        {activity.location && (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {activity.location}
          </div>
        )}
        <div className="flex items-center gap-4 pt-1">
          {activity.registration_fee > 0 && (
            <span className="font-medium text-gold-dark">
              Iuran: {formatCurrency(activity.registration_fee)}
            </span>
          )}
          {activity.max_participants != null && (
            <span className="text-slate-500">
              {participantCount ?? 0}/{activity.max_participants} peserta
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
