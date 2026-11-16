import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  CoatHangerIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import AppShell from "../components/AppShell";
import ItemDialog from "../components/ItemDialog";
import ItemViewDialog from "../components/ItemViewDialog";
import ManageClosetDialog from "../components/ManageClosetDialog";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import {
  STATUS_OPTIONS,
  coverImage,
  formatPrice,
  setLastClosetId,
  type ClosetDetail,
  type ClosetSummary,
  type Item,
  type ItemStatus,
} from "../lib/closets";

const filters = [
  { value: "all", label: "All" },
  { value: "TO_UPLOAD", label: "To upload" },
  { value: "LISTED", label: "Listed" },
  { value: "SOLD", label: "Sold" },
] as const;

type Filter = (typeof filters)[number]["value"];

const NEW_CLOSET_OPTION = "new";

export default function ClosetPageRoute(): JSX.Element {
  const { closetId: closetParam } = useParams();
  const closetId = Number(closetParam);

  if (!Number.isSafeInteger(closetId) || closetId <= 0) {
    return <Navigate to="/closet" replace />;
  }

  return <ClosetPage key={closetId} closetId={closetId} />;
}

function ClosetPage({ closetId }: { closetId: number }): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [closet, setCloset] = useState<ClosetDetail | null>(null);
  const [closets, setClosets] = useState<ClosetSummary[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [uploadsEnabled, setUploadsEnabled] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [returnToView, setReturnToView] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const fetchCloset = useCallback(
    () =>
      Promise.all([
        api<ClosetDetail>(`/api/closets/${closetId}`),
        api<ClosetSummary[]>("/api/closets"),
      ]),
    [closetId],
  );

  const applyCloset = useCallback(
    ([detail, list]: Awaited<ReturnType<typeof fetchCloset>>) => {
      if (!detail.ok) {
        if (detail.status === 404) {
          setLastClosetId(null);
          setNotFound(true);
        } else {
          setLoadError(detail.message);
        }
        return;
      }

      setCloset(detail.data);
      setLastClosetId(detail.data.id);
      if (list.ok) setClosets(list.data);
    },
    [],
  );

  const reloadCloset = useCallback(() => {
    void fetchCloset().then(applyCloset);
  }, [fetchCloset, applyCloset]);

  useEffect(() => {
    let active = true;

    fetchCloset().then((result) => {
      if (active) applyCloset(result);
    });

    api<Item[]>(`/api/closets/${closetId}/items`).then((result) => {
      if (!active) return;
      if (result.ok) setItems(result.data);
      else if (result.status !== 404) setLoadError(result.message);
    });

    api<{ enabled: boolean }>("/api/closets/uploads/config").then((result) => {
      if (active && result.ok) setUploadsEnabled(result.data.enabled);
    });

    return () => {
      active = false;
    };
  }, [closetId, fetchCloset, applyCloset]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: 0,
      TO_UPLOAD: 0,
      LISTED: 0,
      SOLD: 0,
    };
    for (const item of items ?? []) {
      result.all++;
      result[item.status]++;
    }
    return result;
  }, [items]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (items ?? []).filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!query ||
          [
            item.name,
            item.brand,
            item.size,
            item.category,
            item.color,
            item.description,
            item.notes,
            item.owner?.name,
            item.createdBy?.name,
            ...item.hashtags,
          ].some((value) => value?.toLowerCase().includes(query))),
    );
  }, [items, filter, search]);

  if (notFound) {
    return <Navigate to="/closet" replace />;
  }

  const viewingItem = items?.find((i) => i.id === viewingId) ?? null;

  function openNewItem() {
    setEditingItem(null);
    setReturnToView(false);
    setItemDialogOpen(true);
  }

  function openViewItem(item: Item) {
    setViewingId(item.id);
    setViewOpen(true);
  }

  function openEditItem(item: Item, fromView = false) {
    setEditingItem(item);
    setReturnToView(fromView);
    setViewOpen(false);
    setItemDialogOpen(true);
  }

  function closeEdit() {
    setItemDialogOpen(false);
    if (returnToView) setViewOpen(true);
  }

  function handleSaved(saved: Item) {
    setItems((current) => {
      const list = current ?? [];
      return list.some((i) => i.id === saved.id)
        ? list.map((i) => (i.id === saved.id ? saved : i))
        : [saved, ...list];
    });
    setItemDialogOpen(false);
    setViewingId(saved.id);
    setViewOpen(true);
  }

  function handleDeleted(itemId: number) {
    setItems((current) => (current ?? []).filter((i) => i.id !== itemId));
    setItemDialogOpen(false);
    setViewOpen(false);
    setViewingId(null);
  }

  async function changeStatus(item: Item, status: ItemStatus) {
    setActionError("");
    setItems((current) =>
      (current ?? []).map((i) => (i.id === item.id ? { ...i, status } : i)),
    );

    const result = await api<Item>(
      `/api/closets/${closetId}/items/${item.id}`,
      { method: "PATCH", body: { status } },
    );

    if (!result.ok) {
      setActionError(result.message);
      setItems((current) =>
        (current ?? []).map((i) => (i.id === item.id ? item : i)),
      );
      return;
    }

    setItems((current) =>
      (current ?? []).map((i) => (i.id === item.id ? result.data : i)),
    );
  }

  function handleSwitch(value: string) {
    if (value === NEW_CLOSET_OPTION) {
      navigate("/closet/new");
    } else {
      navigate(`/closet/${value}`);
    }
  }

  const filterElements = filters.map(({ value, label }) => (
    <button
      type="button"
      key={value}
      onClick={() => setFilter(value)}
      aria-pressed={filter === value}
      className={`rounded-full px-4 py-2 whitespace-nowrap cursor-pointer  ${
        filter === value
          ? "bg-plum text-white hover:bg-plum/85"
          : "border border-lavender-gray text-ink hover:bg-lavender/50 hover:border-lilac hover:text-plum"
      }`}
    >
      {label}
      <span className={filter === value ? "text-white/70" : "text-plum/50"}>
        {" "}
        {counts[value]}
      </span>
    </button>
  ));

  const cardElements = visibleItems.map((item) => (
    <li
      key={item.id}
      className="group flex flex-col overflow-hidden rounded-xl border border-lavender-gray bg-white shadow-sm shadow-plum/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-plum/15"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => openViewItem(item)}
          className="block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lilac"
          aria-label={`View ${item.name}`}
        >
          <img
            src={coverImage(item)}
            alt=""
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
          {item.photos.length > 1 && (
            <span className="absolute bottom-2 left-2 rounded-full bg-plum/80 px-2 py-0.5 text-xs font-medium text-white">
              {item.photos.length} photos
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => openEditItem(item)}
          aria-label={`Edit ${item.name}`}
          title="Edit"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-plum shadow-sm transition cursor-pointer hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <PencilSimpleIcon size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <button
          type="button"
          onClick={() => openViewItem(item)}
          tabIndex={-1}
          className="flex items-start justify-between gap-2 text-left cursor-pointer"
        >
          <h3 className="font-bold text-plum leading-snug hover:underline">
            {item.name}
          </h3>
          {item.priceCents !== null && (
            <span className="shrink-0 font-semibold text-plum">
              {formatPrice(item.priceCents)}
            </span>
          )}
        </button>
        <p className="mb-3 text-xs text-plum/60">
          {[item.brand, item.size].filter(Boolean).join(" · ") ||
            (item.createdBy
              ? `Added by ${item.createdBy.name}`
              : "Added by a former member")}
        </p>
        <select
          aria-label={`Status for ${item.name}`}
          value={item.status}
          onChange={(e) => changeStatus(item, e.target.value as ItemStatus)}
          className="mt-auto self-start cursor-pointer rounded-full border border-lilac/40 bg-lavender/60 px-3 py-1 text-sm text-plum transition hover:bg-lavender focus-visible:outline-2 focus-visible:outline-lilac"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </li>
  ));

  return (
    <AppShell>
      {!closet ? (
        loadError ? (
          <p role="alert" className="error-box">
            {loadError}
          </p>
        ) : (
          <p className="muted">Loading closet...</p>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-plum text-4xl font-bold">{closet.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <select
                  aria-label="Switch closet"
                  value={closet.id}
                  onChange={(e) => handleSwitch(e.target.value)}
                  className="cursor-pointer rounded-full border border-lavender-gray bg-white px-3 py-1 text-plum transition hover:border-lilac focus-visible:outline-2 focus-visible:outline-lilac"
                >
                  {closets.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value={NEW_CLOSET_OPTION}>
                    + New or join closet
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="inline-flex items-center gap-1.5 text-plum/70 cursor-pointer hover:text-plum"
                >
                  <UsersIcon size={18} aria-hidden="true" />
                  {closet.members.length}{" "}
                  {closet.members.length === 1 ? "member" : "members"} · Invite
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={openNewItem}
              className="inline-flex items-center gap-2 rounded-full border border-plum bg-linear-to-b from-plum/80 to-plum px-5 py-2 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac"
            >
              <PlusIcon size={16} weight="bold" aria-hidden="true" />
              New listing
            </button>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <div className="relative min-w-60 flex-1">
              <MagnifyingGlassIcon
                size={22}
                className="text-plum absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                aria-label="Search items"
                type="search"
                placeholder="Search items"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-lavender-gray pl-11 py-2 bg-white placeholder:text-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">{filterElements}</div>
          </div>

          {actionError && (
            <p role="alert" className="error-box">
              {actionError}
            </p>
          )}

          {items === null ? (
            <p className="muted">Loading items...</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <CoatHangerIcon
                size={56}
                weight="fill"
                className="text-lilac"
                aria-hidden="true"
              />
              <p className="font-fredoka text-2xl font-medium text-plum">
                Nothing in the closet yet
              </p>
              <p className="muted">
                Add your first item, or invite people to start sharing.
              </p>
              <button
                type="button"
                onClick={openNewItem}
                className="btn-small-primary mt-2"
              >
                <PlusIcon size={16} weight="bold" aria-hidden="true" />
                Add an item
              </button>
            </div>
          ) : visibleItems.length === 0 ? (
            <p className="muted py-10 text-center">No items match.</p>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {cardElements}
            </ul>
          )}

          <ItemViewDialog
            open={viewOpen && viewingItem !== null}
            item={viewingItem}
            onClose={() => setViewOpen(false)}
            onEdit={(item) => openEditItem(item, true)}
          />

          <ItemDialog
            open={itemDialogOpen}
            closetId={closet.id}
            item={editingItem}
            members={closet.members}
            uploadsEnabled={uploadsEnabled}
            onClose={closeEdit}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />

          {user && (
            <ManageClosetDialog
              open={manageOpen}
              closet={closet}
              currentUserId={user.id}
              onClose={() => setManageOpen(false)}
              onChanged={reloadCloset}
              onLeft={() => {
                setManageOpen(false);
                setLastClosetId(null);
                navigate("/closet", { replace: true });
              }}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
