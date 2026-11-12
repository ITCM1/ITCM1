"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AgentConsole from "@/app/agent-console";

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

const departments = ["Management", "Sales", "Marketing", "Operations", "Finance", "Technology"];
const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Completed"
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({})) as { error?: string };
  return body.error ?? `Request failed (${response.status})`;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [apiError, setApiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Management");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [query, setQuery] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      if (!response.ok) {
        setApiError(await readError(response));
        if (response.status === 401) setAuthenticated(false);
        return;
      }
      const body = await response.json() as { tasks: Task[] };
      setTasks(body.tasks);
      setApiError("");
    } catch {
      setApiError("Could not connect to the task service. Check the Worker and D1 configuration.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (body: { authenticated: boolean }) => {
        if (!active) return;
        setAuthenticated(body.authenticated);
        if (body.authenticated) await loadTasks();
      })
      .catch(() => setLoginError("Unable to check owner session."))
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [loadTasks]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setLoginError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!response.ok) throw new Error(await readError(response));
      setAuthenticated(true);
      setPassword("");
      await loadTasks();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setAuthenticated(false);
    setTasks([]);
  }

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

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || busy) return;
    setBusy(true);
    setApiError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: cleanTitle, description: description.trim(), department, priority })
      });
      if (!response.ok) throw new Error(await readError(response));
      const body = await response.json() as { task: Task };
      setTasks((current) => [body.task, ...current]);
      setTitle("");
      setDescription("");
      setPriority("normal");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Task could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id: string, status: TaskStatus) {
    const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setApiError(await readError(response));
      return;
    }
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task));
    setApiError("");
  }

  async function removeTask(id: string) {
    const response = await fetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      setApiError(await readError(response));
      return;
    }
    setTasks((current) => current.filter((task) => task.id !== id));
    setApiError("");
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

  if (!ready) {
    return <main className="auth-screen"><div className="auth-card"><div className="brand-mark">ITCM<span>✦</span></div><div className="brand-subtitle">GLOBAL AI</div><p>Checking secure owner session…</p></div></main>;
  }

  if (!authenticated) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={login}>
          <div className="brand-mark">ITCM<span>✦</span></div>
          <div className="brand-subtitle">GLOBAL AI</div>
          <span className="eyebrow gold">SECURE OWNER ACCESS</span>
          <h1>Welcome back</h1>
          <p>Sign in to manage the ITCM GLOBAL AI workspace.</p>
          <label className="field-label">Owner password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required maxLength={512} />
          </label>
          {loginError && <p className="error-message" role="alert">{loginError}</p>}
          <button className="primary-button" type="submit" disabled={busy || !password}>{busy ? "Signing in…" : "Sign in securely"}</button>
          <small>Access is restricted to the platform owner.</small>
        </form>
      </main>
    );
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
          <div className="topbar-actions"><div className="status-pill"><i /> Owner authenticated</div><button className="secondary-button" type="button" onClick={logout}>Sign out</button></div>
        </header>

        <section className="welcome-panel">
          <div>
            <span className="eyebrow gold">ITCM GLOBAL AI</span>
            <h2>Your business.<br />One command center.</h2>
            <p>Owner-controlled task management with server-side persistence through Cloudflare D1.</p>
          </div>
          <div className="orb" aria-hidden="true"><span>✦</span></div>
        </section>

        {apiError && <div className="error-banner" role="alert"><strong>Service notice:</strong> {apiError}</div>}

        <section className="stats-grid" aria-label="Task summary">
          <article className="stat-card"><span>Total tasks</span><strong>{counts.all}</strong><small>Persisted task records</small></article>
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
          <div className="form-actions"><button className="primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "＋ Add task"}</button><button className="secondary-button" type="button" onClick={exportTasks} disabled={tasks.length === 0}>Export tasks</button><button className="secondary-button" type="button" onClick={loadTasks}>Refresh</button></div>
        </form>

        <section className="section-heading" id="tasks">
          <div><span className="eyebrow">LIVE TASK REGISTER</span><h2>Task center</h2></div>
          <span className="muted">{visibleTasks.length} shown · D1-backed when configured</span>
        </section>
        <div className="task-toolbar">
          <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks…" aria-label="Search tasks" />
          <div className="filter-group" aria-label="Filter tasks">
            {(["all", "pending", "in_progress", "done"] as const).map((value) => <button key={value} type="button" className={filter === value ? "filter-button selected" : "filter-button"} onClick={() => setFilter(value)}>{value === "all" ? "All" : statusLabels[value]}</button>)}
          </div>
        </div>

        <div className="task-list">
          {visibleTasks.length === 0 ? <p className="empty-state">{apiError ? "Task service is not ready. Configure D1 to load and save records." : "No tasks yet. Create your first task above."}</p> : visibleTasks.map((task) => (
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

        <AgentConsole />

        <section className="notice" id="integrations">
          <div className="notice-icon">!</div>
          <div><strong>Integration status</strong><p>Owner authentication and persistent task endpoints are implemented. Cloudflare D1 must be created, bound as DB, and initialized with migrations/0001_tasks.sql. AI agents, Telegram task execution, email, WhatsApp and payments remain separate integration work and are not represented as active.</p></div>
        </section>

        <footer>ITCM GLOBAL AI <span>·</span> Owner workspace <span>·</span> Secure task foundation</footer>
      </section>
    </main>
  );
}
