import { useState, type JSX } from "react";
import {
  ArrowsClockwiseIcon,
  CheckCircleIcon,
  TrendDownIcon,
} from "@phosphor-icons/react";
import {
  STALE_DAY_OPTIONS,
  coverImage,
  daysListed,
  formatPrice,
  isDueSoon,
  isStale,
  type Item,
} from "../lib/closets";

type RelistViewProps = {
  items: Item[];
  staleDays: number;
  isOwner: boolean;
  onRelist: (item: Item) => Promise<boolean>;
  onEdit: (item: Item) => void;
  onView: (item: Item) => void;
  onChangeStaleDays: (days: number) => void;
};

function RelistRow({
  item,
  stale,
  onRelist,
  onEdit,
  onView,
}: {
  item: Item;
  stale: boolean;
  onRelist: (item: Item) => Promise<boolean>;
  onEdit: (item: Item) => void;
  onView: (item: Item) => void;
}): JSX.Element {
  const [busy, setBusy] = useState(false);
  const days = daysListed(item) ?? 0;

  async function relist() {
    setBusy(true);
    await onRelist(item);
    setBusy(false);
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-lavender-gray bg-white p-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => onView(item)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
      >
        <img
          src={coverImage(item, 160)}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold text-plum">{item.name}</p>
          <p
            className={`text-sm ${stale ? "font-medium text-coral" : "text-plum/60"}`}
          >
            Listed {days} {days === 1 ? "day" : "days"} ago
          </p>
          <p className="text-xs text-plum/60">
            {item.priceCents != null
              ? formatPrice(item.priceCents)
              : "No price"}
            {item.minPriceCents != null &&
              ` · lowest ${formatPrice(item.minPriceCents)}`}
          </p>
        </div>
      </button>
      <div className="flex gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="btn-small-secondary flex-1 sm:flex-none"
        >
          <TrendDownIcon size={16} aria-hidden="true" />
          Drop price
        </button>
        <button
          type="button"
          onClick={relist}
          disabled={busy}
          className="btn-small-primary flex-1 sm:flex-none"
        >
          <ArrowsClockwiseIcon size={16} aria-hidden="true" />
          {busy ? "Saving..." : "Mark relisted"}
        </button>
      </div>
    </li>
  );
}

export default function RelistView({
  items,
  staleDays,
  isOwner,
  onRelist,
  onEdit,
  onView,
  onChangeStaleDays,
}: RelistViewProps): JSX.Element {
  const [now] = useState(() => Date.now());
  const byAge = (a: Item, b: Item) =>
    (daysListed(b, now) ?? 0) - (daysListed(a, now) ?? 0);
  const stale = items.filter((i) => isStale(i, staleDays, now)).sort(byAge);
  const dueSoon = items.filter((i) => isDueSoon(i, staleDays, now)).sort(byAge);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-lavender/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-plum">
          Older Depop listings get buried. Refresh anything listed for{" "}
          <strong>{staleDays}+ days</strong> (edit or re-upload it on Depop),
          then mark it relisted here.
        </p>
        {isOwner && (
          <label className="flex shrink-0 items-center gap-2 text-sm text-plum">
            Remind after
            <select
              value={staleDays}
              onChange={(e) => onChangeStaleDays(Number(e.target.value))}
              className="cursor-pointer rounded-full border border-lavender-gray bg-white px-3 py-1 text-plum focus-visible:outline-2 focus-visible:outline-lilac"
            >
              {STALE_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {stale.length === 0 && dueSoon.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <CheckCircleIcon
            size={52}
            weight="fill"
            className="text-lilac"
            aria-hidden="true"
          />
          <p className="font-fredoka text-2xl font-medium text-plum">
            Everything's fresh
          </p>
          <p className="muted">No listings need a refresh right now.</p>
        </div>
      ) : (
        <>
          {stale.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-coral">
                Needs a refresh ({stale.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {stale.map((item) => (
                  <RelistRow
                    key={item.id}
                    item={item}
                    stale
                    onRelist={onRelist}
                    onEdit={onEdit}
                    onView={onView}
                  />
                ))}
              </ul>
            </section>
          )}
          {dueSoon.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-plum/50">
                Due this week ({dueSoon.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {dueSoon.map((item) => (
                  <RelistRow
                    key={item.id}
                    item={item}
                    stale={false}
                    onRelist={onRelist}
                    onEdit={onEdit}
                    onView={onView}
                  />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
