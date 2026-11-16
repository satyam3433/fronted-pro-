import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine, ArrowLeftRight, Armchair, Check, ChevronDown, CircleDollarSign,
  ClipboardList, LayoutDashboard, LogOut, Pencil, Plus, Sparkles,
  Trash2, Users, Utensils, X
} from "lucide-react";
import { api, formatMoney } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

function MetricCard({ label, value, note, icon: Icon }) {
  return (
    <article className="metric-card">
      <div className="metric-label-row"><span>{label}</span><span className="metric-icon"><Icon size={15} /></span></div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{note}</div>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>;
}

function TableCard({ table, selected, onSelect }) {
  const order = table.activeOrder;
  return (
    <button className={`table-card status-${table.status}${selected ? " selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
      <div className="table-card-top">
        <div><div className="table-number">{table.tableNumber}</div><div className="table-capacity">{table.capacity} seats</div></div>
        <StatusBadge status={table.status} />
      </div>
      <div className="table-card-floor">{table.floor}</div>
      <div className="table-card-footer">
        {order ? <><span className="card-total">{formatMoney(order.bill.total)}</span><span>{order.items.length} {order.items.length === 1 ? "item" : "items"}</span></> :
          <><span>{table.status === "dirty" ? "Needs cleaning" : "Ready to seat"}</span><span>{table.capacity} seats</span></>}
      </div>
    </button>
  );
}

function TableModal({ table, onClose, onSave }) {
  const [values, setValues] = useState({
    tableNumber: table?.tableNumber || "",
    capacity: table?.capacity || 2,
    floor: table?.floor || ""
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(event) {
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head">
          <div><h2 id="modal-title">{table ? "Edit table" : "Add a table"}</h2><p>{table ? "Update this table's details." : "Set up a new spot on your floor."}</p></div>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={17} /></button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label className="field">Table number<input name="tableNumber" value={values.tableNumber} onChange={update} placeholder="e.g. T09" maxLength="16" required autoFocus /></label>
          <div className="form-row modal-form-row">
            <label className="field">Seating capacity<input name="capacity" type="number" min="1" step="1" value={values.capacity} onChange={update} required /></label>
            <label className="field">Floor / zone<input name="floor" value={values.floor} onChange={update} placeholder="e.g. Main Floor" maxLength="40" required /></label>
          </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? "Saving…" : table ? "Save changes" : "Add table"}</button></div>
        </form>
      </section>
    </div>
  );
}

function OrderPanel({ table, tables, isAdmin, runAction, onEdit, onDelete, notify }) {
  const [itemName, setItemName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("food");
  const [targetTableId, setTargetTableId] = useState("");
  const [busy, setBusy] = useState(false);
  const order = table?.activeOrder;

  useEffect(() => {
    setItemName("");
    setPrice("");
    setCategory("food");
    setTargetTableId("");
  }, [order?.id, table?.id]);

  if (!table) {
    return <section className="panel order-panel"><div className="empty-order"><div className="empty-icon"><Armchair size={21} /></div><h3>No tables yet</h3><p>Add your first table to start managing service.</p>{isAdmin && <button className="button button-primary order-empty-action" onClick={onEdit}>＋ Add a table</button>}</div></section>;
  }

  async function addItem(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await runAction(`/orders/${order.id}/items`, "POST", { name: itemName, category, price });
      notify(`${itemName.trim()} added to the order.`);
      setItemName("");
      setPrice("");
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function settleOrder() {
    if (!window.confirm(`Settle this bill for ${formatMoney(order.bill.total)} and check out?`)) return;
    setBusy(true);
    try {
      await runAction(`/orders/${order.id}/settle`, "POST", {});
      notify("Bill settled. Table marked dirty for cleanup.");
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function transferOrder() {
    if (!targetTableId) return notify("Choose an available target table first.", true);
    setBusy(true);
    try {
      await runAction(`/orders/${order.id}/transfer`, "POST", { targetTableId });
      notify("Order transferred successfully.");
    } catch (error) {
      notify(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  const availableTables = tables.filter(candidate => candidate.status === "available");

  return (
    <section className="panel order-panel">
      <div className="order-panel-top">
        <div className="panel-heading">
          <div><div className="order-table-line"><h2 className="order-table-name">{table.tableNumber}</h2><StatusBadge status={table.status} /></div>
            <div className="order-meta">{table.floor} · {table.capacity} seats{order ? ` · Started ${new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</div></div>
          {isAdmin && <button className="button button-light icon-button" onClick={() => onEdit(table)} aria-label={`Edit ${table.tableNumber}`}><Pencil size={14} /> Edit</button>}
        </div>
      </div>
      {order ? (
        <div className="order-panel-body">
          {order.items.length ? <div className="order-items">{order.items.map(item => (
            <div className="order-item" key={item.id}>
              <div className="item-main"><span className="item-category-icon">{item.category === "food" ? <Utensils size={13} /> : <CircleDollarSign size={13} />}</span>
                <div className="item-copy"><div className="item-name">{item.name}</div><div className="item-category">{item.category} · GST {item.category === "food" ? "5%" : "18%"}</div></div></div>
              <span className="item-price">{formatMoney(item.price)}</span>
            </div>
          ))}</div> : <div className="section-empty">No items yet — add the first item below.</div>}
          <div className="divider" />
          <div className="bill-line"><span>Subtotal</span><strong>{formatMoney(order.bill.subtotal)}</strong></div>
          <div className="bill-line"><span>GST</span><strong>{formatMoney(order.bill.gst)}</strong></div>
          <div className="bill-line"><span>Service charge (10%)</span><strong>{formatMoney(order.bill.serviceCharge)}</strong></div>
          <div className="bill-line total"><span>Total payable</span><strong>{formatMoney(order.bill.total)}</strong></div>
          <p className="tax-note">Food GST 5% · Beverage GST 18% · Service charge on subtotal</p>
          <form className="quick-order" onSubmit={addItem}>
            <h3>Quick order</h3>
            <div className="form-grid">
              <label className="field">Item name<input value={itemName} onChange={event => setItemName(event.target.value)} placeholder="e.g. Butter chicken" maxLength="60" required /></label>
              <label className="field">Price (₹)<input type="number" min="0.01" step="0.01" value={price} onChange={event => setPrice(event.target.value)} placeholder="0.00" required /></label>
            </div>
            <div className="form-row">
              <label className="field">Category<select value={category} onChange={event => setCategory(event.target.value)}><option value="food">Food · 5% GST</option><option value="beverage">Beverage · 18% GST</option></select></label>
              <button className="button button-primary" type="submit" disabled={busy}>＋ Add item</button>
            </div>
          </form>
          <div className="transfer-controls">
            <label className="sr-only" htmlFor="transfer-target">Transfer order to table</label>
            <select id="transfer-target" value={targetTableId} onChange={event => setTargetTableId(event.target.value)} disabled={!availableTables.length}>
              <option value="">{availableTables.length ? "Transfer to table…" : "No available tables"}</option>
              {availableTables.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.tableNumber} · {candidate.floor}</option>)}
            </select>
            <button className="button button-secondary" onClick={transferOrder} disabled={!availableTables.length || busy}><ArrowLeftRight size={14} /> Transfer</button>
          </div>
          <button className="button button-danger button-block" onClick={settleOrder} disabled={busy} style={{ marginTop: 9 }}>Settle & check out</button>
        </div>
      ) : (
        <div className="empty-order">
          <div className="empty-icon">{table.status === "dirty" ? <Sparkles size={20} /> : <Plus size={20} />}</div>
          <h3>{table.status === "dirty" ? "Ready for a reset" : "Table is ready"}</h3>
          <p>{table.status === "dirty" ? "Mark this table available once the cleaning is complete." : "Start a new order when your guests are seated."}</p>
          {table.status === "dirty"
            ? <button className="button button-secondary order-empty-action" onClick={() => runAction(`/tables/${table.id}/clean`, "POST", {}).then(() => notify("Table marked available.")).catch(error => notify(error.message, true))}><Check size={14} /> Mark as available</button>
            : <button className="button button-primary order-empty-action" onClick={() => runAction("/orders", "POST", { tableId: table.id }).then(() => notify("Order started. Add items to build the bill.")).catch(error => notify(error.message, true))}><Plus size={15} /> Start an order</button>}
          {isAdmin && <div className="inactive-table-actions"><button className="button button-danger" onClick={() => onDelete(table)}><Trash2 size={13} /> Delete table</button></div>}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [state, setState] = useState({ tables: [], analytics: {} });
  const [selectedTableId, setSelectedTableId] = useState(null);
  const selectedTableRef = useRef(null);
  const [selectedFloor, setSelectedFloor] = useState("All floors");
  const [modalTable, setModalTable] = useState(undefined);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === "admin";

  const refreshState = useCallback(async (keepSelection = true) => {
    const previousSelection = selectedTableRef.current;
    const nextState = await api("/state");
    setState(nextState);
    const stillExists = keepSelection && nextState.tables.some(table => table.id === previousSelection);
    const nextSelection = stillExists
      ? previousSelection
      : nextState.tables.find(table => table.status === "occupied")?.id || nextState.tables[0]?.id || null;
    selectedTableRef.current = nextSelection;
    setSelectedTableId(nextSelection);
    return nextState;
  }, []);

  useEffect(() => {
    refreshState(false).catch(requestError => setError(requestError.message)).finally(() => setLoading(false));
  }, [refreshState]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const floors = useMemo(() => [...new Set(state.tables.map(table => table.floor))].sort((a, b) => a.localeCompare(b)), [state.tables]);
  const filteredTables = state.tables.filter(table => selectedFloor === "All floors" || table.floor === selectedFloor);
  const occupiedCount = state.tables.filter(table => table.status === "occupied").length;
  const availableCount = filteredTables.filter(table => table.status === "available").length;
  const selectedTable = state.tables.find(table => table.id === selectedTableId) || null;

  useEffect(() => {
    if (selectedFloor !== "All floors" && !floors.includes(selectedFloor)) setSelectedFloor("All floors");
  }, [floors, selectedFloor]);

  function notify(message, isError = false) {
    setToast({ message, isError });
  }

  async function runAction(route, method = "POST", body) {
    setError("");
    const result = await api(route, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    await refreshState();
    return result;
  }

  async function saveTable(values) {
    const editing = modalTable && typeof modalTable === "object";
    const table = await api(editing ? `/tables/${modalTable.id}` : "/tables", {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(values)
    });
    if (!editing) {
      setSelectedFloor("All floors");
    }
    await refreshState();
    if (!editing) {
      selectedTableRef.current = table.table.id;
      setSelectedTableId(table.table.id);
    }
    notify(editing ? "Table details updated." : "Table added to the floor.");
  }

  function openTableForm(table = null) {
    setModalTable(table);
  }

  async function deleteTable(table) {
    if (!window.confirm(`Delete ${table.tableNumber}? This cannot be undone.`)) return;
    try {
      await api(`/tables/${table.id}`, { method: "DELETE" });
      await refreshState(false);
      notify("Table deleted.");
    } catch (requestError) {
      notify(requestError.message, true);
    }
  }

  async function exportDatabase() {
    try {
      const response = await fetch("/api/export", { credentials: "same-origin" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export could not be downloaded.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dinesync-database.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      notify(requestError.message, true);
    }
  }

  async function signOut() {
    await logout();
  }

  if (loading) {
    return <main className="boot-screen"><span className="brand-mark">d</span><p>Setting the tables…</p></main>;
  }
  if (error && !state.tables.length) {
    return <main className="boot-screen"><span className="brand-mark">d</span><h2>Couldn't load the floor</h2><p>{error}</p><button className="button button-secondary" onClick={() => refreshState(false).catch(requestError => setError(requestError.message))}>Try again</button></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="DineSync home"><span className="brand-mark">d</span><span className="brand-copy"><span className="brand-name">dinesync</span><span className="brand-subtitle">RESTAURANT OPS</span></span></a>
        <div className="sidebar-label">Workspace</div>
        <nav aria-label="Main navigation">
          <button className="nav-item active"><LayoutDashboard size={17} /><span className="nav-label">Overview</span></button>
          <button className="nav-item" onClick={() => document.querySelector("#floor-map")?.scrollIntoView({ behavior: "smooth" })}><Armchair size={17} /><span className="nav-label">Table management</span></button>
          <button className="nav-item" onClick={() => document.querySelector("#floor-map")?.scrollIntoView({ behavior: "smooth" })}><ClipboardList size={17} /><span className="nav-label">Floor & orders</span></button>
          {isAdmin && <button className="nav-item" onClick={exportDatabase}><ArrowDownToLine size={17} /><span className="nav-label">Export database</span></button>}
        </nav>
        <div className="sidebar-bottom">
          <div className="shift-card"><div className="shift-card-top"><span className="online-dot" />Live service</div><p>Signed in as {user.name}</p></div>
          <button className="logout-button" onClick={signOut}><LogOut size={15} /> Sign out</button>
          <div className="sidebar-footer">DineSync · Service made simple</div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>Admin dashboard</strong></div>
          <div className="topbar-right"><span className="live-indicator"><span className="online-dot" />Live updates</span><span className="user-chip"><span className="avatar">{user.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()}</span><span className="user-chip-copy"><strong>{user.name}</strong><small>{user.role}</small></span></span></div>
        </header>
        <section className="page-heading">
          <div><div className="eyebrow">{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())} · Dinner service</div><h1>Good service starts here.</h1><p>Manage your floor, orders, and checkout from one place.</p></div>
          {isAdmin && <button className="button button-primary" onClick={() => setModalTable(null)}><Plus size={15} /> Add table</button>}
        </section>
        <section className="metrics" aria-label="Live service metrics">
          <MetricCard label="Current occupancy" value={`${state.analytics.occupancy || 0}%`} note={`${occupiedCount} of ${state.tables.length} tables seated`} icon={Armchair} />
          <MetricCard label="Live revenue" value={formatMoney(state.analytics.liveRevenue)} note="Across active, unpaid orders" icon={CircleDollarSign} />
          <MetricCard label="Pending cleanups" value={state.analytics.pendingCleanups || 0} note="Tables waiting to be reset" icon={Sparkles} />
          <MetricCard label="Busiest floor" value={state.analytics.topFloor || "—"} note={`${state.analytics.topFloorOrders || 0} active ${(state.analytics.topFloorOrders || 0) === 1 ? "order" : "orders"}`} icon={Users} />
        </section>
        <div className="workspace">
          <section className="panel floor-panel" id="floor-map">
            <div className="panel-heading">
              <div><h2 className="panel-title">Live floor map</h2><p className="panel-subtitle">Select a table to manage service and its bill</p></div>
              <label className="floor-filter"><span className="sr-only">Filter by floor</span><select className="floor-select" value={selectedFloor} onChange={event => setSelectedFloor(event.target.value)}><option>All floors</option>{floors.map(floor => <option key={floor}>{floor}</option>)}</select><ChevronDown size={12} /></label>
            </div>
            <div className="floor-summary"><span><strong>{filteredTables.length} tables</strong> · {selectedFloor}</span><span>{availableCount} available</span></div>
            {filteredTables.length ? <div className="table-grid">{filteredTables.map(table => <TableCard key={table.id} table={table} selected={table.id === selectedTableId} onSelect={() => { selectedTableRef.current = table.id; setSelectedTableId(table.id); }} />)}</div> : <div className="section-empty">No tables on this floor yet.</div>}
            <div className="legend"><span className="legend-item"><i className="legend-dot available" />Available</span><span className="legend-item"><i className="legend-dot occupied" />Occupied</span><span className="legend-item"><i className="legend-dot dirty" />Dirty</span></div>
          </section>
          <OrderPanel table={selectedTable} tables={state.tables} isAdmin={isAdmin} runAction={runAction} onEdit={openTableForm} onDelete={deleteTable} notify={notify} />
        </div>
      </main>
      {modalTable !== undefined && <TableModal table={modalTable} onClose={() => setModalTable(undefined)} onSave={saveTable} />}
      {toast && <div className={`toast visible${toast.isError ? " error" : ""}`} role={toast.isError ? "alert" : "status"}>{toast.message}</div>}
    </div>
  );
}
