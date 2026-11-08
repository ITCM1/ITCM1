"use client";

import { useEffect, useMemo, useState } from "react";

type TaskStatus = "pending" | "in_progress" | "done";
type TaskPriority = "high" | "normal" | "low";
type Task = {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
};

const STORAGE_KEY = "itcm-global-ai-tasks-v1";
const departments = ["Management", "Sales", "Marketing", "Operations", "Finance", "Technology"];
const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Completed"
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Management");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setTasks(parsed as Task[]);
      }
    } catch {
      // Invalid local data is ignored; the workspace remains usable.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    inProgress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length
  }), [tasks]);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const search = query.trim().toLowerCase();
    const matchesQuery = !search || `${task.title} ${task.description} ${task.department}`.toLowerCase().includes(search);
    return matchesFilter && matchesQuery;
  }), [tasks, filter, query]);

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setTasks((current) => [{
      id: makeId(),
      title: cleanTitle,
      description: description.trim(),
      department,
      priority,
      status: "pending",
      createdAt: new Date().toISOString()
    }, ...current]);
    setTitle("");
    setDescription("");
    setPriority("normal");
  }

  function changeStatus(id: string, status: TaskStatus) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "itcm-global-ai-tasks.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand-mark">ITCM<span>✦</span></div>
        <div className="brand-subtitle">GLOBAL AI</div>
        <div className="nav-label">COMMAND</div>
        <a className="nav-item active" href="#overview">Overview</a>
        <a className="nav-item" href="#tasks">Task center</a>
        <a className="nav-item" href="#create-task">Create task</a>
        <a className="nav-item" href="#integrations">Integrations</a>
        <div className="sidebar-bottom">
          <div className="owner-avatar">TB</div>
          <div><strong>Owner workspace</strong><small>ITCM GLOBAL AI</small></div>
        </div>
      </aside>

      <section className="workspace" id="overview">
        <header className="topbar">
          <div><span className="eyebrow">GLOBAL OPERATIONS</span><h1>Executive command center</h1></div>
          <div className="status-pill"><i /> Workspace active</div>
        </header>

        <section className="welcome-panel">
          <div>
            <span className="eyebrow gold">ITCM GLOBAL AI</span>
            <h2>Your business.<br />One command center.</h2>
            <p>Create and track real work items in this workspace. Tasks are saved in this browser on this device.</p>
          </div>
          <div className="orb" aria-hidden="true"><span>✦</span></div>
        </section>

        <section className="stats-grid" aria-label="Task summary">
          <article className="stat-card"><span>Total tasks</span><strong>{counts.all}</strong><small>All recorded tasks</small></article>
          <article className="stat-card"><span>Pending</span><strong>{counts.pending}</strong><small>Waiting to start</small></article>
          <article className="stat-card"><span>In progress</span><strong>{counts.inProgress}</strong><small>Currently being handled</small></article>
          <article className="stat-card"><span>Completed</span><strong>{counts.done}</strong><small>Marked as completed</small></article>
        </section>

        <section className="section-heading" id="create-task">
          <div><span className="eyebrow">WORK MANAGEMENT</span><h2>Create a task</h2></div>
          <span className="muted">Owner-controlled task list</span>
        </section>

        <form className="task-form" onSubmit={addTask}>
          <label className="field-label">Task title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to be done?" required maxLength={120} /></label>
          <label className="field-label">Department<select value={department} onChange={(event) => setDepartment(event.target.value)}>{departments.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></label>
          <label className="field-label field-wide">Details<textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add instructions or context (optional)" rows={2} maxLength={1000} /></label>
          <div className="form-actions"><button className="primary-button" type="submit">＋ Add task</button><button className="secondary-button" type="button" onClick={exportTasks} disabled={tasks.length === 0}>Export tasks</button></div>
        </form>

        <section className="section-heading" id="tasks">
          <div><span className="eyebrow">LIVE TASK REGISTER</span><h2>Task center</h2></div>
          <span className="muted">{ready ? `${visibleTasks.length} shown` : "Loading saved tasks…"}</span>
        </section>
        <div className="task-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" aria-label="Search tasks" />
          <div className="filter-group" aria-label="Filter tasks">
            {(["all", "pending", "in_progress", "done"] as const).map((value) => <button key={value} type="button" className={filter === value ? "filter-button selected" : "filter-button"} onClick={() => setFilter(value)}>{value === "all" ? "All" : statusLabels[value]}</button>)}
          </div>
        </div>

        <div className="task-list">
          {!ready ? <p className="empty-state">Loading workspace…</p> : visibleTasks.length === 0 ? <p className="empty-state">{tasks.length === 0 ? "No tasks yet. Create your first task above." : "No tasks match this filter."}</p> : visibleTasks.map((task) => (
            <article className="task-row" key={task.id}>
              <div className="task-main">
                <div className="task-title-line"><h3>{task.title}</h3><span className={`priority priority-${task.priority}`}>{task.priority}</span></div>
                {task.description && <p>{task.description}</p>}
                <small>{task.department} · Created {new Date(task.createdAt).toLocaleString()}</small>
              </div>
              <div className="task-controls">
                <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => changeStatus(task.id, event.target.value as TaskStatus)}>
                  <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="done">Completed</option>
                </select>
                <button type="button" className="delete-button" onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}>Delete</button>
              </div>
            </article>
          ))}
        </div>

        <section className="notice" id="integrations">
          <div className="notice-icon">!</div>
          <div><strong>Important: local workspace only</strong><p>Task data is currently stored in this browser on this device. It is not yet shared across devices or users. AI agents, cloud database, Telegram commands and payment integrations remain disconnected until their services and credentials are configured and tested.</p></div>
        </section>

        <footer>ITCM GLOBAL AI <span>·</span> Owner workspace <span>·</span> Operational foundation</footer>
      </section>
    </main>
  );
}
