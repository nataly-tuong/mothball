import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type JSX,
  type SubmitEvent,
} from "react";
import { CameraIcon, StarIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import Modal from "./Modal";
import { api } from "../lib/api";
import {
  CATEGORIES,
  CONDITION_OPTIONS,
  DESCRIPTION_MAX,
  MAX_HASHTAGS,
  MAX_PHOTOS,
  STATUS_OPTIONS,
  formatHashtags,
  parseHashtags,
  parsePrice,
  squareUrl,
  type ClosetMember,
  type Item,
  type ItemPhoto,
  type ItemStatus,
} from "../lib/closets";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type UploadSignature = {
  allowed_formats: string;
  folder: string;
  timestamp: string;
  signature: string;
  apiKey: string;
  cloudName: string;
};

type PhotoTile = {
  key: string;
  preview: string;
  photo: ItemPhoto | null;
};

type ItemDialogProps = {
  open: boolean;
  closetId: number;
  item: Item | null;
  members: ClosetMember[];
  uploadsEnabled: boolean;
  onClose: () => void;
  onSaved: (item: Item) => void;
  onDeleted: (itemId: number) => void;
};

async function uploadPhoto(closetId: number, file: File): Promise<ItemPhoto> {
  const sig = await api<UploadSignature>(
    `/api/closets/${closetId}/uploads/signature`,
    { method: "POST" },
  );

  if (!sig.ok) {
    throw new Error(sig.message);
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.data.apiKey);
  form.append("timestamp", sig.data.timestamp);
  form.append("folder", sig.data.folder);
  form.append("allowed_formats", sig.data.allowed_formats);
  form.append("signature", sig.data.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.data.cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.secure_url || !data?.public_id) {
    throw new Error(data?.error?.message ?? "Photo upload failed.");
  }

  return { url: data.secure_url, publicId: data.public_id };
}

function centsToInput(cents: number | null | undefined) {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

export default function ItemDialog(props: ItemDialogProps): JSX.Element {
  return (
    <Modal
      open={props.open}
      size="lg"
      title={props.item ? "Edit listing" : "New listing"}
      onClose={props.onClose}
    >
      <ItemForm {...props} />
    </Modal>
  );
}

function ItemForm({
  closetId,
  item,
  members,
  uploadsEnabled,
  onClose,
  onSaved,
  onDeleted,
}: ItemDialogProps): JSX.Element {
  const fileInput = useRef<HTMLInputElement>(null);
  const blobUrls = useRef<string[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [tiles, setTiles] = useState<PhotoTile[]>(() =>
    (item?.photos ?? []).map((photo) => ({
      key: photo.publicId,
      preview: squareUrl(photo.url, 300),
      photo,
    })),
  );
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "TO_UPLOAD");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [subcategory, setSubcategory] = useState(item?.subcategory ?? "");

  const categoryOptions = Object.keys(CATEGORIES);
  if (category && !categoryOptions.includes(category)) {
    categoryOptions.push(category);
  }
  const subcategoryOptions = [...(CATEGORIES[category] ?? [])];
  if (subcategory && !subcategoryOptions.includes(subcategory)) {
    subcategoryOptions.push(subcategory);
  }
  const [hashtagInput, setHashtagInput] = useState(
    formatHashtags(item?.hashtags ?? []),
  );

  useEffect(() => {
    const urls = blobUrls.current;
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, []);

  const uploading = tiles.some((tile) => !tile.photo);
  const hashtags = parseHashtags(hashtagInput);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setError("");
    const room = MAX_PHOTOS - tiles.length;

    if (files.length > room) {
      setError(`You can add ${room} more photo${room === 1 ? "" : "s"}.`);
    }

    const accepted = files.slice(0, Math.max(room, 0)).filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files can be added.");
        return false;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError("Photos can be up to 10 MB each.");
        return false;
      }
      return true;
    });

    const newTiles = accepted.map((file) => {
      const preview = URL.createObjectURL(file);
      blobUrls.current.push(preview);
      return { key: `${preview}`, preview, photo: null, file };
    });

    setTiles((current) => [
      ...current,
      ...newTiles.map(({ key, preview }) => ({ key, preview, photo: null })),
    ]);

    await Promise.all(
      newTiles.map(async ({ key, file }) => {
        try {
          const photo = await uploadPhoto(closetId, file);
          setTiles((current) =>
            current.map((tile) =>
              tile.key === key ? { ...tile, photo } : tile,
            ),
          );
        } catch (err) {
          setTiles((current) => current.filter((tile) => tile.key !== key));
          setError(err instanceof Error ? err.message : "Photo upload failed.");
        }
      }),
    );
  }

  function removeTile(key: string) {
    setTiles((current) => current.filter((tile) => tile.key !== key));
  }

  function makeCover(key: string) {
    setTiles((current) => {
      const tile = current.find((t) => t.key === key);
      return tile ? [tile, ...current.filter((t) => t.key !== key)] : current;
    });
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const read = (name: string) => String(form.get(name) ?? "").trim();

    const priceCents = parsePrice(read("price"));
    const minPriceCents = parsePrice(read("minPrice"));
    const soldPriceCents =
      status === "SOLD"
        ? parsePrice(read("soldPrice"))
        : (item?.soldPriceCents ?? null);

    if (
      priceCents === undefined ||
      minPriceCents === undefined ||
      soldPriceCents === undefined
    ) {
      setError("Enter prices like 24 or 24.99.");
      return;
    }

    if (
      priceCents !== null &&
      minPriceCents !== null &&
      minPriceCents > priceCents
    ) {
      setError("Lowest acceptable price can't be more than the listed price.");
      return;
    }

    if (hashtags.length > MAX_HASHTAGS) {
      setError(`Add up to ${MAX_HASHTAGS} hashtags.`);
      return;
    }

    const ownerValue = read("ownerId");

    const body = {
      name: read("name"),
      description: description.trim() || null,
      hashtags,
      brand: read("brand") || null,
      size: read("size") || null,
      condition: read("condition") || null,
      category: category || null,
      subcategory: category && subcategory ? subcategory : null,
      color: read("color") || null,
      status,
      priceCents,
      minPriceCents,
      soldPriceCents,
      listingUrl: read("listingUrl") || null,
      notes: read("notes") || null,
      ownerId: ownerValue ? Number(ownerValue) : null,
      photos: tiles.flatMap((tile) =>
        tile.photo
          ? [{ url: tile.photo.url, publicId: tile.photo.publicId }]
          : [],
      ),
    };

    setSaving(true);
    const result = item
      ? await api<Item>(`/api/closets/${closetId}/items/${item.id}`, {
          method: "PATCH",
          body,
        })
      : await api<Item>(`/api/closets/${closetId}/items`, {
          method: "POST",
          body,
        });
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    onSaved(result.data);
  }

  async function handleDelete() {
    if (!item) return;

    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    const result = await api(`/api/closets/${closetId}/items/${item.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    onDeleted(item.id);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="field-label mb-1.5">
          Photos{" "}
          <span className="font-normal text-plum/60">
            ({tiles.length}/{MAX_PHOTOS}, optional)
          </span>
        </legend>

        {uploadsEnabled ? (
          <>
            <ul className="grid grid-cols-4 gap-2">
              {tiles.map((tile, index) => (
                <li
                  key={tile.key}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-lavender-gray bg-lavender"
                >
                  <img
                    src={tile.preview}
                    alt={`Photo ${index + 1}`}
                    className={`h-full w-full object-cover ${tile.photo ? "" : "opacity-50"}`}
                  />
                  {!tile.photo && (
                    <span className="absolute inset-0 grid place-items-center text-xs font-medium text-plum">
                      Uploading...
                    </span>
                  )}
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-plum px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Cover
                    </span>
                  )}
                  {tile.photo && (
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
                      {index !== 0 ? (
                        <button
                          type="button"
                          onClick={() => makeCover(tile.key)}
                          aria-label={`Make photo ${index + 1} the cover`}
                          title="Make cover"
                          className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-plum shadow-sm cursor-pointer hover:bg-white"
                        >
                          <StarIcon size={14} weight="bold" />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => removeTile(tile.key)}
                        aria-label={`Remove photo ${index + 1}`}
                        title="Remove"
                        className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-coral shadow-sm cursor-pointer hover:bg-white"
                      >
                        <XIcon size={14} weight="bold" />
                      </button>
                    </div>
                  )}
                </li>
              ))}

              {tiles.length < MAX_PHOTOS && (
                <li className="aspect-square">
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-lilac/60 bg-lavender/50 text-xs font-medium text-plum/70 transition cursor-pointer hover:bg-lavender focus-visible:outline-2 focus-visible:outline-lilac"
                  >
                    <CameraIcon size={24} aria-hidden="true" />
                    Add photos
                  </button>
                </li>
              )}
            </ul>
            <p className="text-xs text-plum/60">
              Photos are cropped to squares. The first one is the cover; tap the
              star to change it.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </>
        ) : (
          <p className="muted">Photo uploads aren't set up yet.</p>
        )}
      </fieldset>

      <div className="field">
        <label htmlFor="item-name" className="field-label">
          Title
        </label>
        <input
          id="item-name"
          name="name"
          type="text"
          required
          maxLength={80}
          defaultValue={item?.name ?? ""}
          placeholder="Vintage Levi's denim jacket"
          className="input"
        />
      </div>

      <div className="field">
        <div className="flex items-baseline justify-between">
          <label htmlFor="item-description" className="field-label">
            Description
          </label>
          <span className="text-xs text-plum/50">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <textarea
          id="item-description"
          rows={5}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            "Brand, item, size\nMeasurements (pit to pit, length)\nCondition and any flaws"
          }
          className="input resize-y"
        />
      </div>

      <div className="field">
        <div className="flex items-baseline justify-between">
          <label htmlFor="item-hashtags" className="field-label">
            Hashtags
          </label>
          <span
            className={`text-xs ${hashtags.length > MAX_HASHTAGS ? "text-coral" : "text-plum/50"}`}
          >
            {hashtags.length}/{MAX_HASHTAGS}
          </span>
        </div>
        <input
          id="item-hashtags"
          type="text"
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          placeholder="#vintage #y2k #denim"
          autoCapitalize="none"
          spellCheck={false}
          className="input"
        />
        <p className="text-xs text-plum/60">
          Added to the end of the description when you copy it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="item-brand" className="field-label">
            Brand
          </label>
          <input
            id="item-brand"
            name="brand"
            type="text"
            maxLength={60}
            defaultValue={item?.brand ?? ""}
            placeholder="Levi's"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="item-size" className="field-label">
            Size
          </label>
          <input
            id="item-size"
            name="size"
            type="text"
            maxLength={30}
            defaultValue={item?.size ?? ""}
            placeholder="M, US 8, W30 L32"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="item-condition" className="field-label">
            Condition
          </label>
          <select
            id="item-condition"
            name="condition"
            defaultValue={item?.condition ?? ""}
            className="input cursor-pointer"
          >
            <option value="">Not set</option>
            {CONDITION_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="item-category" className="field-label">
            Category
          </label>
          <select
            id="item-category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            className="input cursor-pointer"
          >
            <option value="">Not set</option>
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="item-subcategory" className="field-label">
            Subcategory
          </label>
          <select
            id="item-subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={!category}
            className="input cursor-pointer disabled:cursor-not-allowed disabled:bg-mist disabled:text-plum/40"
          >
            <option value="">
              {category ? "Not set" : "Pick a category first"}
            </option>
            {subcategoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="item-color" className="field-label">
            Color
          </label>
          <input
            id="item-color"
            name="color"
            type="text"
            maxLength={30}
            defaultValue={item?.color ?? ""}
            placeholder="Blue"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="item-owner" className="field-label">
            Belongs to
          </label>
          <select
            id="item-owner"
            name="ownerId"
            defaultValue={item?.owner?.id ?? ""}
            className="input cursor-pointer"
          >
            <option value="">No one</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="field">
          <label htmlFor="item-status" className="field-label">
            Status
          </label>
          <select
            id="item-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemStatus)}
            className="input cursor-pointer"
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="item-price" className="field-label">
            Listed price
          </label>
          <input
            id="item-price"
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={centsToInput(item?.priceCents)}
            placeholder="$0.00"
            className="input"
          />
        </div>

        <div className="field">
          <label htmlFor="item-min-price" className="field-label">
            Lowest acceptable
          </label>
          <input
            id="item-min-price"
            name="minPrice"
            type="text"
            inputMode="decimal"
            defaultValue={centsToInput(item?.minPriceCents)}
            placeholder="$0.00"
            className="input"
          />
        </div>

        {status === "SOLD" && (
          <div className="field">
            <label htmlFor="item-sold-price" className="field-label">
              Sold for
            </label>
            <input
              id="item-sold-price"
              name="soldPrice"
              type="text"
              inputMode="decimal"
              defaultValue={centsToInput(item?.soldPriceCents)}
              placeholder="$0.00"
              className="input"
            />
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="item-listing-url" className="field-label">
          Listing link
        </label>
        <input
          id="item-listing-url"
          name="listingUrl"
          type="url"
          defaultValue={item?.listingUrl ?? ""}
          placeholder="https://..."
          className="input"
        />
      </div>

      <div className="field">
        <label htmlFor="item-notes" className="field-label">
          Private notes
        </label>
        <textarea
          id="item-notes"
          name="notes"
          rows={2}
          maxLength={500}
          defaultValue={item?.notes ?? ""}
          placeholder="Only your closet sees these"
          className="input resize-y"
        />
      </div>

      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {item ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={
              confirmDelete
                ? "btn-small-danger"
                : "inline-flex items-center gap-1.5 text-sm font-medium text-coral cursor-pointer hover:underline"
            }
          >
            <TrashIcon size={16} aria-hidden="true" />
            {deleting
              ? "Deleting..."
              : confirmDelete
                ? "Yes, delete listing"
                : "Delete"}
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-small-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="btn-small-primary"
          >
            {uploading
              ? "Uploading..."
              : saving
                ? "Saving..."
                : item
                  ? "Save"
                  : "Add listing"}
          </button>
        </div>
      </div>
    </form>
  );
}
