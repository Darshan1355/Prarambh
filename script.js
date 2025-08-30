const LS_MEM = "members";
const LS_TASK = "tasks";
const SS_SESSION = "session";
const ADMIN = { username: "admin", password: "1234" };

let state = {
  members: JSON.parse(localStorage.getItem(LS_MEM) || "[]"),
  tasks: JSON.parse(localStorage.getItem(LS_TASK) || "[]"),
  session: JSON.parse(sessionStorage.getItem(SS_SESSION) || "null"),
};

function save() {
  localStorage.setItem(LS_MEM, JSON.stringify(state.members));
  localStorage.setItem(LS_TASK, JSON.stringify(state.tasks));
}
function saveSession() {
  sessionStorage.setItem(SS_SESSION, JSON.stringify(state.session));
}

function nav(id) {
  document.querySelectorAll("section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "page-leader") { renderLeader(); renderCharts(); }
  if (id === "page-member") { renderMemberKanban(); }
}

// ---------- UTIL ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const findMemByEmail = email => state.members.find(m => m.email === email);

// ---------- REGISTER / LOGIN ----------
function registerMember() {
  const name = document.getElementById("m-name").value.trim();
  const email = document.getElementById("m-email").value.trim().toLowerCase();
  const pass = document.getElementById("m-pass").value;
  const skills = document.getElementById("m-skills").value.split(",").map(s => s.trim()).filter(Boolean);

  if (!name || !email || !pass) { alert("Please fill name, email, and password."); return; }
  if (state.members.some(m => m.email === email)) { alert("Email already exists."); return; }

  state.members.push({ id: uid(), name, email, password: pass, skills });
  save();
  alert("Member registered successfully.");
  nav("page-member-login");
}

function memberLogin() {
  const email = document.getElementById("lm-email").value.trim().toLowerCase();
  const pass = document.getElementById("lm-pass").value;
  const mem = state.members.find(m => m.email === email && m.password === pass);
  if (!mem) { alert("Invalid member credentials."); return; }

  state.session = { role: "member", email };
  saveSession();
  nav("page-member");
  renderMemberKanban();
}

function leaderLogin() {
  const u = document.getElementById("l-user").value.trim();
  const p = document.getElementById("l-pass").value;
  if (u === ADMIN.username && p === ADMIN.password) {
    state.session = { role: "leader" };
    saveSession();
    nav("page-leader");
  } else alert("Invalid leader credentials.");
}

function logout() {
  state.session = null;
  saveSession();
  nav("page-landing");
}

// ---------- STATUS & SCORING ----------
function updateTaskStatuses() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  state.tasks.forEach(task => {
    if (task.status === "done") return;
    if (today < task.start) task.status = "todo";
    else if (today >= task.start && today <= task.deadline) task.status = "inprogress";
    else if (today > task.deadline) task.status = "failed";
  });
  save();
}

function calculateMemberScore(email) {
  let points = 0, penalty = 0;
  state.tasks.forEach(t => {
    if (t.assignedTo === email) {
      if (t.status === "done") {
        if (t.completionDate && t.completionDate <= t.deadline) points += t.points;
        else penalty += t.penalty;
      }
      if (t.status === "failed") penalty += t.penalty;
    }
  });
  return { points, penalty };
}

// ---------- LEADER DASHBOARD ----------
function renderLeader() {
  updateTaskStatuses();

  const list = document.getElementById("member-list");
  list.innerHTML = state.members.length
    ? state.members.map(m => {
      const { points, penalty } = calculateMemberScore(m.email);
      return `
      <div class="card">
        <div class="inline" style="justify-content:space-between">
          <div>
            <div style="font-weight:600">${m.name}</div>
            <div class="muted">${m.email}</div>
            <div class="muted">Points: <b style="color:green">${points}</b> | Penalty: <b style="color:red">${penalty}</b></div>
          </div>
          <div>${(m.skills || []).map(s => `<span class="pill">${s}</span>`).join(" ") || '<span class="muted">No skills</span>'}</div>
        </div>
      </div>`;
    }).join("")
    : `<div class="muted">No members yet.</div>`;

  // dropdown
  const select = document.getElementById("t-member");
  if (select) {
    select.innerHTML = '<option value="">Select member</option>' +
      state.members.map(m => `<option value="${m.email}">${m.name}</option>`).join("");
  }

  renderTaskTable();
}

function assignTask() {
  const title = document.getElementById("t-title").value.trim();
  const reqSkill = document.getElementById("t-skill").value.trim();
  const assignee = document.getElementById("t-member").value;
  const start = document.getElementById("t-start").value;
  const deadline = document.getElementById("t-deadline").value;
  const points = parseInt(document.getElementById("t-points").value) || 0;
  const penalty = parseInt(document.getElementById("t-penalty").value) || 0;

  if (!title || !reqSkill || !assignee || !start || !deadline) { alert("Please fill all fields."); return; }

  state.tasks.push({ id: uid(), title, requiredSkill: reqSkill, assignedTo: assignee,
    start, deadline, points, penalty,
    status: "todo", createdAt: Date.now(), file: null, completionDate: null });
  save();

  document.getElementById("t-title").value = "";
  renderLeader(); renderCharts();
  alert("Task assigned.");
}

function renderTaskTable() {
  const tbody = document.getElementById("task-rows");
  if (state.tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">No tasks yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = state.tasks.map(t => {
    const mem = findMemByEmail(t.assignedTo);
    return `<tr>
      <td>${t.title}</td>
      <td><span class="pill">${t.requiredSkill || '-'}</span></td>
      <td>${mem ? mem.name : '-'}</td>
      <td>${t.status}</td>
      <td>${t.points}</td>
      <td>${t.penalty}</td>
      <td>
        <button class="danger" onclick="deleteTask('${t.id}')">Delete</button>
        ${t.file ? `<a href="${t.file.data}" download="${t.file.name}" class="ghost">Download</a>` : ""}
      </td>
    </tr>`;
  }).join("");
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(x => x.id !== id);
  save(); renderTaskTable(); renderCharts();
}

// ---------- MEMBER DASHBOARD (KANBAN) ----------
function renderMemberKanban() {
  updateTaskStatuses();

  const ses = state.session;
  if (!ses || ses.role !== "member") { nav("page-landing"); return; }
  const mem = findMemByEmail(ses.email);
  if (!mem) { nav("page-landing"); return; }

  const { points, penalty } = calculateMemberScore(mem.email);

  document.getElementById("mem-welcome").innerHTML =
    `Welcome, ${mem.name} <br><small>Points: <b style="color:green">${points}</b> | Penalty: <b style="color:red">${penalty}</b></small>`;
  document.getElementById("mem-skills").innerHTML =
    `Skills: ${(mem.skills || []).map(s => `<span class="pill">${s}</span>`).join(" ") || '<span class="muted">No skills</span>'}`;

  const myTasks = state.tasks.filter(t => t.assignedTo === mem.email);
  const cols = { todo: [], inprogress: [], done: [], failed: [] };
  myTasks.forEach(t => cols[t.status || "todo"].push(t));

  ["todo","inprogress","done","failed"].forEach(st => {
    const container = document.getElementById(`col-${st}`);
    if (!container) return;
    container.innerHTML = cols[st].map(t =>
      `<div class="card-task" draggable="true" data-id="${t.id}" ondragstart="onDragStart(event)">
         <div class="title">${t.title}</div>
         <div class="muted">Skill: <span class="chip">${t.requiredSkill || '-'}</span></div>
         ${t.file ? `<div class="muted">📎 ${t.file.name}</div>` : ""}
       </div>`
    ).join("");
    const counter = document.getElementById(`count-${st}`);
    if (counter) counter.textContent = cols[st].length;
  });

  const uploadSelect = document.getElementById("upload-task");
  if (uploadSelect) {
    uploadSelect.innerHTML = '<option value="">Select Done Task</option>' +
      cols["done"].map(t => `<option value="${t.id}">${t.title}</option>`).join("");
  }
}

function onDragStart(ev) { ev.dataTransfer.setData("text/plain", ev.target.getAttribute("data-id")); }
function onDragOver(ev) { ev.preventDefault(); ev.currentTarget.classList.add("drag-over"); }
function onDrop(ev, status) {
  ev.preventDefault(); ev.currentTarget.classList.remove("drag-over");
  const id = ev.dataTransfer.getData("text/plain");
  const task = state.tasks.find(t => t.id === id);
  if (task) { task.status = status; save(); renderMemberKanban(); renderTaskTable(); renderCharts(); }
}

// 📤 File upload
function uploadTaskFile() {
  const taskId = document.getElementById("upload-task").value;
  const fileInput = document.getElementById("upload-file");
  if (!taskId) { alert("Please select a task."); return; }
  if (!fileInput.files.length) { alert("Please choose a file."); return; }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      const today = new Date().toISOString().split("T")[0];
      task.file = { name: file.name, data: e.target.result };
      task.completionDate = today;
      task.status = "done";
      save();
      alert("File uploaded successfully!");
      renderMemberKanban();
      renderTaskTable();
      renderLeader();
    }
  };
  reader.readAsDataURL(file);
}

// ---------- THEME ----------
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark");

// ---------- CHARTS ----------
let statusChart, memberChart, timelineChart;
function renderCharts() {
  const ctx1 = document.getElementById("statusChart"),
        ctx2 = document.getElementById("memberChart"),
        ctx3 = document.getElementById("timelineChart");
  if (!ctx1 || !ctx2 || !ctx3) return;

  const statuses = ["todo","inprogress","done","failed"];
  const statusCounts = statuses.map(s => state.tasks.filter(t => t.status === s).length);
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx1,{type:"pie",data:{labels:["To Do","In Progress","Done","Failed"],datasets:[{data:statusCounts,backgroundColor:["#93c5fd","#fbbf24","#34d399","#f87171"]}]}});
  
  const memNames = state.members.map(m => m.name);
  const memCounts = state.members.map(m => state.tasks.filter(t => t.assignedTo === m.email).length);
  if (memberChart) memberChart.destroy();
  memberChart = new Chart(ctx2,{type:"bar",data:{labels:memNames,datasets:[{label:"Tasks Assigned",data:memCounts,backgroundColor:"#4a90e2"}]}});
  
  const days = {}; state.tasks.forEach(t => { const d=new Date(t.createdAt).toLocaleDateString(); days[d]=(days[d]||0)+1; });
  const labels = Object.keys(days), vals = Object.values(days);
  if (timelineChart) timelineChart.destroy();
  timelineChart = new Chart(ctx3,{type:"line",data:{labels:labels,datasets:[{label:"Tasks Created",data:vals,fill:false,borderColor:"#2563eb"}]}});
}

// ---------- INIT ----------
(function init() {
  updateTaskStatuses();
  if (state.session?.role === "leader") nav("page-leader");
  else if (state.session?.role === "member") nav("page-member");
  else nav("page-landing");
})();
