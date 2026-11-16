import { useEffect, useRef, useState, type JSX } from "react";
import {
  ArrowSquareOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileZipIcon,
  PencilSimpleIcon,
  PushPinIcon,
  ShareNetworkIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Modal from "./Modal";
import {
  CONDITION_LABELS,
  STATUS_THEME,
  categoryLabel,
  STATUS_OPTIONS,
  defaultItemImage,
  fullDescription as buildDescription,
  daysListed,
  formatDate,
  isStale,
  formatPrice,
  photoDownloadUrl,
  photoFileName,
  squareJpgUrl,
  squareUrl,
  type Item,
  type ItemStatus,
} from "../lib/closets";

type ItemViewDialogProps = {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onEdit: (item: Item) => void;
  staleDays?: number;
  onRelist?: (item: Item) => Promise<boolean>;
  onStatusChange?: (item: Item, status: ItemStatus) => void;
  onDelete?: (item: Item) => Promise<boolean>;
};

export default function ItemViewDialog({
  open,
  item,
  onClose,
  onEdit,
  staleDays,
  onRelist,
  onStatusChange,
  onDelete,
}: ItemViewDialogProps): JSX.Element {
  return (
    <Modal
      open={open}
      size="lg"
      title={item?.name ?? ""}
      onClose={onClose}
      headerActions={
        item && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-plum/20 px-3.5 text-sm font-medium text-plum transition cursor-pointer hover:bg-lavender"
          >
            <PencilSimpleIcon size={16} aria-hidden="true" />
            Edit
          </button>
        )
      }
    >
      {item && (
        <ItemView
          key={item.id}
          item={item}
          staleDays={staleDays}
          onRelist={onRelist}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      )}
    </Modal>
  );
}

async function fetchPhotoFiles(item: Item) {
  return Promise.all(
    item.photos.map(async (photo, index) => {
      const res = await fetch(squareJpgUrl(photo.url));
      if (!res.ok) throw new Error("Couldn't load a photo.");
      const blob = await res.blob();
      return new File([blob], photoFileName(item.name, index), {
        type: "image/jpeg",
      });
    }),
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(
        () => setCopied((current) => (current === key ? null : current)),
        2000,
      );
    } catch {
      setCopied(null);
    }
  }

  return { copied, copy };
}

function ItemView({
  item,
  staleDays,
  onRelist,
  onStatusChange,
  onDelete,
}: {
  item: Item;
  staleDays?: number;
  onRelist?: (item: Item) => Promise<boolean>;
  onStatusChange?: (item: Item, status: ItemStatus) => void;
  onDelete?: (item: Item) => Promise<boolean>;
}): JSX.Element {
  const [relisting, setRelisting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const stale = staleDays !== undefined && isStale(item, staleDays);
  const days = daysListed(item);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [shareFiles, setShareFiles] = useState<File[] | null>(null);
  const [canShare] = useState(
    () =>
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({
        files: [new File([""], "test.jpg", { type: "image/jpeg" })],
      }),
  );
  const [zipping, setZipping] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const { copied, copy } = useCopy();

  const photos = item.photos;
  const hasPhotos = photos.length > 0;

  useEffect(() => {
    if (!canShare || !hasPhotos) return;
    let active = true;

    fetchPhotoFiles(item)
      .then((files) => {
        if (active) setShareFiles(files);
      })
      .catch(() => {
        if (active) setDownloadError("Couldn't prepare photos for saving.");
      });

    return () => {
      active = false;
    };
  }, [canShare, hasPhotos, item]);

  function slideStep(el: HTMLDivElement) {
    const [first, second] = Array.from(el.children) as HTMLElement[];
    if (!first) return el.clientWidth;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }

  function scrollTo(next: number) {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, next));
    el.scrollTo({ left: clamped * slideStep(el), behavior: "smooth" });
  }

  function handleScroll() {
    const el = track.current;
    if (!el) return;
    const step = slideStep(el);
    if (!step) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setIndex(atEnd ? photos.length - 1 : Math.round(el.scrollLeft / step));
  }

  async function sharePhotos() {
    if (!shareFiles) return;
    setDownloadError("");
    try {
      await navigator.share({ files: shareFiles, title: item.name });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setDownloadError("Couldn't open the share sheet. Try the zip instead.");
    }
  }

  async function downloadZip() {
    setDownloadError("");
    setZipping(true);

    try {
      const [{ zipSync }, files] = await Promise.all([
        import("fflate"),
        shareFiles ? Promise.resolve(shareFiles) : fetchPhotoFiles(item),
      ]);

      const entries: Record<string, [Uint8Array, { level: 0 }]> = {};
      for (const file of files) {
        entries[file.name] = [
          new Uint8Array(await file.arrayBuffer()),
          { level: 0 },
        ];
      }

      const zip = zipSync(entries);
      const url = URL.createObjectURL(
        new Blob([zip as BlobPart], { type: "application/zip" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = photoFileName(item.name, 0).replace(/-1\.jpg$/, ".zip");
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError("Couldn't build the zip. Try again.");
    } finally {
      setZipping(false);
    }
  }

  const details = [
    ["Brand", item.brand],
    ["Size", item.size],
    ["Condition", item.condition ? CONDITION_LABELS[item.condition] : null],
    ["Category", categoryLabel(item)],
    ["Color", item.color],
    ["Belongs to", item.owner?.name],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const fullDescription = buildDescription(item);

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start md:gap-6">
      {item.notes && (
        <aside
          aria-label="Pinned note"
          className="flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950 md:col-span-2"
        >
          <PushPinIcon
            size={18}
            weight="fill"
            className="mt-0.5 shrink-0 -rotate-12 text-amber-500"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
              Note
            </p>
            <p className="whitespace-pre-line leading-relaxed">{item.notes}</p>
          </div>
        </aside>
      )}

      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-xl border border-lavender-gray bg-lavender">
          {hasPhotos ? (
            <div
              ref={track}
              onScroll={handleScroll}
              className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((photo, i) => (
                <img
                  key={photo.publicId}
                  src={squareUrl(photo.url, 1000)}
                  alt={`${item.name}, photo ${i + 1} of ${photos.length}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  draggable={false}
                  className="aspect-square w-full shrink-0 snap-start object-cover"
                />
              ))}
            </div>
          ) : (
            <img
              src={defaultItemImage}
              alt=""
              className="aspect-square w-full object-cover"
            />
          )}

          {hasPhotos && photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollTo(index - 1)}
                disabled={index === 0}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum shadow cursor-pointer disabled:opacity-0 sm:grid"
              >
                <CaretLeftIcon size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => scrollTo(index + 1)}
                disabled={index === photos.length - 1}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-plum shadow cursor-pointer disabled:opacity-0 sm:grid"
              >
                <CaretRightIcon size={18} weight="bold" />
              </button>
              <span className="absolute right-2 top-2 rounded-full bg-plum/80 px-2.5 py-0.5 text-xs font-medium text-white sm:bottom-2 sm:right-2 sm:top-auto">
                {index + 1}/{photos.length}
              </span>
            </>
          )}

          {!hasPhotos && (
            <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-plum">
              No photos yet
            </span>
          )}
        </div>

        {photos.length > 1 && (
          <div
            className="flex justify-center gap-1.5 sm:hidden"
            aria-hidden="true"
          >
            {photos.map((photo, i) => (
              <span
                key={photo.publicId}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === i ? "w-5 bg-plum" : "w-1.5 bg-plum/25"
                }`}
              />
            ))}
          </div>
        )}

        {photos.length > 1 && (
          <ul className="hidden grid-cols-8 gap-1.5 sm:grid">
            {photos.map((photo, i) => (
              <li key={photo.publicId}>
                <button
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={index === i}
                  className={`block aspect-square w-full overflow-hidden rounded-md border-2 cursor-pointer ${
                    index === i
                      ? "border-plum"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={squareUrl(photo.url, 120)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasPhotos && (
          <div className="flex items-center gap-3">
            {canShare ? (
              <button
                type="button"
                onClick={sharePhotos}
                disabled={!shareFiles}
                className="btn-small-primary flex-1"
              >
                <ShareNetworkIcon size={16} aria-hidden="true" />
                {shareFiles ? "Save all photos" : "Preparing photos..."}
              </button>
            ) : (
              <button
                type="button"
                onClick={downloadZip}
                disabled={zipping}
                className="btn-small-primary flex-1"
              >
                <FileZipIcon size={16} aria-hidden="true" />
                {zipping ? "Zipping..." : "Download all photos"}
              </button>
            )}
            <a
              href={photoDownloadUrl(
                photos[index]?.url ?? photos[0].url,
                item.name,
                index,
              )}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-plum/70 hover:text-plum"
            >
              <DownloadSimpleIcon size={16} aria-hidden="true" />
              This photo
            </a>
          </div>
        )}

        {hasPhotos && canShare && (
          <button
            type="button"
            onClick={downloadZip}
            disabled={zipping}
            className="self-start text-xs font-medium text-plum/60 cursor-pointer hover:text-plum"
          >
            {zipping ? "Zipping..." : "Or download a .zip instead"}
          </button>
        )}

        {downloadError && (
          <p role="alert" className="error-box">
            {downloadError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-fredoka text-3xl font-medium text-plum">
            {item.status === "SOLD" && item.soldPriceCents != null
              ? formatPrice(item.soldPriceCents)
              : item.priceCents != null
                ? formatPrice(item.priceCents)
                : "No price yet"}
          </p>
          <p className="text-sm text-plum/60">
            {item.status === "SOLD" && item.soldPriceCents != null
              ? `Sold${item.priceCents != null ? ` · listed at ${formatPrice(item.priceCents)}` : ""}`
              : item.minPriceCents != null
                ? `Lowest ${formatPrice(item.minPriceCents)}`
                : ""}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Status"
          className="grid grid-cols-3 gap-1 rounded-full bg-mist p-1"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={item.status === value}
              disabled={!onStatusChange}
              onClick={() =>
                item.status !== value && onStatusChange?.(item, value)
              }
              className={`rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                item.status === value
                  ? STATUS_THEME[value].active
                  : "text-plum/60 hover:bg-white hover:text-plum"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {stale && onRelist && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-mist px-3 py-2 text-sm text-plum/80">
            <span>Listed {days} days ago. Might be time to refresh it.</span>
            <button
              type="button"
              disabled={relisting}
              onClick={async () => {
                setRelisting(true);
                await onRelist(item);
                setRelisting(false);
              }}
              className="shrink-0 font-medium text-lilac cursor-pointer hover:underline"
            >
              {relisting ? "Saving..." : "Mark relisted"}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-plum/50">
            Copy to post
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["title", "Title", item.name],
                ["description", "Description", fullDescription],
                [
                  "price",
                  "Price",
                  item.priceCents != null
                    ? (item.priceCents / 100).toFixed(2)
                    : "",
                ],
              ] as const
            ).map(([key, label, text]) => (
              <button
                key={key}
                type="button"
                disabled={!text}
                onClick={() => copy(key, text)}
                className="flex flex-col items-center gap-1 rounded-xl border border-lavender-gray bg-white px-2 py-2.5 text-xs font-medium text-plum transition cursor-pointer hover:border-lilac hover:bg-lavender/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied === key ? (
                  <CheckIcon
                    size={18}
                    weight="bold"
                    className="text-emerald-600"
                    aria-hidden="true"
                  />
                ) : (
                  <CopyIcon size={18} aria-hidden="true" />
                )}
                {copied === key ? "Copied" : label}
              </button>
            ))}
          </div>
        </div>

        {fullDescription ? (
          <p className="whitespace-pre-line rounded-xl border border-lavender-gray p-4 text-sm leading-relaxed text-ink">
            {fullDescription}
          </p>
        ) : (
          <p className="muted">No description yet.</p>
        )}

        {details.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-plum/60">{label}</dt>
                <dd className="font-medium text-plum">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {item.listingUrl && (
          <a
            href={item.listingUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-lavender-gray px-4 py-3 text-sm font-medium text-plum transition hover:border-lilac hover:bg-lavender/40"
          >
            Open listing
            <ArrowSquareOutIcon size={16} aria-hidden="true" />
          </a>
        )}

        <p className="text-xs text-plum/60">
          {item.createdBy
            ? `Added by ${item.createdBy.name}`
            : "Added by a former member"}{" "}
          on {formatDate(item.createdAt)}
          {item.listedAt && ` · Listed ${formatDate(item.listedAt)}`}
          {item.soldAt && ` · Sold ${formatDate(item.soldAt)}`}
        </p>
      </div>

      {onDelete && (
        <div className="flex flex-col items-center gap-2 border-t border-lavender-gray pt-4 md:col-span-2">
          {confirmDelete ? (
            <>
              <p className="text-sm text-plum">
                Delete this listing? This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="btn-small-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    const ok = await onDelete(item);
                    if (!ok) {
                      setDeleting(false);
                      setConfirmDelete(false);
                    }
                  }}
                  className="btn-small-danger"
                >
                  <TrashIcon size={16} aria-hidden="true" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-coral transition cursor-pointer hover:bg-coral/10"
            >
              <TrashIcon size={16} aria-hidden="true" />
              Delete listing
            </button>
          )}
        </div>
      )}
    </div>
  );
}
