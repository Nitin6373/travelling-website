// Musafir Travels - script.js
// Shared by every page. The "if (... != null)" checks run a part only on the page that has it.

// ---------- 1. Data (kept in localStorage) ----------
var users = [{ id: 1, name: "Admin", email: "admin@wayfarer.com", pw: "admin123", role: "admin" }];
var bookings = [];
var reviews = [];
var messages = [];
var extraPackages = [];
var removed = [];
var currentUser = null;
var flights = [];

var basePackages = [
  { id: "1", name: "Goa Beach Escape", place: "Goa", price: 18500 },
  { id: "2", name: "Kerala Backwaters", place: "Kochi", price: 24900 },
  { id: "3", name: "Royal Rajasthan", place: "Jaipur", price: 27500 },
  { id: "4", name: "Manali Snow Retreat", place: "Manali", price: 31000 },
  { id: "5", name: "Bali Island Break", place: "Bali", price: 62000 },
  { id: "6", name: "Dubai Luxe Weekend", place: "Dubai", price: 54000 }
];

var planList = {
  "Goa Beach Escape": ["Arrive, check in, sunset at Baga", "North Goa forts and Anjuna market", "Dolphin cruise and water sports", "Old Goa churches, departure"],
  "Kerala Backwaters": ["Kochi heritage walk", "Drive to Munnar, tea gardens", "Eravikulam park, spice trail", "Alleppey houseboat check-in", "Backwater sunrise, departure"],
  "Royal Rajasthan": ["Arrive in Jaipur, Hawa Mahal", "Amber Fort and City Palace", "Day trip to Pushkar", "Jaipur bazaars and block printing", "Departure"],
  "Manali Snow Retreat": ["Overnight bus from Delhi", "Old Manali and Hadimba temple", "Solang valley snow day", "Rohtang pass drive", "Beas river rafting", "Return to Delhi"],
  "Bali Island Break": ["Fly to Denpasar, Seminyak", "Surf lesson at Kuta", "Ubud rice terraces", "Tanah Lot temple sunset", "Nusa Penida day trip", "Departure"],
  "Dubai Luxe Weekend": ["Arrive, Dubai Marina walk", "Burj Khalifa and Dubai Mall", "Desert safari with BBQ dinner", "Old Dubai souks, departure"]
};

function saveData() {
  var data = {
    users: users, bookings: bookings, reviews: reviews, messages: messages,
    extraPackages: extraPackages, removed: removed, currentUser: currentUser
  };
  localStorage.setItem("wayfarer", JSON.stringify(data));
}

function loadData() {
  var text = localStorage.getItem("wayfarer");
  if (text) {
    var data = JSON.parse(text);
    users = data.users; bookings = data.bookings; reviews = data.reviews;
    messages = data.messages; extraPackages = data.extraPackages || [];
    removed = data.removed || []; currentUser = data.currentUser;
  }
}

// ---------- 2. Helper functions ----------
function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function showMessage(text) {
  var box = document.getElementById("toast");
  box.textContent = text;
  box.className = "on";
  setTimeout(function () { box.className = ""; }, 2500);
}

function getUser() {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id == currentUser) { return users[i]; }
  }
  return null;
}

function checkLogin() {
  if (getUser() == null) {
    showMessage("Please log in to book.");
    setTimeout(function () { window.location.href = "login.html"; }, 900);
    return false;
  }
  return true;
}

function starText(n) {
  var s = "";
  for (var i = 1; i <= 5; i++) { s = s + (i <= n ? "★" : "☆"); }
  return s;
}

function addBooking(type, title, date, detail, total) {
  if (date == "" || date == null) { date = "Date to be confirmed"; }
  bookings.push({
    id: Date.now(), userId: getUser().id, type: type, title: title,
    date: date, detail: detail, total: total, status: "Pending"
  });
  saveData();
  window.location.href = "itinerary.html";
}

// ---------- 3. Menu ----------
function showMenu() {
  var links = document.getElementsByTagName("nav")[0].getElementsByTagName("a");
  var page = window.location.pathname.split("/").pop();
  if (page == "") { page = "index.html"; }
  for (var i = 0; i < links.length; i++) {
    if (links[i].getAttribute("href") == page) { links[i].className = "on"; }
  }
  var user = getUser();
  var isAdmin = (user != null && user.role == "admin");
  document.getElementById("authLink").textContent = (user == null) ? "Log in" : "👤 " + user.name.split(" ")[0];
  document.getElementById("adminLink").hidden = !isAdmin;
}

// ---------- 4. Packages: search, filter, sort ----------
function showExtraPackages() {
  var grid = document.getElementById("pkgGrid");
  if (grid == null) { return; }
  for (var i = 0; i < extraPackages.length; i++) {
    var p = extraPackages[i];
    grid.innerHTML = grid.innerHTML +
      '<div class="card" data-id="' + p.id + '" data-name="' + p.name + '" data-type="' + p.type + '" data-price="' + p.price + '" data-rating="4">' +
      '<div class="ph g' + (i % 6) + '">🌍</div><div class="bd">' +
      '<span class="meta">' + p.place + ' · ' + p.type + ' · ' + p.days + ' days</span><h3>' + p.name + '</h3>' +
      '<div class="star">★★★★☆ <span class="mut">4</span></div><p class="mut">New package from Musafir.</p>' +
      '<div class="cardfoot"><span class="price">' + money(p.price) + '</span>' +
      '<button class="btn sm" onclick="bookExtra(\'' + p.id + '\')">Book now</button></div></div></div>';
  }
}

function filterPackages() {
  var grid = document.getElementById("pkgGrid");
  if (grid == null) { return; }
  var word = document.getElementById("fq").value.toLowerCase();
  var type = document.getElementById("ft").value;
  var maxPrice = Number(document.getElementById("fm").value);
  var sortBy = document.getElementById("fs").value;
  document.getElementById("maxOut").textContent = money(maxPrice);

  var cards = [];
  var all = grid.getElementsByClassName("card");
  for (var i = 0; i < all.length; i++) { cards.push(all[i]); }

  cards.sort(function (a, b) {
    if (sortBy == "low") { return a.getAttribute("data-price") - b.getAttribute("data-price"); }
    if (sortBy == "high") { return b.getAttribute("data-price") - a.getAttribute("data-price"); }
    return b.getAttribute("data-rating") - a.getAttribute("data-rating");
  });

  var count = 0;
  for (var j = 0; j < cards.length; j++) {
    var c = cards[j];
    var text = (c.getAttribute("data-name") + " " + c.textContent).toLowerCase();
    var show = true;
    if (text.indexOf(word) == -1) { show = false; }
    if (type != "" && c.getAttribute("data-type") != type) { show = false; }
    if (Number(c.getAttribute("data-price")) > maxPrice) { show = false; }
    if (removed.indexOf(c.getAttribute("data-id")) != -1) { show = false; }
    c.hidden = !show;
    if (show) { count++; }
    grid.appendChild(c);
  }
  document.getElementById("noPkg").hidden = count > 0;
}

if (document.getElementById("filter") != null) {
  document.getElementById("filter").oninput = filterPackages;
  document.getElementById("filter").onsubmit = function (e) { e.preventDefault(); };
}

if (document.getElementById("heroSearch") != null) {
  document.getElementById("heroSearch").onsubmit = function (e) {
    e.preventDefault();
    localStorage.setItem("searchWord", document.getElementById("heroQ").value);
    localStorage.setItem("searchType", document.getElementById("heroType").value);
    window.location.href = "destinations.html";
  };
}

function hideRemovedOnHome() {
  var grid = document.getElementById("homeGrid");
  if (grid == null) { return; }
  var cards = grid.getElementsByClassName("card");
  for (var i = 0; i < cards.length; i++) {
    cards[i].hidden = (removed.indexOf(cards[i].getAttribute("data-id")) != -1);
  }
}

// ---------- 5. Package details page ----------
function bookPackage(id) {
  if (!checkLogin()) { return; }
  var box = document.getElementById("p" + id);
  var people = Number(document.getElementById("people" + id).value);
  if (people < 1) { showMessage("Enter at least 1 traveller."); return; }
  var price = Number(box.getAttribute("data-price"));
  addBooking("Package", box.getAttribute("data-name"), document.getElementById("date" + id).value,
    people + " traveller(s)", price * people);
}

function bookExtra(id) {
  if (!checkLogin()) { return; }
  for (var i = 0; i < extraPackages.length; i++) {
    if (extraPackages[i].id == id) {
      addBooking("Package", extraPackages[i].name, "", "1 traveller(s)", extraPackages[i].price);
    }
  }
}

if (document.getElementsByClassName("pkg").length > 0 && window.location.hash == "") {
  window.location.hash = "#p1";
}

// ---------- 6. Hotels ----------
if (document.getElementById("hotelOpts") != null) {
  document.getElementById("hotelOpts").onsubmit = function (e) { e.preventDefault(); };
  document.getElementById("hc").onchange = function () {
    var cards = document.getElementById("hotelGrid").getElementsByClassName("card");
    for (var i = 0; i < cards.length; i++) {
      cards[i].hidden = (this.value != "" && cards[i].getAttribute("data-city") != this.value);
    }
  };
}

function bookHotel(name, city, price) {
  if (!checkLogin()) { return; }
  var nights = Number(document.getElementById("hn").value);
  var rooms = Number(document.getElementById("hr").value);
  addBooking("Hotel", name + ", " + city, document.getElementById("hi").value,
    nights + " night(s), " + rooms + " room(s)", price * nights * rooms);
}

// ---------- 7. Flights ----------
if (document.getElementById("flightForm") != null) {
  document.getElementById("flightForm").onsubmit = function (e) {
    e.preventDefault();
    var from = document.getElementById("ff").value;
    var to = document.getElementById("fto").value;
    var date = document.getElementById("fd").value;
    var box = document.getElementById("flightResults");
    if (from == to) { box.innerHTML = '<p class="mut">Choose two different cities.</p>'; return; }
    if (date == "") { showMessage("Pick a travel date."); return; }

    var names = ["IndiGo", "Air India", "Akasa Air", "Vistara"];
    var departs = ["06:15", "09:40", "14:20", "19:05"];
    var arrives = ["08:05", "11:50", "16:15", "21:10"];
    var base = (from.length + to.length) * 300 + 2500;
    flights = [];
    var html = "";
    for (var k = 0; k < 4; k++) {
      var fare = base + k * 420;
      flights.push({ name: names[k], dep: departs[k], arr: arrives[k], fare: fare, from: from, to: to, date: date });
      html = html + '<div class="panel row flightRow"><div><b>' + names[k] + '</b><br><span class="mut">' + from + ' → ' + to +
        '</span></div><div>' + departs[k] + ' → ' + arrives[k] + '<br><span class="mut">Non-stop</span></div>' +
        '<div class="price">' + money(fare) + '</div><div><button class="btn sm" onclick="bookFlight(' + k + ')">Book flight</button></div></div>';
    }
    box.innerHTML = html;
  };
}

function bookFlight(index) {
  if (!checkLogin()) { return; }
  var f = flights[index];
  addBooking("Flight", f.name + " " + f.from + " → " + f.to, f.date, f.dep + " → " + f.arr, f.fare);
}

// ---------- 8. My trips ----------
function showTrips() {
  var box = document.getElementById("tripList");
  if (box == null) { return; }
  var user = getUser();
  if (user == null) {
    box.innerHTML = '<p>Log in to see your bookings and itinerary.</p><a class="btn" href="login.html">Log in</a>';
    return;
  }
  var html = "";
  for (var i = 0; i < bookings.length; i++) {
    var b = bookings[i];
    if (b.userId != user.id) { continue; }
    html = html + '<div class="panel"><div class="tripTop"><div><span class="tag">' + b.type + '</span><h3>' + b.title +
      '</h3><span class="mut">' + b.date + ' · ' + b.detail + '</span></div><div><div class="price">' + money(b.total) +
      '</div><span class="tag">' + b.status + '</span><br>';
    if (b.status != "Cancelled") { html = html + '<button class="btn del sm" onclick="setStatus(' + b.id + ', \'Cancelled\')">Cancel</button>'; }
    html = html + '</div></div>';
    if (b.type == "Package" && planList[b.title] != undefined) {
      html = html + '<div class="tl">';
      for (var d = 0; d < planList[b.title].length; d++) {
        html = html + '<div><b>Day ' + (d + 1) + '</b> · ' + planList[b.title][d] + '</div>';
      }
      html = html + '</div>';
    }
    html = html + '</div>';
  }
  if (html == "") {
    html = '<p class="mut">No bookings yet. Start with a package.</p><a class="btn" href="destinations.html">Browse packages</a>';
  }
  box.innerHTML = html;
}

function setStatus(id, status) {
  for (var i = 0; i < bookings.length; i++) {
    if (bookings[i].id == id) { bookings[i].status = status; }
  }
  saveData();
  showMessage("Booking " + status.toLowerCase() + ".");
  showAll();
}

// ---------- 9. Gallery ----------
function filterGallery(type, button) {
  var buttons = document.getElementById("galTabs").getElementsByTagName("button");
  for (var i = 0; i < buttons.length; i++) { buttons[i].className = "btn alt sm"; }
  button.className = "btn sm";
  var photos = document.getElementById("galGrid").getElementsByTagName("div");
  for (var j = 0; j < photos.length; j++) {
    photos[j].hidden = (type != "All" && photos[j].getAttribute("data-t") != type);
  }
}

function openPhoto(tile) {
  var box = document.getElementById("lb");
  box.innerHTML = '<div><div class="im ' + tile.className + '">' + tile.textContent + '</div>' +
    tile.getAttribute("data-place") + ' · ' + tile.getAttribute("data-t") + '<br><small>Click anywhere to close</small></div>';
  box.className = "on";
}

function closePhoto() {
  document.getElementById("lb").className = "";
}

// ---------- 10. Reviews and contact ----------
// Starter reviews written in a traveller's own voice. Reviews people post are added to these.
var seedReviews = [
  {
    user: "Riya Patel", city: "Surat", pkg: "Kerala Backwaters", stars: 5, date: "2026-09-12", who: "as a couple", helpful: 21,
    title: "The houseboat night was the highlight of our year",
    text: "We almost skipped Munnar to save time and I'm so glad we didn't. Tea gardens at 7am with a flask of chai were unreal. Our driver Suresh even stopped at a roadside shop for the best banana chips. Carry a light jacket, Munnar gets properly cold.",
    reply: "So glad you loved it, Riya! We've passed your note about Suresh on to him. He'll be thrilled."
  },
  {
    user: "Karan Shah", city: "Ahmedabad", pkg: "Goa Beach Escape", stars: 4, date: "2026-10-02", who: "with friends", helpful: 9,
    title: "Great beaches, one slow day",
    text: "Beaches were great and the airport transfers were bang on time. Only grumble: the dolphin cruise started late because of the tide, so we lost an hour. Still worth it. Hit Anjuna market early, it gets packed by noon."
  },
  {
    user: "Neha Joshi", city: "Vadodara", pkg: "Royal Rajasthan", stars: 5, date: "2026-10-18", who: "with family", helpful: 12,
    title: "Even my 7-year-old stayed interested in the forts",
    text: "Travelled with my parents and two kids. The guide at Amber Fort kept the kids hooked with stories, and the block-printing session was a surprise favourite. My mother bought half the shop. The haveli is lovely but there's a bit of walking to the rooms.",
    reply: "Thank you, Neha! Block printing is the one everyone remembers."
  },
  {
    user: "Farhan Qureshi", city: "Mumbai", pkg: "Manali Snow Retreat", stars: 4, date: "2026-03-08", who: "with friends", helpful: 7,
    title: "Snow, but pack more layers than you think",
    text: "Solang had proper snow. Rohtang was shut for a day, so the team swapped in Naggar Castle without fuss. The overnight bus is tiring, so keep Day 2 slow. Rafting on the Beas was the best part by far."
  },
  {
    user: "Ishita Mehta", city: "Surat", pkg: "Bali Island Break", stars: 5, date: "2026-08-22", who: "as a couple", helpful: 18,
    title: "Booked it for our honeymoon and it felt personal",
    text: "Didn't feel like a cookie-cutter package. Private pool at the villa, Nusa Penida was exhausting but unforgettable, and the visa help saved us a lot of stress. Ask your driver to take you to a local warung for dinner, it was our best meal."
  },
  {
    user: "Rahul Desai", city: "Pune", pkg: "Dubai Luxe Weekend", stars: 4, date: "2026-10-10", who: "solo", helpful: 5,
    title: "Packed schedule, but worth it",
    text: "Four days is tight. Burj Khalifa at sunset was worth booking, and the desert safari BBQ was fun even though I'm not a dune-bashing person. The metro pass was genuinely useful. I'd love one free afternoon next time.",
    reply: "Fair point, Rahul. We're adding a free-afternoon option to the Dubai trip."
  }
];

function reviewEsc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function reviewDate(iso) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var p = String(iso).split("-");
  if (p.length < 3) { return reviewEsc(iso); }
  return Number(p[2]) + " " + months[Number(p[1]) - 1] + " " + p[0];
}

function helpedList() {
  try { return JSON.parse(localStorage.getItem("helpedReviews") || "[]"); } catch (e) { return []; }
}

function toggleHelpful(btn, id, base) {
  var list = helpedList();
  var at = list.indexOf(id);
  if (at >= 0) { list.splice(at, 1); } else { list.push(id); }
  try { localStorage.setItem("helpedReviews", JSON.stringify(list)); } catch (e) { }
  var on = at < 0;
  btn.className = "helpful" + (on ? " on" : "");
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.textContent = "👍 Helpful · " + (base + (on ? 1 : 0));
}

function allReviews() {
  var list = [];
  for (var i = 0; i < reviews.length; i++) {
    var r = reviews[i];
    list.push({ id: "u" + i, user: r.user, pkg: r.pkg, stars: r.stars, date: r.date, who: r.who || "", title: r.title || "", text: r.text, helpful: r.helpful || 0 });
  }
  for (var j = 0; j < seedReviews.length; j++) { seedReviews[j].id = "s" + j; list.push(seedReviews[j]); }
  list.sort(function (a, b) { return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0); });
  return list;
}

function reviewHtml(r) {
  var name = String(r.user || "Traveller");
  var hue = 0;
  for (var i = 0; i < name.length; i++) { hue = hue + name.charCodeAt(i); }
  var on = helpedList().indexOf(r.id) >= 0;
  var base = r.helpful || 0;
  var sub = reviewEsc(r.pkg) + " · " + reviewDate(r.date) + (r.who ? " · Travelled " + reviewEsc(r.who) : "");
  return '<div class="panel rv"><div class="av av' + (hue % 6) + '">' + reviewEsc(name.charAt(0).toUpperCase()) + '</div><div class="rvBody">' +
    '<div class="rvHead"><b>' + reviewEsc(name) + '</b>' + (r.city ? '<span class="mut">from ' + reviewEsc(r.city) + '</span>' : '') + '</div>' +
    '<div class="rvSub"><span class="star">' + starText(r.stars) + '</span><span class="mut">' + sub + '</span></div>' +
    (r.title ? '<h4>' + reviewEsc(r.title) + '</h4>' : '') + '<p>' + reviewEsc(r.text) + '</p>' +
    '<div class="rvFoot"><button type="button" class="helpful' + (on ? ' on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" onclick="toggleHelpful(this,\'' + r.id + '\',' + base + ')">👍 Helpful · ' + (base + (on ? 1 : 0)) + '</button></div>' +
    (r.reply ? '<div class="rvReply"><b>Meera from the Musafir team</b><p>' + reviewEsc(r.reply) + '</p></div>' : '') +
    '</div></div>';
}

function showReviews() {
  var list = allReviews();
  var box = document.getElementById("userReviews");
  if (box != null) {
    var f = document.getElementById("rvFilter");
    var pick = f ? f.value : "";
    var html = "";
    var count = 0;
    var sum = 0;
    for (var i = 0; i < list.length; i++) {
      if (pick == "" || list[i].pkg == pick) { html = html + reviewHtml(list[i]); count++; sum = sum + list[i].stars; }
    }
    var sm = document.getElementById("rvSummary");
    if (sm != null) {
      sm.innerHTML = count > 0 ? '<b>' + (sum / count).toFixed(1) + '</b> <span class="star">★</span> <span class="mut">from ' + count + ' traveller' + (count == 1 ? '' : 's') + '</span>' : '';
    }
    box.innerHTML = html || '<p class="mut">No reviews for this trip yet. Been there? Tell the next traveller how it went.</p>';
  }

  var boxes = document.getElementsByClassName("userRv");
  for (var j = 0; j < boxes.length; j++) {
    var mine = "";
    for (var k = 0; k < list.length; k++) {
      if (list[k].pkg == boxes[j].getAttribute("data-pkg")) { mine = mine + reviewHtml(list[k]); }
    }
    var old = boxes[j].getElementsByClassName("added");
    if (old.length > 0) { old[0].parentNode.removeChild(old[0]); }
    boxes[j].insertAdjacentHTML("afterbegin", '<div class="added">' + (mine || '<p class="mut">No reviews yet. Been on this trip? Be the first to tell people how it went.</p>') + '</div>');
  }
}

if (document.getElementById("rvFilter") != null) { document.getElementById("rvFilter").onchange = showReviews; }

if (document.getElementById("reviewForm") != null) {
  document.getElementById("reviewForm").onsubmit = function (e) {
    e.preventDefault();
    if (!checkLogin()) { return; }
    var text = document.getElementById("rt").value.trim();
    if (text == "") { showMessage("Add a few words about your trip first."); return; }
    reviews.push({
      user: getUser().name, pkg: document.getElementById("rp").value,
      stars: Number(document.getElementById("rs").value), text: text,
      title: document.getElementById("rh").value.trim(), who: document.getElementById("rw").value,
      helpful: 0, date: new Date().toISOString().slice(0, 10)
    });
    saveData();
    document.getElementById("rt").value = "";
    document.getElementById("rh").value = "";
    showReviews();
    showMessage("Thanks, " + getUser().name.split(" ")[0] + "! Your review is live.");
  };
}

if (document.getElementById("contactForm") != null) {
  document.getElementById("contactForm").onsubmit = function (e) {
    e.preventDefault();
    messages.push({ name: document.getElementById("cn").value, email: document.getElementById("ce").value, msg: document.getElementById("cm").value });
    saveData();
    this.reset();
    showMessage("Thanks for writing! A real person will reply within a day.");
  };
}

// ---------- 11. Register, login, logout ----------
if (document.getElementById("regForm") != null) {
  document.getElementById("regForm").onsubmit = function (e) {
    e.preventDefault();
    var email = document.getElementById("re").value.toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email == email) { showMessage("That email already has an account. Log in instead."); return; }
    }
    var user = { id: Date.now(), name: document.getElementById("rn").value, email: email, pw: document.getElementById("rpw").value, role: "user" };
    users.push(user);
    currentUser = user.id;
    saveData();
    this.reset();
    showAll();
    showMessage("Account created.");
  };

  document.getElementById("loginForm").onsubmit = function (e) {
    e.preventDefault();
    var email = document.getElementById("le").value.toLowerCase();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email == email && users[i].pw == document.getElementById("lp").value) {
        currentUser = users[i].id;
        saveData();
        if (users[i].role == "admin") { window.location.href = "admin.html"; }
        else { window.location.href = "index.html"; }
        return;
      }
    }
    showMessage("Email or password is wrong.");
  };
}

function logout() {
  currentUser = null;
  saveData();
  window.location.href = "index.html";
}

function showAccount() {
  if (document.getElementById("whoBox") == null) { return; }
  var user = getUser();
  document.getElementById("authForms").hidden = (user != null);
  document.getElementById("whoBox").hidden = (user == null);
  if (user != null) {
    document.getElementById("whoHi").textContent = "Hi, " + user.name;
    document.getElementById("whoInfo").textContent = user.email + " · " + user.role;
  }
}

// ---------- 12. Admin panel ----------
function showTab(name, button) {
  var names = ["Users", "Bookings", "Packages", "Messages"];
  for (var i = 0; i < names.length; i++) { document.getElementById("tab" + names[i]).hidden = (names[i] != name); }
  var buttons = button.parentNode.getElementsByTagName("button");
  for (var j = 0; j < buttons.length; j++) { buttons[j].className = "btn alt sm"; }
  button.className = "btn sm";
}

function userName(id) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].id == id) { return users[i].name; }
  }
  return "Removed";
}

function removeUser(id) {
  var keepUsers = [];
  var keepBookings = [];
  for (var i = 0; i < users.length; i++) { if (users[i].id != id) { keepUsers.push(users[i]); } }
  for (var j = 0; j < bookings.length; j++) { if (bookings[j].userId != id) { keepBookings.push(bookings[j]); } }
  users = keepUsers;
  bookings = keepBookings;
  saveData();
  showAll();
}

function togglePackage(id) {
  var position = removed.indexOf(id);
  if (position == -1) { removed.push(id); } else { removed.splice(position, 1); }
  saveData();
  showAll();
}

if (document.getElementById("pkgForm") != null) {
  document.getElementById("pkgForm").onsubmit = function (e) {
    e.preventDefault();
    extraPackages.push({
      id: "x" + Date.now(), name: document.getElementById("an").value, place: document.getElementById("ap").value,
      type: document.getElementById("at").value, days: document.getElementById("ad").value, price: Number(document.getElementById("ar").value)
    });
    saveData();
    this.reset();
    showAll();
    showMessage("Package added.");
  };
}

function showAdmin() {
  var box = document.getElementById("adminBox");
  if (box == null) { return; }
  var user = getUser();
  var isAdmin = (user != null && user.role == "admin");
  box.hidden = !isAdmin;
  document.getElementById("noAdmin").hidden = isAdmin;
  if (!isAdmin) { return; }

  var rows = "";
  for (var i = 0; i < users.length; i++) {
    rows = rows + "<tr><td>" + users[i].name + "</td><td>" + users[i].email + "</td><td>" + users[i].role + "</td><td>";
    if (users[i].role != "admin") { rows = rows + '<button class="btn del sm" onclick="removeUser(' + users[i].id + ')">Remove</button>'; }
    rows = rows + "</td></tr>";
  }
  document.getElementById("userRows").innerHTML = rows;

  var revenue = 0;
  rows = "";
  for (var j = 0; j < bookings.length; j++) {
    var b = bookings[j];
    if (b.status != "Cancelled") { revenue = revenue + b.total; }
    rows = rows + "<tr><td>" + b.id + "</td><td>" + userName(b.userId) + "</td><td>" + b.type + ": " + b.title + "</td><td>" + money(b.total) +
      "</td><td>" + b.status + '</td><td><button class="btn sm" onclick="setStatus(' + b.id + ', \'Confirmed\')">Confirm</button> ' +
      '<button class="btn del sm" onclick="setStatus(' + b.id + ', \'Cancelled\')">Cancel</button></td></tr>';
  }
  if (rows == "") { rows = '<tr><td colspan="6" class="mut">No bookings yet.</td></tr>'; }
  document.getElementById("bookRows").innerHTML = rows;

  var all = basePackages.concat(extraPackages);
  rows = "";
  for (var k = 0; k < all.length; k++) {
    var gone = (removed.indexOf(all[k].id) != -1);
    rows = rows + "<tr><td>" + all[k].name + "</td><td>" + all[k].place + "</td><td>" + money(all[k].price) + '</td><td><button class="btn ' +
      (gone ? "" : "del ") + 'sm" onclick="togglePackage(\'' + all[k].id + '\')">' + (gone ? "Restore" : "Delete") + "</button></td></tr>";
  }
  document.getElementById("pkgRows").innerHTML = rows;

  var list = "";
  for (var m = 0; m < messages.length; m++) {
    list = list + '<div class="panel"><b>' + messages[m].name + '</b> <span class="mut">' + messages[m].email + "</span><p>" + messages[m].msg + "</p></div>";
  }
  if (list == "") { list = '<p class="mut">No messages yet.</p>'; }
  document.getElementById("msgList").innerHTML = list;

  document.getElementById("stUsers").textContent = users.length;
  document.getElementById("stBookings").textContent = bookings.length;
  document.getElementById("stPackages").textContent = all.length - removed.length;
  document.getElementById("stRevenue").textContent = money(revenue);
}

// ---------- 13. Start the page ----------
function showAll() {
  showMenu();
  filterPackages();
  hideRemovedOnHome();
  showTrips();
  showReviews();
  showAccount();
  showAdmin();
}

loadData();
showExtraPackages();

if (document.getElementById("filter") != null) {
  var savedWord = localStorage.getItem("searchWord");
  var savedType = localStorage.getItem("searchType");
  if (savedWord != null) { document.getElementById("fq").value = savedWord; }
  if (savedType != null) { document.getElementById("ft").value = savedType; }
  localStorage.removeItem("searchWord");
  localStorage.removeItem("searchType");
}

showAll();
