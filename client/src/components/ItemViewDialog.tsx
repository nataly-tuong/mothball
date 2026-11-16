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
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import Modal from "./Modal";
import {
  CONDITION_LABELS,
  STATUS_LABELS,
  defaultItemImage,
  depopDescription,
  formatDate,
  formatPrice,
  photoDownloadUrl,
  photoFileName,
  squareJpgUrl,
  squareUrl,
  type Item,
} from "../lib/closets";

type ItemViewDialogProps = {
  open: boolean;
  item: Item | null;
  onClose: () => void;
  onEdit: (item: Item) => void;
};

const statusStyles = {
  TO_UPLOAD: "bg-mist text-plum/80",
  LISTED: "bg-lilac/20 text-plum",
  SOLD: "bg-plum text-white",
} as const;

export default function ItemViewDialog({
  open,
  item,
  onClose,
  onEdit,
}: ItemViewDialogProps): JSX.Element {
  return (
    <Modal open={open} size="lg" title={item?.name ?? ""} onClose={onClose}>
      {item && <ItemView key={item.id} item={item} onEdit={onEdit} />}
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
  onEdit,
}: {
  item: Item;
  onEdit: (item: Item) => void;
}): JSX.Element {
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

  function scrollTo(next: number) {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const el = track.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
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
    ["Category", item.category],
    ["Color", item.color],
    ["Belongs to", item.owner?.name],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const prices = [
    ["Listed price", item.priceCents],
    ["Lowest acceptable", item.minPriceCents],
    ["Sold for", item.status === "SOLD" ? item.soldPriceCents : null],
  ].filter((entry): entry is [string, number] => entry[1] != null);

  const fullDescription = depopDescription(item);

  return (
    <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:items-start md:gap-6">
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-xl border border-lavender-gray bg-lavender">
          {hasPhotos ? (
            <div
              ref={track}
              onScroll={handleScroll}
              className="flex aspect-square snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {photos.map((photo, i) => (
                <img
                  key={photo.publicId}
                  src={squareUrl(photo.url, 1000)}
                  alt={`${item.name}, photo ${i + 1} of ${photos.length}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="aspect-square w-full shrink-0 snap-center object-cover"
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
              <span className="absolute bottom-2 right-2 rounded-full bg-plum/80 px-2.5 py-0.5 text-xs font-medium text-white">
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
          <ul className="grid grid-cols-8 gap-1.5">
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
          <div className="flex flex-wrap gap-2">
            {canShare && (
              <button
                type="button"
                onClick={sharePhotos}
                disabled={!shareFiles}
                className="btn-small-primary"
              >
                <ShareNetworkIcon size={16} aria-hidden="true" />
                {shareFiles ? "Save photos" : "Preparing..."}
              </button>
            )}
            <button
              type="button"
              onClick={downloadZip}
              disabled={zipping}
              className={canShare ? "btn-small-secondary" : "btn-small-primary"}
            >
              <FileZipIcon size={16} aria-hidden="true" />
              {zipping ? "Zipping..." : "Download all (.zip)"}
            </button>
            <a
              href={photoDownloadUrl(
                photos[index]?.url ?? photos[0].url,
                item.name,
                index,
              )}
              className="btn-small-secondary"
            >
              <DownloadSimpleIcon size={16} aria-hidden="true" />
              This photo
            </a>
          </div>
        )}

        {downloadError && (
          <p role="alert" className="error-box">
            {downloadError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </span>
          {item.depopUrl && (
            <a
              href={item.depopUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-lilac hover:underline"
            >
              Open on Depop
              <ArrowSquareOutIcon size={14} aria-hidden="true" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="btn-small-secondary ml-auto"
          >
            <PencilSimpleIcon size={16} aria-hidden="true" />
            Edit
          </button>
        </div>

        {prices.length > 0 && (
          <dl className="grid grid-cols-3 gap-2">
            {prices.map(([label, cents]) => (
              <div key={label} className="rounded-xl bg-lavender/60 px-3 py-2">
                <dt className="text-xs text-plum/60">{label}</dt>
                <dd className="font-fredoka text-xl font-medium text-plum">
                  {formatPrice(cents)}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => copy("title", item.name)}
            className="btn-small-secondary"
          >
            {copied === "title" ? (
              <CheckIcon size={16} weight="bold" aria-hidden="true" />
            ) : (
              <CopyIcon size={16} aria-hidden="true" />
            )}
            {copied === "title" ? "Copied" : "Copy title"}
          </button>
          {fullDescription && (
            <button
              type="button"
              onClick={() => copy("description", fullDescription)}
              className="btn-small-secondary"
            >
              {copied === "description" ? (
                <CheckIcon size={16} weight="bold" aria-hidden="true" />
              ) : (
                <CopyIcon size={16} aria-hidden="true" />
              )}
              {copied === "description" ? "Copied" : "Copy description"}
            </button>
          )}
          {item.priceCents != null && (
            <button
              type="button"
              onClick={() => copy("price", (item.priceCents! / 100).toFixed(2))}
              className="btn-small-secondary"
            >
              {copied === "price" ? (
                <CheckIcon size={16} weight="bold" aria-hidden="true" />
              ) : (
                <CopyIcon size={16} aria-hidden="true" />
              )}
              {copied === "price" ? "Copied" : "Copy price"}
            </button>
          )}
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

        {item.notes && (
          <div className="rounded-xl bg-mist p-3 text-sm text-plum/80">
            <p className="mb-0.5 text-xs font-semibold text-plum/60">
              Private notes
            </p>
            <p className="whitespace-pre-line">{item.notes}</p>
          </div>
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
    </div>
  );
}
