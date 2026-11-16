import type { JSX } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, NavLink, useNavigate, useParams } from "react-router-dom";
import {
  ClockCounterClockwiseIcon,
  BellIcon,
  CoatHangerIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import ActivityFeed from "../components/ActivityFeed";
import AppShell from "../components/AppShell";
import ItemDialog from "../components/ItemDialog";
import ItemViewDialog from "../components/ItemViewDialog";
import ManageClosetDialog from "../components/ManageClosetDialog";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { celebrate, shouldCelebrate } from "../lib/celebrate";
import {
  STATUS_OPTIONS,
  STATUS_THEME,
  coverImage,
  daysListed,
  formatPrice,
  isStale,
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

export type ClosetView = "items" | "activity";

export default function ClosetPageRoute({
  view = "items",
}: {
  view?: ClosetView;
}): JSX.Element {
  const { closetId: closetParam } = useParams();
  const closetId = Number(closetParam);

  if (!Number.isSafeInteger(closetId) || closetId <= 0) {
    return <Navigate to="/closet" replace />;
  }

  return <ClosetPage key={closetId} closetId={closetId} view={view} />;
}

function ClosetPage({
  closetId,
  view,
}: {
  closetId: number;
  view: ClosetView;
}): JSX.Element {
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
  const searchRef = useRef<HTMLInputElement>(null);

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

  const markActivitySeen = useCallback(() => {
    setCloset((current) =>
      current ? { ...current, unreadActivity: 0 } : current,
    );
  }, []);

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

  useEffect(() => {
    let lastRefresh = Date.now();

    function refresh() {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefresh < 15_000) return;
      lastRefresh = Date.now();

      void fetchCloset().then(applyCloset);
      api<Item[]>(`/api/closets/${closetId}/items`).then((result) => {
        if (result.ok) setItems(result.data);
      });
    }

    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
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
    const filtered = (items ?? []).filter(
      (item) =>
        (filter === "all" || item.status === filter) &&
        (!query ||
          [
            item.name,
            item.brand,
            item.size,
            item.category,
            item.subcategory,
            item.color,
            item.description,
            item.notes,
            item.owner?.name,
            item.createdBy?.name,
            ...item.hashtags,
          ].some((value) => value?.toLowerCase().includes(query))),
    );
    if (!closet) return filtered;
    const staleDays = closet.staleDays;
    return [
      ...filtered.filter((item) => isStale(item, staleDays)),
      ...filtered.filter((item) => !isStale(item, staleDays)),
    ];
  }, [items, filter, search, closet]);

  const itemIds = useMemo(
    () => new Set((items ?? []).map((item) => item.id)),
    [items],
  );

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
    const previous = items?.find((i) => i.id === saved.id);
    if (previous) maybeCelebrate(previous.status, saved.status);
    else if (saved.status !== "TO_UPLOAD")
      maybeCelebrate("TO_UPLOAD", saved.status);
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

  function maybeCelebrate(from: ItemStatus, to: ItemStatus) {
    if (user?.confetti !== false && shouldCelebrate(from, to)) {
      void celebrate(to);
    }
  }

  async function changeStatus(item: Item, status: ItemStatus) {
    setActionError("");
    maybeCelebrate(item.status, status);
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

  function replaceItem(updated: Item) {
    setItems((current) =>
      (current ?? []).map((i) => (i.id === updated.id ? updated : i)),
    );
  }

  async function deleteItem(item: Item) {
    setActionError("");
    const result = await api(`/api/closets/${closetId}/items/${item.id}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      setActionError(result.message);
      return false;
    }
    handleDeleted(item.id);
    return true;
  }

  async function relistItem(item: Item) {
    setActionError("");
    const result = await api<Item>(
      `/api/closets/${closetId}/items/${item.id}/relist`,
      { method: "POST" },
    );
    if (!result.ok) {
      setActionError(result.message);
      return false;
    }
    replaceItem(result.data);
    return true;
  }

  function openItemById(itemId: number) {
    const item = items?.find((i) => i.id === itemId);
    if (item) openViewItem(item);
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
      className={`flex min-w-0 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer sm:px-4 sm:py-2 sm:text-sm ${
        filter === value
          ? value === "all"
            ? "bg-plum text-white shadow-sm hover:bg-plum/85"
            : `${STATUS_THEME[value].active} shadow-sm`
          : "text-plum/80 hover:bg-white sm:border sm:border-lavender-gray sm:hover:border-lilac sm:hover:bg-lavender/50"
      }`}
    >
      <span className="truncate">{label}</span>
      <span
        className={
          filter === value
            ? value === "all"
              ? "text-white/70"
              : "opacity-60"
            : "text-plum/45"
        }
      >
        {counts[value]}
      </span>
    </button>
  ));

  const cardElements = visibleItems.map((item) => {
    const stale = closet ? isStale(item, closet.staleDays) : false;
    const days = daysListed(item);
    return (
      <li
        key={item.id}
        className={`group flex flex-col overflow-hidden rounded-xl border shadow-sm shadow-plum/5 transition duration-200 sm:hover:-translate-y-0.5 sm:hover:shadow-md sm:hover:shadow-plum/15 ${STATUS_THEME[item.status].card}`}
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
            {stale && (
              <span
                title={`Listed ${days} days ago. Consider refreshing it.`}
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-plum shadow-sm"
              >
                <ClockCounterClockwiseIcon size={12} aria-hidden="true" />
                {days}d
              </span>
            )}
            {item.photos.length > 1 && (
              <span className="absolute bottom-2 left-2 rounded-full bg-plum/80 px-2 py-0.5 text-[11px] font-medium text-white">
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
        <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-4">
          <button
            type="button"
            onClick={() => openViewItem(item)}
            tabIndex={-1}
            className="flex flex-col items-start gap-0.5 text-left cursor-pointer sm:flex-row sm:justify-between sm:gap-2"
          >
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-plum hover:underline sm:text-base">
              {item.name}
            </h3>
            {item.priceCents !== null && (
              <span className="shrink-0 text-sm font-semibold text-plum sm:text-base">
                {formatPrice(item.priceCents)}
              </span>
            )}
          </button>
          <p className="mb-2 truncate text-xs text-plum/60 sm:mb-3">
            {[item.brand, item.size].filter(Boolean).join(" · ") ||
              (item.createdBy
                ? `Added by ${item.createdBy.name}`
                : "Added by a former member")}
          </p>
          <select
            aria-label={`Status for ${item.name}`}
            value={item.status}
            onChange={(e) => changeStatus(item, e.target.value as ItemStatus)}
            className={`mt-auto w-full cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-lilac sm:w-auto sm:self-start sm:px-3 sm:text-sm ${STATUS_THEME[item.status].chip}`}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </li>
    );
  });

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
      isActive
        ? "bg-plum text-white shadow-sm"
        : "text-plum/70 hover:bg-lavender hover:text-plum"
    }`;

  const unread = closet?.unreadActivity ?? 0;

  return (
    <AppShell nav={{ closetId, unread }}>
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
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
              <h2 className="truncate text-2xl font-bold text-plum sm:text-4xl">
                {closet.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <select
                  aria-label="Switch closet"
                  value={closet.id}
                  onChange={(e) => handleSwitch(e.target.value)}
                  className="max-w-44 cursor-pointer truncate rounded-full border border-lavender-gray bg-white px-3 py-1 text-plum transition hover:border-lilac focus-visible:outline-2 focus-visible:outline-lilac"
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
                  {closet.members.length} · Invite
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={openNewItem}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-plum bg-linear-to-b from-plum/80 to-plum px-5 py-2 text-sm font-medium text-white shadow-md shadow-plum/20 ring-1 ring-inset ring-white/25 transition duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg hover:shadow-plum/25 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac sm:inline-flex"
            >
              <PlusIcon size={16} weight="bold" aria-hidden="true" />
              New listing
            </button>
          </div>

          <nav
            aria-label="Closet sections"
            className="hidden gap-1 self-start rounded-full bg-mist p-1 sm:flex"
          >
            <NavLink to={`/closet/${closetId}`} end className={tabClass}>
              <CoatHangerIcon size={16} weight="fill" aria-hidden="true" />
              Items
            </NavLink>
            <NavLink to={`/closet/${closetId}/activity`} className={tabClass}>
              <BellIcon size={16} weight="fill" aria-hidden="true" />
              Activity
              {unread > 0 && (
                <span className="rounded-full bg-coral px-1.5 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          </nav>

          {actionError && (
            <p role="alert" className="error-box">
              {actionError}
            </p>
          )}

          {view === "items" && (
            <>
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="relative sm:min-w-60 sm:flex-1">
                  <MagnifyingGlassIcon
                    size={20}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-plum"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    aria-label="Search items"
                    type="search"
                    placeholder="Search title, brand, size, #tag"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-lavender-gray bg-white py-2 pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden text-base placeholder:text-plum/40 focus:border-lilac focus:outline-none focus:ring-2 focus:ring-lilac/40 sm:text-sm"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        searchRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-lavender text-plum transition cursor-pointer hover:bg-lilac/30 active:scale-90"
                    >
                      <XIcon size={14} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1 rounded-full bg-lavender/70 p-1 sm:flex sm:gap-2 sm:bg-transparent sm:p-0">
                  {filterElements}
                </div>
              </div>

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
                <ul className="grid grid-cols-2 gap-3 pb-20 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4 sm:pb-0">
                  {cardElements}
                </ul>
              )}

              <button
                type="button"
                onClick={openNewItem}
                aria-label="New listing"
                className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-linear-to-b from-plum/85 to-plum text-white shadow-xl shadow-plum/40 ring-1 ring-inset ring-white/25 transition active:scale-90 sm:hidden"
              >
                <PlusIcon size={26} weight="bold" aria-hidden="true" />
              </button>
            </>
          )}

          {view === "activity" && (
            <ActivityFeed
              closetId={closetId}
              currentUserId={user?.id}
              itemExists={(id) => itemIds.has(id)}
              onOpenItem={openItemById}
              onSeen={markActivitySeen}
            />
          )}

          <ItemViewDialog
            open={viewOpen && viewingItem !== null}
            item={viewingItem}
            onClose={() => setViewOpen(false)}
            onEdit={(item) => openEditItem(item, true)}
            staleDays={closet.staleDays}
            onRelist={relistItem}
            onStatusChange={changeStatus}
            onDelete={deleteItem}
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
