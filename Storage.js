/* =========================================================
   BusGo Demo — shared localStorage data layer
   NOTE: This is a FAKE demo. No real payment happens here.
   All data lives in the browser's localStorage.
   ========================================================= */

const DB = {
  KEYS: {
    USERS: 'busgo_users',
    BUSES: 'busgo_buses',
    BOOKINGS: 'busgo_bookings',
    REQUESTS: 'busgo_requests',
    SESSION: 'busgo_session',
    ADMIN_SESSION: 'busgo_admin_session',
    DRIVERS: 'busgo_drivers',
    DRIVER_SESSION: 'busgo_driver_session'
  },

  // ---------- low level ----------
  _get(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  },
  _set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // ---------- seed ----------
  seed() {
    if (!localStorage.getItem(this.KEYS.USERS)) {
      this._set(this.KEYS.USERS, []);
    }
    if (!localStorage.getItem(this.KEYS.BOOKINGS)) {
      this._set(this.KEYS.BOOKINGS, []);
    }
    if (!localStorage.getItem(this.KEYS.REQUESTS)) {
      this._set(this.KEYS.REQUESTS, []);
    }
    if (!localStorage.getItem(this.KEYS.BUSES)) {
      const today = new Date();
      const fmt = (d) => d.toISOString().split('T')[0];
      const day1 = new Date(today); day1.setDate(today.getDate() + 2);
      const day2 = new Date(today); day2.setDate(today.getDate() + 3);
      const day3 = new Date(today); day3.setDate(today.getDate() + 5);
      this._set(this.KEYS.BUSES, [
        { id: 'bus_1', day: fmt(day1), plate: 'AUL 204 XY', capacity: 14, price: 3500, from: 'Lagos', to: 'Ibadan', type: 'passengers', goodsPrice: 0 },
        { id: 'bus_2', day: fmt(day2), plate: 'AUL 118 KJ', capacity: 14, price: 3500, from: 'Lagos', to: 'Ibadan', type: 'both', goodsPrice: 1500 },
        { id: 'bus_3', day: fmt(day3), plate: 'AUL 077 QP', capacity: 18, price: 4000, from: 'Ibadan', to: 'Lagos', type: 'goods', goodsPrice: 2000 }
      ]);
    }
  },

  // ---------- users ----------
  getUsers() { return this._get(this.KEYS.USERS, []); },
  saveUsers(list) { this._set(this.KEYS.USERS, list); },

  findUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  createUser({ name, email, phone, password }) {
    const users = this.getUsers();
    const user = {
      id: 'u_' + Date.now(),
      name, email, phone, password, // demo only — never store plain passwords in a real app
      createdAt: new Date().toISOString()
    };
    users.push(user);
    this.saveUsers(users);
    return user;
  },

  removeUser(userId) {
    this.saveUsers(this.getUsers().filter(u => u.id !== userId));
    // also drop their bookings
    this._set(this.KEYS.BOOKINGS, this.getBookings().filter(b => b.userId !== userId));
  },

  // ---------- session ----------
  login(user) { this._set(this.KEYS.SESSION, user.id); },
  logout() { localStorage.removeItem(this.KEYS.SESSION); },
  currentUser() {
    const id = this._get(this.KEYS.SESSION, null);
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },

  adminLogin() { this._set(this.KEYS.ADMIN_SESSION, true); },
  adminLogout() { localStorage.removeItem(this.KEYS.ADMIN_SESSION); },
  isAdmin() { return !!this._get(this.KEYS.ADMIN_SESSION, false); },

  // ---------- buses ----------
  getBuses() { return this._get(this.KEYS.BUSES, []); },
  saveBuses(list) { this._set(this.KEYS.BUSES, list); },

  createBus({ day, plate, capacity, price, from, to, type, goodsPrice, description }) {
    const buses = this.getBuses();
    buses.push({
      id: 'bus_' + Date.now(),
      day, plate,
      capacity: Number(capacity),
      price: Number(price),
      from: (from || '').trim(),
      to: (to || '').trim(),
      type: type || 'passengers', // 'passengers' | 'goods' | 'both'
      goodsPrice: Number(goodsPrice) || 0,
      description: (description || '').trim()
    });
    this.saveBuses(buses);
  },

  deleteBus(busId) {
    this.saveBuses(this.getBuses().filter(b => b.id !== busId));
    this._set(this.KEYS.BOOKINGS, this.getBookings().filter(b => b.busId !== busId));
  },

  busesByDay(day) { return this.getBuses().filter(b => b.day === day); },

  allDays() {
    const days = [...new Set(this.getBuses().map(b => b.day))];
    return days.sort();
  },

  searchBuses(from, to, day) {
    return this.getBuses().filter(b => {
      const matchFrom = !from || b.from.toLowerCase() === from.toLowerCase();
      const matchTo   = !to   || b.to.toLowerCase()   === to.toLowerCase();
      const matchDay  = !day  || b.day === day;
      return matchFrom && matchTo && matchDay;
    });
  },

  searchTrips({ from = '', to = '', day = '', mode = 'passengers' } = {}) {
    const targetMode = mode || 'passengers';
    return this.getBuses().filter(b => {
      const matchFrom = !from || b.from.toLowerCase() === from.toLowerCase();
      const matchTo = !to || b.to.toLowerCase() === to.toLowerCase();
      const matchDay = !day || b.day === day;
      const matchesMode = targetMode === 'passengers'
        ? (b.type === 'passengers' || b.type === 'both')
        : targetMode === 'goods'
          ? (b.type === 'goods' || b.type === 'both')
          : true;
      return matchFrom && matchTo && matchDay && matchesMode;
    }).sort((a, b) => a.day.localeCompare(b.day));
  },

  suggestedTrips(from, to, mode = 'passengers') {
    const today = this.todayStr();
    return this.getBuses().filter(b => {
      const matchFrom = !from || b.from.toLowerCase() === from.toLowerCase();
      const matchTo = !to || b.to.toLowerCase() === to.toLowerCase();
      const matchDay = b.day >= today;
      const matchesMode = mode === 'passengers'
        ? (b.type === 'passengers' || b.type === 'both')
        : mode === 'goods'
          ? (b.type === 'goods' || b.type === 'both')
          : true;
      return matchFrom && matchTo && matchDay && matchesMode;
    }).sort((a, b) => a.day.localeCompare(b.day));
  },

  // All unique route locations across all buses
  allLocations() {
    const locs = new Set();
    this.getBuses().forEach(b => { if(b.from) locs.add(b.from); if(b.to) locs.add(b.to); });
    return [...locs].sort();
  },

  // Suggested days: buses matching from+to but on any date >= today
  suggestedDays(from, to) {
    const today = this.todayStr();
    return this.getBuses().filter(b => {
      const matchFrom = !from || b.from.toLowerCase() === from.toLowerCase();
      const matchTo   = !to   || b.to.toLowerCase()   === to.toLowerCase();
      return matchFrom && matchTo && b.day >= today;
    }).sort((a,b) => a.day.localeCompare(b.day));
  },

  // ---------- bookings ----------
  getBookings() { return this._get(this.KEYS.BOOKINGS, []); },
  saveBookings(list) { this._set(this.KEYS.BOOKINGS, list); },

  bookingsForBus(busId) { return this.getBookings().filter(b => b.busId === busId); },
  bookingsForUser(userId) { return this.getBookings().filter(b => b.userId === userId); },

  takenSeats(busId) {
    return this.bookingsForBus(busId).map(b => b.seat);
  },

  seatsLeft(bus) {
    return bus.capacity - this.takenSeats(bus.id).length;
  },

  createBooking({ userId, userName, busId, seat, amount, kind = 'passengers', note = '' }) {
    const bookings = this.getBookings();
    const booking = {
      id: 'bk_' + Date.now(),
      userId, userName, busId, seat, amount,
      paid: true, // "fake" payment auto-confirms in this demo
      kind,
      note,
      createdAt: new Date().toISOString()
    };
    bookings.push(booking);
    this.saveBookings(bookings);
    return booking;
  },

  setPaid(bookingId, paid) {
    const bookings = this.getBookings();
    const b = bookings.find(x => x.id === bookingId);
    if (b) { b.paid = paid; this.saveBookings(bookings); }
  },

  removeBooking(bookingId) {
    this.saveBookings(this.getBookings().filter(b => b.id !== bookingId));
  },

  createMultipleBookings({ userId, userName, busId, seats, amountPerSeat, kind = 'passengers', note = '' }) {
    const bookings = [];
    const existing = this.getBookings();
    seats.forEach(seat => {
      const booking = {
        id: 'bk_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
        userId, userName, busId, seat, amount: amountPerSeat,
        paid: true,
        kind,
        note,
        createdAt: new Date().toISOString()
      };
      existing.push(booking);
      bookings.push(booking);
    });
    this.saveBookings(existing);
    return bookings;
  },

  // ---------- day requests ----------
  getRequests() { return this._get(this.KEYS.REQUESTS, []); },
  saveRequests(list) { this._set(this.KEYS.REQUESTS, list); },

  createRequest({ userId, userName, userPhone, day, note }) {
    const requests = this.getRequests();
    const request = {
      id: 'rq_' + Date.now(),
      userId, userName, userPhone, day, note: note || '',
      status: 'pending', // pending | fulfilled | dismissed
      createdAt: new Date().toISOString()
    };
    requests.push(request);
    this.saveRequests(requests);
    return request;
  },

  setRequestStatus(requestId, status) {
    const requests = this.getRequests();
    const r = requests.find(x => x.id === requestId);
    if (r) { r.status = status; this.saveRequests(requests); }
  },

  removeRequest(requestId) {
    this.saveRequests(this.getRequests().filter(r => r.id !== requestId));
  },

  requestsForUser(userId) { return this.getRequests().filter(r => r.userId === userId); },

  // ---------- drivers ----------
  getDrivers() { return this._get(this.KEYS.DRIVERS, []); },
  saveDrivers(list) { this._set(this.KEYS.DRIVERS, list); },

  createDriver({ name, plate, password }) {
    const drivers = this.getDrivers();
    const driver = {
      id: 'd_' + Date.now(),
      name, plate: plate.toUpperCase(), password,
      createdAt: new Date().toISOString()
    };
    drivers.push(driver);
    this.saveDrivers(drivers);
    return driver;
  },

  removeDriver(driverId) {
    this.saveDrivers(this.getDrivers().filter(d => d.id !== driverId));
  },

  findDriverByCredentials(plate, password) {
    return this.getDrivers().find(d => d.plate === plate.toUpperCase() && d.password === password);
  },

  findDriverByPlate(plate) {
    return this.getDrivers().find(d => d.plate === plate.toUpperCase());
  },

  driverLogin(driver) { this._set(this.KEYS.DRIVER_SESSION, driver.id); },
  driverLogout() { localStorage.removeItem(this.KEYS.DRIVER_SESSION); },
  currentDriver() {
    const id = this._get(this.KEYS.DRIVER_SESSION, null);
    if (!id) return null;
    return this.getDrivers().find(d => d.id === id) || null;
  },
  isDriverLoggedIn() { return !!this._get(this.KEYS.DRIVER_SESSION, false); },

  // ---------- helpers ----------
  todayStr() { return new Date().toISOString().split('T')[0]; },
  fmtMoney(n) { return '₦' + Number(n).toLocaleString(); },
  fmtDay(dayStr) {
    const d = new Date(dayStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
};

DB.seed();