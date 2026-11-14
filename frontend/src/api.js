const DATABASE_KEY = "dinesync-demo-database";
const SESSION_KEY = "dinesync-demo-session";

const DEMO_USERS = [
  { id: "demo-admin", name: "Restaurant Admin", email: "admin@dinesync.demo", password: "DineSyncDemo!2026", role: "admin" },
  { id: "demo-captain", name: "Floor Captain", email: "captain@dinesync.demo", password: "DineSyncCaptain!2026", role: "captain" }
];

function createSeedDatabase() {
  const now = new Date().toISOString();
  const tables = [
    ["T01", 2, "Main Floor", "available"],
    ["T02", 2, "Main Floor", "occupied"],
    ["T03", 4, "Main Floor", "available"],
    ["T04", 4, "Main Floor", "available"],
    ["T05", 4, "Garden", "occupied"],
    ["T06", 6, "Garden", "available"],
    ["T07", 6, "Rooftop", "dirty"],
    ["T08", 2, "Rooftop", "available"]
  ].map(([tableNumber, capacity, floor, status], index) => ({
    id: `table-${index + 1}`,
    tableNumber,
    capacity,
    floor,
    status,
    createdAt: now,
    updatedAt: now
  }));
  const orders = [
    {
      id: "order-sample-1",
      tableId: "table-2",
      status: "active",
      createdAt: now,
      updatedAt: now,
      settledAt: null,
      bill: null,
      items: [
        { id: "item-1", name: "Paneer tikka", category: "food", price: 320, createdAt: now },
        { id: "item-2", name: "Masala chai", category: "beverage", price: 90, createdAt: now }
      ]
    },
    {
      id: "order-sample-2",
      tableId: "table-5",
      status: "active",
      createdAt: now,
      updatedAt: now,
      settledAt: null,
      bill: null,
      items: [
        { id: "item-3", name: "Mushroom pasta", category: "food", price: 440, createdAt: now },
        { id: "item-4", name: "Fresh lime soda", category: "beverage", price: 130, createdAt: now }
      ]
    }
  ];
  return { tables, orders };
}

function readDatabase() {
  const saved = localStorage.getItem(DATABASE_KEY);
  if (!saved) return createSeedDatabase();
  const database = JSON.parse(saved);
  if (!database || !Array.isArray(database.tables) || !Array.isArray(database.orders)) {
    throw new Error("Demo data is invalid. Reset the demo from the sign-in page.");
  }
  return database;
}

function writeDatabase(database) {
  localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
}

function id() {
  return globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function moneyToCents(value) {
  return Math.round(Number(value) * 100);
}

function centsToMoney(value) {
  return Number((value / 100).toFixed(2));
}

function calculateBill(order) {
  let subtotalCents = 0;
  let gstCents = 0;
  for (const item of order.items) {
    const itemCents = moneyToCents(item.price);
    subtotalCents += itemCents;
    gstCents += Math.round(itemCents * (item.category === "food" ? 0.05 : 0.18));
  }
  const serviceChargeCents = Math.round(subtotalCents * 0.1);
  return {
    subtotal: centsToMoney(subtotalCents),
    gst: centsToMoney(gstCents),
    serviceCharge: centsToMoney(serviceChargeCents),
    total: centsToMoney(subtotalCents + gstCents + serviceChargeCents)
  };
}

function getSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  return saved ? JSON.parse(saved) : null;
}

function requireSession() {
  const user = getSession();
  if (!user) throw new Error("Please sign in to continue.");
  return user;
}

function requireAdmin(user) {
  if (user.role !== "admin") throw new Error("Only an Admin can manage tables or export data.");
}

function createState(database) {
  const activeOrders = database.orders.filter(order => order.status === "active");
  const ordersByTable = new Map(activeOrders.map(order => [order.tableId, order]));
  const tables = database.tables.map(table => {
    const order = ordersByTable.get(table.id);
    return {
      ...table,
      activeOrder: order ? { ...order, bill: calculateBill(order) } : null
    };
  });
  const floorCounts = new Map();
  let liveRevenue = 0;
  for (const order of activeOrders) {
    const table = database.tables.find(candidate => candidate.id === order.tableId);
    if (!table) continue;
    floorCounts.set(table.floor, (floorCounts.get(table.floor) || 0) + 1);
    liveRevenue += calculateBill(order).total;
  }
  const topFloor = [...floorCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    tables,
    analytics: {
      occupancy: tables.length ? Math.round((tables.filter(table => table.status === "occupied").length / tables.length) * 100) : 0,
      liveRevenue: centsToMoney(moneyToCents(liveRevenue)),
      pendingCleanups: tables.filter(table => table.status === "dirty").length,
      topFloor: topFloor ? topFloor[0] : "—",
      topFloorOrders: topFloor ? topFloor[1] : 0
    }
  };
}

function validateTable(database, values, currentId = null) {
  const tableNumber = String(values.tableNumber || "").trim();
  const capacity = Number(values.capacity);
  const floor = String(values.floor || "").trim();
  if (!tableNumber || tableNumber.length > 16 || !floor || floor.length > 40 || !Number.isInteger(capacity) || capacity <= 0) {
    throw new Error("Enter a table number, floor, and positive whole-number capacity.");
  }
  if (database.tables.some(table => table.id !== currentId && table.tableNumber.toLowerCase() === tableNumber.toLowerCase())) {
    throw new Error("That table number already exists.");
  }
  return { tableNumber, capacity, floor };
}

function dispatch(route, method, body) {
  if (route === "/auth/login" && method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const user = DEMO_USERS.find(account => account.email === email && account.password === String(body.password || ""));
    if (!user) throw new Error("Email or password is incorrect.");
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { user: session };
  }
  if (route === "/auth/me" && method === "GET") return { user: requireSession() };
  if (route === "/auth/logout" && method === "POST") {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  const user = requireSession();
  if (route === "/state" && method === "GET") return createState(readDatabase());
  if (route === "/export" && method === "GET") {
    requireAdmin(user);
    const database = readDatabase();
    return { tables: database.tables, orders: database.orders };
  }

  const database = readDatabase();
  let match = route.match(/^\/tables\/([^/]+)(?:\/(clean))?$/);
  if (route === "/tables" && method === "POST") {
    requireAdmin(user);
    const now = new Date().toISOString();
    const table = { id: id(), ...validateTable(database, body), status: "available", createdAt: now, updatedAt: now };
    database.tables.push(table);
    writeDatabase(database);
    return { table };
  }
  if (match && method === "PATCH" && !match[2]) {
    requireAdmin(user);
    const table = database.tables.find(candidate => candidate.id === match[1]);
    if (!table) throw new Error("Table not found.");
    Object.assign(table, validateTable(database, body, table.id), { updatedAt: new Date().toISOString() });
    writeDatabase(database);
    return { table };
  }
  if (match && method === "DELETE" && !match[2]) {
    requireAdmin(user);
    const table = database.tables.find(candidate => candidate.id === match[1]);
    if (!table) throw new Error("Table not found.");
    if (database.orders.some(order => order.tableId === table.id && order.status === "active")) {
      throw new Error("Tables with active orders cannot be deleted.");
    }
    database.tables = database.tables.filter(candidate => candidate.id !== table.id);
    writeDatabase(database);
    return { success: true };
  }
  if (match && method === "POST" && match[2] === "clean") {
    const table = database.tables.find(candidate => candidate.id === match[1]);
    if (!table) throw new Error("Table not found.");
    if (table.status !== "dirty") throw new Error("Only dirty tables can be marked available.");
    table.status = "available";
    table.updatedAt = new Date().toISOString();
    writeDatabase(database);
    return { table };
  }

  match = route.match(/^\/orders\/([^/]+)\/(items|transfer|settle)$/);
  if (route === "/orders" && method === "POST") {
    const table = database.tables.find(candidate => candidate.id === String(body.tableId || ""));
    if (!table) throw new Error("Table not found.");
    if (table.status !== "available") throw new Error("Only available tables can start a new order.");
    const now = new Date().toISOString();
    const order = { id: id(), tableId: table.id, status: "active", items: [], createdAt: now, updatedAt: now, settledAt: null, bill: null };
    database.orders.push(order);
    table.status = "occupied";
    table.updatedAt = now;
    writeDatabase(database);
    return { order };
  }
  if (match && method === "POST" && match[2] === "items") {
    const order = database.orders.find(candidate => candidate.id === match[1]);
    if (!order) throw new Error("Order not found.");
    if (order.status !== "active") throw new Error("This order is settled and read-only.");
    const name = String(body.name || "").trim();
    const category = String(body.category || "").toLowerCase();
    const price = Number(body.price);
    if (!name || name.length > 60 || !["food", "beverage"].includes(category) || !Number.isFinite(price) || price <= 0 || moneyToCents(price) <= 0) {
      throw new Error("Enter an item name, a valid category, and a price greater than zero.");
    }
    const item = { id: id(), name, category, price: centsToMoney(moneyToCents(price)), createdAt: new Date().toISOString() };
    order.items.push(item);
    order.updatedAt = item.createdAt;
    writeDatabase(database);
    return { item, bill: calculateBill(order) };
  }
  if (match && method === "POST" && match[2] === "transfer") {
    const order = database.orders.find(candidate => candidate.id === match[1]);
    if (!order) throw new Error("Order not found.");
    if (order.status !== "active") throw new Error("This order is settled and read-only.");
    const target = database.tables.find(candidate => candidate.id === String(body.targetTableId || ""));
    if (!target) throw new Error("Target table not found.");
    if (target.id === order.tableId) throw new Error("Choose a different target table.");
    if (target.status !== "available") throw new Error("Target Table Occupied");
    const source = database.tables.find(candidate => candidate.id === order.tableId);
    const now = new Date().toISOString();
    if (source) {
      source.status = "available";
      source.updatedAt = now;
    }
    target.status = "occupied";
    target.updatedAt = now;
    order.tableId = target.id;
    order.updatedAt = now;
    writeDatabase(database);
    return { order };
  }
  if (match && method === "POST" && match[2] === "settle") {
    const order = database.orders.find(candidate => candidate.id === match[1]);
    if (!order) throw new Error("Order not found.");
    if (order.status !== "active") throw new Error("This order is settled and read-only.");
    const table = database.tables.find(candidate => candidate.id === order.tableId);
    if (!table) throw new Error("The order's table could not be found.");
    const now = new Date().toISOString();
    order.bill = calculateBill(order);
    order.status = "settled";
    order.settledAt = now;
    order.updatedAt = now;
    table.status = "dirty";
    table.updatedAt = now;
    writeDatabase(database);
    return { order };
  }
  throw new Error("Demo API route not found.");
}

export async function api(route, options = {}) {
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};
  return dispatch(route, method, body);
}

export function resetDemoData() {
  localStorage.removeItem(DATABASE_KEY);
  localStorage.removeItem(SESSION_KEY);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}
