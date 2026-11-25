import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BookOpen, Check, ChevronDown, Dumbbell, Footprints, Flame, Leaf, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { apiConfigured, deleteRemoteEntry, fetchEntries, readLocalEntries, saveEntry, writeLocalEntries } from './api';

const TYPES = [
  { id: 'workout', name: 'Strength', icon: Dumbbell, color: '#c4f06b' },
  { id: 'run', name: 'Run', icon: Footprints, color: '#86d9cb' },
  { id: 'study', name: 'Study', icon: BookOpen, color: '#b5a3ff' },
  { id: 'habit', name: 'Clean living', icon: Leaf, color: '#f0bc78' }
];
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export default function App() {
  const [entries, setEntries] = useState(() => readLocalEntries().sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const [form, setForm] = useState({ type: 'workout', title: '', date: today(), durationMinutes: '45', notes: '' });
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [sync, setSync] = useState(apiConfigured ? 'Connecting to your sync…' : 'On this device only');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!apiConfigured) return;
    let active = true;
    (async () => {
      try {
        const local = readLocalEntries();
        const remote = await fetchEntries();
        const remoteIds = new Set(remote.map((entry) => entry.id));
        const pending = local.filter((entry) => !remoteIds.has(entry.id));
        for (const entry of pending) await saveEntry(entry);
        if (!active) return;
        const merged = [...remote, ...pending].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setEntries(merged);
        writeLocalEntries(merged);
        setSync('Synced to your backend');
      } catch {
        if (active) setSync('Offline — saved on this device; will retry on reload');
      }
    })();
    return () => { active = false; };
  }, []);

  const weekStart = useMemo(() => {
    const date = new Date();
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const weekEntries = entries.filter((entry) => new Date(`${entry.date}T12:00:00`) >= weekStart);
  const minutesThisWeek = weekEntries.reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
  const currentStreak = useMemo(() => {
    const days = new Set(entries.map((entry) => entry.date));
    let cursor = new Date();
    let streak = 0;
    if (!days.has(today())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [entries]);
  const visibleEntries = entries.filter((entry) => filter === 'all' || entry.type === filter);
  const typeName = (id) => TYPES.find((type) => type.id === id)?.name || 'Activity';
  const updateEntries = (next) => {
    setEntries(next);
    writeLocalEntries(next);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const entry = {
      id: crypto.randomUUID(),
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      durationMinutes: form.type === 'habit' ? 0 : Number(form.durationMinutes),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };
    if (!entry.title) return setError('Add a short title for this entry.');
    if (entry.type !== 'habit' && (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes < 1)) return setError('Duration must be at least one minute.');
    const next = [entry, ...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    updateEntries(next);
    setForm({ ...form, title: '', notes: '' });
    if (!apiConfigured) return;
    setBusy(true);
    try {
      await saveEntry(entry);
      setSync('Synced to your backend');
    } catch (err) {
      setSync('Saved locally — sync will retry on reload');
      setError(`Saved on this device, but the API could not sync: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(entry) {
    const next = entries.filter((item) => item.id !== entry.id);
    updateEntries(next);
    if (!apiConfigured) return;
    try {
      await deleteRemoteEntry(entry.id);
      setSync('Synced to your backend');
    } catch (err) {
      setSync('Delete saved locally; remote may still contain this entry');
      setError(`Could not sync delete: ${err.message}`);
    }
  }

  const activeDays = new Set(weekEntries.map((entry) => new Date(`${entry.date}T12:00:00`).getDay()));
  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Kept home"><span className="brand-mark"><Check size={19} strokeWidth={3} /></span><span>kept<span className="brand-period">.</span></span></a>
        <div className="topbar-right"><span className="privacy-pill"><span className="privacy-dot" />{sync}</span><a className="top-link" href="#activity">Your activity <ChevronDown size={14} /></a></div>
      </header>

      <section className="welcome" id="home">
        <div className="welcome-copy"><div className="eyebrow"><Sparkles size={14} /> A little better, by showing up</div><h1>Your daily practice,<br /><em>kept.</em></h1><p>A quiet place to keep track of the things you do for yourself. No streak pressure. Just progress you can see.</p></div>
        <div className="week-card"><div className="week-head"><div><span className="muted-label">YOUR WEEK</span><strong>{weekEntries.length} <small>entries</small></strong></div><div className="week-total"><span>{minutesThisWeek}</span><small>min invested</small></div></div><div className="week-days">{weekDayLabels.map((label, index) => { const dayIndex = (index + 1) % 7; return <div key={`${label}-${index}`} className="day"><span>{label}</span><i className={activeDays.has(dayIndex) ? 'day-dot active' : 'day-dot'} /></div>; })}</div><div className="week-foot"><span>Every small session counts</span><span className="streak"><Flame size={15} /> {currentStreak} day streak</span></div></div>
      </section>

      <section className="dashboard-grid">
        <div className="panel log-panel"><div className="panel-heading"><div><span className="muted-label">MAKE IT COUNT</span><h2>Log a session</h2></div><span className="heading-icon"><Plus size={19} /></span></div>
          <div className="type-picker" role="group" aria-label="Activity type">{TYPES.map(({ id, name, icon: Icon, color }) => <button type="button" className={`type-option ${form.type === id ? 'selected' : ''}`} onClick={() => setForm({ ...form, type: id })} key={id} style={{ '--type-color': color }}><Icon size={17} /><span>{name}</span></button>)}</div>
          <form onSubmit={handleSubmit} className="entry-form">
            <label>What did you do?<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.type === 'run' ? 'Easy morning miles' : form.type === 'study' ? 'Read chapter three' : form.type === 'habit' ? 'A day without alcohol' : 'Upper body strength'} maxLength={100} required /></label>
            <div className="form-row"><label>Date<input type="date" value={form.date} max={today()} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>{form.type !== 'habit' && <label>Time spent <span className="input-with-suffix"><input type="number" min="1" max="1440" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required /><span>min</span></span></label>}</div>
            <label>Note <span className="optional">(optional)</span><textarea rows="2" maxLength={400} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="How did it feel? Anything you want to remember?" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy}>{busy ? <><RefreshCw className="spin" size={16} /> Saving…</> : <><Plus size={17} /> Keep this session</>}</button>
          </form>
          <p className="form-footnote"><Leaf size={13} /> Saved on this device first. You choose if it syncs.</p>
        </div>

        <div className="right-column">
          <div className="panel rhythm-panel"><div className="panel-heading"><div><span className="muted-label">YOUR RHYTHM</span><h2>Showing up adds up.</h2></div><Activity className="rhythm-icon" size={20} /></div><div className="rhythm-stats"><div><strong>{weekEntries.filter((entry) => entry.type === 'workout').length}</strong><span>Strength</span></div><div><strong>{weekEntries.filter((entry) => entry.type === 'run').length}</strong><span>Runs</span></div><div><strong>{weekEntries.filter((entry) => entry.type === 'study').length}</strong><span>Study</span></div><div><strong>{weekEntries.filter((entry) => entry.type === 'habit').length}</strong><span>Habits</span></div></div><div className="rhythm-note">Small, steady efforts are still efforts. Keep your own pace.</div></div>
          <div className="quote-card"><div className="quote-mark">“</div><p>You don’t have to do it all.<br />Just keep the promise you made to yourself.</p><span>THE KEPT PRACTICE</span></div>
        </div>
      </section>

      <section className="panel activity-panel" id="activity"><div className="activity-heading"><div><span className="muted-label">THE RECORD</span><h2>Recent activity <span className="record-count">{entries.length}</span></h2></div><label className="filter-select"><span className="sr-only">Filter activity type</span><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Everything</option>{TYPES.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select><ChevronDown size={14} /></label></div>
        {visibleEntries.length === 0 ? <div className="empty-state"><span className="empty-icon"><Leaf size={22} /></span><h3>{entries.length ? 'Nothing in this filter yet' : 'Your first entry starts here'}</h3><p>{entries.length ? 'Choose another activity type to see more.' : 'Log a workout, a run, a study session, or a small habit. It all belongs.'}</p></div> : <div className="entry-list">{visibleEntries.slice(0, 40).map((entry) => { const type = TYPES.find((item) => item.id === entry.type) || TYPES[0]; const Icon = type.icon; return <article className="entry-row" key={entry.id}><span className="entry-icon" style={{ '--type-color': type.color }}><Icon size={18} /></span><div className="entry-main"><div className="entry-title-line"><h3>{entry.title}</h3><span className="entry-type">{type.name}</span></div><p>{dateLabel(entry.date)}{entry.durationMinutes ? ` · ${entry.durationMinutes} min` : ''}{entry.notes ? ` · ${entry.notes}` : ''}</p></div><button className="delete-button" onClick={() => handleDelete(entry)} aria-label={`Delete ${entry.title}`} title="Delete entry"><Trash2 size={16} /></button></article>; })}</div>}
      </section>
      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Check size={16} strokeWidth={3} /></span><span>kept<span className="brand-period">.</span></span></a><span>Made for the long game. Your data, your pace.</span><span>{apiConfigured ? 'Optional sync enabled' : 'Local-first by default'}</span></footer>
    </main>
  );
}
