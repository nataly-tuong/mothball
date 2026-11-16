import { useEffect, useState, type JSX, type ReactNode } from "react";
import {
  ArrowsClockwiseIcon,
  CoatHangerIcon,
  CurrencyDollarIcon,
  DoorOpenIcon,
  PencilSimpleIcon,
  PlusIcon,
  SparkleIcon,
  TagIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  UserMinusIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { api } from "../lib/api";
import { formatPrice, type Activity, type ActivityType } from "../lib/closets";

type ActivityFeedProps = {
  closetId: number;
  currentUserId: number | undefined;
  itemExists: (itemId: number) => boolean;
  onOpenItem: (itemId: number) => void;
  onSeen: () => void;
};

type Page = { activities: Activity[]; nextCursor: number | null };

const iconFor: Record<ActivityType, { Icon: Icon; tone: string }> = {
  CLOSET_CREATED: { Icon: SparkleIcon, tone: "bg-lilac/15 text-lilac" },
  CLOSET_RENAMED: { Icon: PencilSimpleIcon, tone: "bg-lavender text-plum" },
  MEMBER_JOINED: { Icon: UserPlusIcon, tone: "bg-emerald-50 text-emerald-600" },
  MEMBER_LEFT: { Icon: DoorOpenIcon, tone: "bg-mist text-plum/70" },
  MEMBER_REMOVED: { Icon: UserMinusIcon, tone: "bg-coral/10 text-coral" },
  ITEM_ADDED: { Icon: PlusIcon, tone: "bg-lavender text-plum" },
  ITEM_LISTED: { Icon: TagIcon, tone: "bg-lilac/15 text-lilac" },
  ITEM_SOLD: {
    Icon: CurrencyDollarIcon,
    tone: "bg-emerald-50 text-emerald-600",
  },
  ITEM_UNLISTED: { Icon: CoatHangerIcon, tone: "bg-mist text-plum/70" },
  ITEM_PRICE_CHANGED: {
    Icon: TrendDownIcon,
    tone: "bg-amber-50 text-amber-600",
  },
  ITEM_RELISTED: { Icon: ArrowsClockwiseIcon, tone: "bg-sky-50 text-sky-600" },
  ITEM_DELETED: { Icon: TrashIcon, tone: "bg-coral/10 text-coral" },
};

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(today)) return "Today";
  if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
  return dayFormat.format(date);
}

function relativeTime(date: Date) {
  const minutes = Math.round((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  return timeFormat.format(date);
}

export default function ActivityFeed({
  closetId,
  currentUserId,
  itemExists,
  onOpenItem,
  onSeen,
}: ActivityFeedProps): JSX.Element {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api<Page>(`/api/closets/${closetId}/activity`).then((result) => {
      if (!active) return;
      if (result.ok) {
        setActivities(result.data.activities);
        setCursor(result.data.nextCursor);
      } else {
        setError(result.message);
      }
    });

    api(`/api/closets/${closetId}/activity/seen`, { method: "POST" }).then(
      (result) => {
        if (active && result.ok) onSeen();
      },
    );

    return () => {
      active = false;
    };
  }, [closetId, onSeen]);

  async function loadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const result = await api<Page>(
      `/api/closets/${closetId}/activity?before=${cursor}`,
    );
    setLoadingMore(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setActivities((current) => [...(current ?? []), ...result.data.activities]);
    setCursor(result.data.nextCursor);
  }

  function describe(activity: Activity): ReactNode {
    const who =
      activity.actor === null
        ? "A former member"
        : activity.actor.id === currentUserId
          ? "You"
          : activity.actor.name;

    const item =
      activity.itemId !== null && itemExists(activity.itemId) ? (
        <button
          type="button"
          onClick={() => onOpenItem(activity.itemId!)}
          className="font-semibold text-plum underline decoration-lilac/50 underline-offset-2 cursor-pointer hover:decoration-lilac"
        >
          {activity.itemName}
        </button>
      ) : (
        <strong className="font-semibold">{activity.itemName}</strong>
      );

    const actor = <strong className="font-semibold">{who}</strong>;

    switch (activity.type) {
      case "CLOSET_CREATED":
        return <>{actor} created the closet</>;
      case "CLOSET_RENAMED":
        return (
          <>
            {actor} renamed the closet to <strong>{activity.detail}</strong>
          </>
        );
      case "MEMBER_JOINED":
        return <>{actor} joined the closet</>;
      case "MEMBER_LEFT":
        return <>{actor} left the closet</>;
      case "MEMBER_REMOVED":
        return (
          <>
            {actor} removed <strong>{activity.detail}</strong>
          </>
        );
      case "ITEM_ADDED":
        return (
          <>
            {actor} added {item}
            {activity.detail === "LISTED"
              ? " as listed"
              : activity.detail === "SOLD"
                ? " as sold"
                : ""}
          </>
        );
      case "ITEM_LISTED":
        return (
          <>
            {actor} listed {item}
          </>
        );
      case "ITEM_SOLD":
        return (
          <>
            {actor} sold {item}
            {activity.detail
              ? ` for ${formatPrice(Number(activity.detail))}`
              : ""}
          </>
        );
      case "ITEM_UNLISTED":
        return (
          <>
            {actor} moved {item} back to To upload
          </>
        );
      case "ITEM_PRICE_CHANGED": {
        const [from, to] = (activity.detail ?? "").split(":").map(Number);
        const dropped = to < from;
        return (
          <>
            {actor} {dropped ? "dropped" : "raised"} the price of {item} from{" "}
            {formatPrice(from)} to {formatPrice(to)}
          </>
        );
      }
      case "ITEM_RELISTED":
        return (
          <>
            {actor} relisted {item}
          </>
        );
      case "ITEM_DELETED":
        return (
          <>
            {actor} deleted {item}
          </>
        );
    }
  }

  if (error && !activities) {
    return (
      <p role="alert" className="error-box">
        {error}
      </p>
    );
  }

  if (!activities) {
    return <p className="muted">Loading activity...</p>;
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <SparkleIcon
          size={48}
          weight="fill"
          className="text-lilac"
          aria-hidden="true"
        />
        <p className="font-fredoka text-2xl font-medium text-plum">
          No activity yet
        </p>
        <p className="muted">
          Adding, listing, and selling items will show up here.
        </p>
      </div>
    );
  }

  const groups: { label: string; entries: Activity[] }[] = [];
  for (const activity of activities) {
    const date = new Date(activity.createdAt);
    const label = dayLabel(date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.entries.push(activity);
    else groups.push({ label, entries: [activity] });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-plum/50">
            {group.label}
          </h3>
          <ol className="flex flex-col">
            {group.entries.map((activity) => {
              const { Icon, tone } =
                activity.type === "ITEM_PRICE_CHANGED" &&
                (() => {
                  const [from, to] = (activity.detail ?? "")
                    .split(":")
                    .map(Number);
                  return to > from;
                })()
                  ? { Icon: TrendUpIcon, tone: iconFor.ITEM_PRICE_CHANGED.tone }
                  : iconFor[activity.type];
              const date = new Date(activity.createdAt);
              return (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 border-b border-lavender-gray/60 py-3 last:border-0"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}
                  >
                    <Icon size={18} weight="bold" aria-hidden="true" />
                  </span>
                  <p className="min-w-0 flex-1 pt-1.5 text-sm leading-snug text-ink">
                    {describe(activity)}
                  </p>
                  <time
                    dateTime={activity.createdAt}
                    title={date.toLocaleString()}
                    className="shrink-0 pt-1.5 text-xs text-plum/50"
                  >
                    {relativeTime(date)}
                  </time>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="btn-small-secondary self-center"
        >
          {loadingMore ? "Loading..." : "Load older activity"}
        </button>
      )}
    </div>
  );
}
