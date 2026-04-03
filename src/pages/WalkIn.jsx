import React, { useState, useEffect } from "react";
import { useAuth } from "../App";
import { getStandards, getStudentWalkInData, createWalkInVisit, getWalkInVisits, addWalkInNote, getWalkInNotes } from "../lib/api";
import { Search, User, TrendingUp, AlertTriangle, Star, BookOpen, Calendar, IndianRupee, FileText, Loader2, BarChart3, Clock, MessageSquare, Plus, X, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { showToast } from "../utils";

export default function WalkIn() {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [students, setStudents] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [selected, setSelected] = useState(null);
    const [data, setData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [standards, setStandards] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loadingVisits, setLoadingVisits] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [noteType, setNoteType] = useState("general");
    const [savingNote, setSavingNote] = useState(false);
    const [visitNotes, setVisitNotes] = useState({});
    const [creatingVisit, setCreatingVisit] = useState(false);

    useEffect(() => { getStandards().then(s => setStandards(s || [])); }, []);

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) return;
        setLoadingSearch(true);
        try {
            const { getStudents } = await import("../lib/api");
            const results = await getStudents({ search: query });
            setStudents(results || []);
        } catch { showToast("Search failed", "error"); }
        setLoadingSearch(false);
    }

    async function selectStudent(student) {
        setSelected(student);
        setLoadingData(true);
        setData(null);
        setActiveTab("overview");
        try {
            const d = await getStudentWalkInData(student.id);
            setData(d);
        } catch { showToast("Failed to load student data", "error"); }
        setLoadingData(false);
        loadVisits(student.id);
    }

    async function loadVisits(studentId) {
        setLoadingVisits(true);
        try { setVisits(await getWalkInVisits(studentId)); }
        catch { setVisits([]); }
        setLoadingVisits(false);
    }

    async function startNewVisit() {
        if (!selected) return;
        setCreatingVisit(true);
        try {
            await createWalkInVisit({ studentId: selected.id, visitedBy: user.id, summary: "Walk-in session" });
            showToast("Visit started!");
            loadVisits(selected.id);
        } catch { showToast("Failed to start visit", "error"); }
        setCreatingVisit(false);
    }

    async function handleAddNote(visitId) {
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            await addWalkInNote({ visitId, noteText: noteText.trim(), noteType, createdBy: user.id });
            setNoteText("");
            const notes = await getWalkInNotes(visitId);
            setVisitNotes(prev => ({ ...prev, [visitId]: notes }));
            showToast("Note added!");
        } catch { showToast("Failed to add note", "error"); }
        setSavingNote(false);
    }

    function avgColor(pct) {
        if (pct >= 75) return "#10B981";
        if (pct >= 50) return "#F59E0B";
        return "#EF4444";
    }

    function pct(marks, max) { return max > 0 ? Math.round((marks / max) * 100) : 0; }

    const recentAtt = (data?.attendance || []).slice(0, 30);
    const attPct = recentAtt.length > 0 ? Math.round(recentAtt.filter(a => a.status === "present" || a.status === "late").length / recentAtt.length * 100) : 0;
    const attColor = attPct >= 75 ? "#10B981" : attPct >= 50 ? "#F59E0B" : "#EF4444";

    const allTestResults = data?.allTestResults || [];
    const subjectMarks = {};
    allTestResults.forEach(r => {
        const sub = r.subjects?.name || "Unknown";
        if (!subjectMarks[sub]) subjectMarks[sub] = [];
        subjectMarks[sub].push({ marks: r.marks_obtained, max: r.max_marks, grade: r.grade });
    });
    const subjectAverages = Object.entries(subjectMarks).map(([subject, marks]) => ({
        subject, avg: Math.round(marks.reduce((s, m) => s + pct(m.marks, m.max), 0) / marks.length), count: marks.length
    })).sort((a, b) => a.avg - b.avg);

    const classMarksData = data?.classMarks || [];
    const classAvgData = {};
    classMarksData.forEach(r => {
        const sub = r.subjects?.name || "Unknown";
        if (!classAvgData[sub]) classAvgData[sub] = [];
        classAvgData[sub].push({ m: r.marks_obtained, mx: r.max_marks });
    });
    Object.keys(classAvgData).forEach(sub => {
        const pairs = classAvgData[sub];
        classAvgData[sub] = pairs.length > 0 ? Math.round(pairs.reduce((s, p) => s + pct(p.m, p.mx), 0) / pairs.length) : 0;
    });

    const weakSubjects = subjectAverages.slice(0, 2);
    const strongSubjects = [...subjectAverages].reverse().slice(0, 2);
    const chartData = subjectAverages.map(sa => ({ subject: sa.subject, yourAvg: sa.avg, classAvg: classAvgData[sa.subject] || 0 }));
    const noteTypes = ["general", "academic", "fee", "attendance", "behavioral", "other"];

    const loadNotes = async (visitId) => {
        if (visitNotes[visitId]) return;
        const notes = await getWalkInNotes(visitId);
        setVisitNotes(prev => ({ ...prev, [visitId]: notes }));
    };

    return (
        <div className="page-content" style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
            <div className="page-header"><h2>Walk-In</h2></div>

            {!selected ? (
                <div className="card">
                    <div className="card-header"><h3>Find Student</h3></div>
                    <form onSubmit={handleSearch} className="card-body" style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or roll number..." style={{ width: "100%", paddingLeft: 36, padding: "10px 12px 10px 36px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.9rem" }} />
                        </div>
                        <button type="submit" className="btn-primary" disabled={loadingSearch}>{loadingSearch ? <Loader2 size={14} className="spin" /> : <Search size={14} />} Search</button>
                    </form>
                    {students.length > 0 && (
                        <div style={{ padding: "0 16px 16px" }}>
                            {students.map(s => (
                                <div key={s.id} onClick={() => selectStudent(s)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                                    <div><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.standards?.name} — Roll {s.roll_no}</div></div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{s.parent_phone}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div><h3 style={{ margin: 0 }}>{selected.name}</h3><span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{selected.standards?.name} — Roll {selected.roll_no}</span></div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button className="btn-secondary" onClick={() => { setSelected(null); setData(null); setVisits([]); }}>Back to Search</button>
                            <button className="btn-primary" onClick={startNewVisit} disabled={creatingVisit}>{creatingVisit ? <Loader2 size={14} className="spin" /> : <><Plus size={14} /> New Visit</>} </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "2px solid var(--border)", paddingBottom: 0 }}>
                        {[["overview","Overview"],["marks","Marks"],["compare","Compare"],["notes","Visit Notes"]].map(([tab, label]) => (
                            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", border: "none", borderBottom: activeTab === tab ? "2px solid var(--navy)" : "2px solid transparent", background: "none", cursor: "pointer", fontWeight: activeTab === tab ? 600 : 400, color: activeTab === tab ? "var(--navy)" : "var(--text-muted)", borderRadius: "8px 8px 0 0" }}>{label}</button>
                        ))}
                    </div>

                    {loadingData ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={32} className="spin" /></div> : null}

                    {activeTab === "overview" && data && (
                        <div>
                            <div className="stats-grid" style={{ marginBottom: 20 }}>
                                <div className="stat-card navy"><div className="stat-info"><h4>Attendance</h4><div className="stat-value" style={{ color: attColor }}>{attPct}%</div></div></div>
                                <div className="stat-card gold"><div className="stat-info"><h4>Tests Taken</h4><div className="stat-value">{allTestResults.length}</div></div></div>
                                <div className="stat-card green"><div className="stat-info"><h4>Walk-In Visits</h4><div className="stat-value">{visits.length}</div></div></div>
                                <div className="stat-card red"><div className="stat-info"><h4>Subjects</h4><div className="stat-value">{subjectAverages.length}</div></div></div>
                            </div>
                            <div className="grid-2">
                                <div className="card"><div className="card-header"><h3>Student Info</h3></div><div className="card-body" style={{ fontSize: "0.9rem" }}>
                                    <div style={{ marginBottom: 8 }}><strong>Parent:</strong> {selected.parent_name || "—"}</div>
                                    <div style={{ marginBottom: 8 }}><strong>Phone:</strong> {selected.parent_phone || "—"}</div>
                                    <div style={{ marginBottom: 8 }}><strong>Email:</strong> {selected.parent_email || "—"}</div>
                                    <div style={{ marginBottom: 8 }}><strong>DOB:</strong> {selected.date_of_birth || "—"}</div>
                                    <div style={{ marginBottom: 8 }}><strong>Enrolled:</strong> {selected.enrollment_date || "—"}</div>
                                    <div style={{ marginBottom: 8 }}><strong>Standard:</strong> {selected.standards?.name || "—"}</div>
                                </div></div>
                                <div className="card"><div className="card-header"><h3>Recent Attendance (30 days)</h3></div><div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {recentAtt.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No records</p> : recentAtt.map(a => (
                                        <div key={a.id} style={{ padding: "4px 8px", borderRadius: 6, background: a.status === "present" ? "#10B981" : a.status === "late" ? "#3B82F6" : "#EF4444", color: "white", fontSize: "0.72rem", fontWeight: 600 }}>{a.date ? a.date.slice(5) : "—"}</div>
                                    ))}
                                </div></div>
                            </div>
                        </div>
                    )}

                    {activeTab === "marks" && data && (
                        <div className="card">
                            <div className="card-header"><h3>All Test Results</h3></div>
                            <div className="card-body" style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th><th>Class Avg</th></tr></thead>
                                    <tbody>
                                        {allTestResults.map(r => {
                                            const ca = classAvgData[r.subjects?.name || ""] || 0;
                                            const p = pct(r.marks_obtained, r.max_marks);
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 500 }}>{r.tests?.name || "—"}</td>
                                                    <td>{r.subjects?.name || "—"}</td>
                                                    <td style={{ fontWeight: 600 }}>{r.marks_obtained}</td>
                                                    <td>{r.max_marks}</td>
                                                    <td style={{ color: avgColor(p), fontWeight: 700 }}>{p}%</td>
                                                    <td><span className="badge" style={{ background: avgColor(p), color: "white" }}>{r.grade || "—"}</span></td>
                                                    <td style={{ color: "var(--text-muted)" }}>{ca > 0 ? ca + "%" : "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === "compare" && data && (
                        <div className="grid-2">
                            <div className="card"><div className="card-header"><h3>Your Avg vs Class Avg</h3></div><div className="card-body"><ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0,100]} tickFormatter={v => v+"%"} />
                                    <YAxis type="category" dataKey="subject" width={90} fontSize={11} />
                                    <Tooltip formatter={v => [v+"%"]} />
                                    <Bar dataKey="yourAvg" name="Your Avg" fill="#0A2351" radius={[0,4,4,0]} />
                                    <Bar dataKey="classAvg" name="Class Avg" fill="#B6922E" radius={[0,4,4,0]} />
                                </BarChart>
                            </ResponsiveContainer></div></div>
                            <div className="card"><div className="card-header"><h3>Weak vs Strong Subjects</h3></div><div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {weakSubjects.map((ws, i) => (
                                    <div key={"w"+i}><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Needs Focus</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{ws.subject}</span><span style={{ color: avgColor(ws.avg), fontWeight: 700 }}>{ws.avg}%</span></div>
                                        <div style={{ height: 8, background: "var(--border)", borderRadius: 4 }}><div style={{ height: "100%", width: ws.avg+"%", background: avgColor(ws.avg), borderRadius: 4 }} /></div>
                                    </div>
                                ))}
                                {strongSubjects.map((ss, i) => (
                                    <div key={"s"+i}><div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>Strongest</div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontWeight: 600 }}>{ss.subject}</span><span style={{ color: avgColor(ss.avg), fontWeight: 700 }}>{ss.avg}%</span></div>
                                        <div style={{ height: 8, background: "var(--border)", borderRadius: 4 }}><div style={{ height: "100%", width: ss.avg+"%", background: avgColor(ss.avg), borderRadius: 4 }} /></div>
                                    </div>
                                ))}
                            </div></div>
                        </div>
                    )}

                    {activeTab === "notes" && (
                        <div>
                            <div className="card" style={{ marginBottom: 16 }}>
                                <div className="card-header"><h3>New Visit</h3></div>
                                <div className="card-body">
                                    <button className="btn-primary" onClick={startNewVisit} disabled={creatingVisit}>{creatingVisit ? <Loader2 size={14} className="spin" /> : <><Plus size={14} /> Start New Visit</>} </button>
                                </div>
                            </div>
                            {loadingVisits ? <div style={{ textAlign: "center", padding: 24 }}><Loader2 size={24} className="spin" /></div> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {visits.length === 0 ? <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>No visits yet. Start one above.</p> : visits.map(visit => (
                                        <div key={visit.id} className="card">
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
                                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                                    <Clock size={14} style={{ color: "var(--text-muted)" }} />
                                                    <span style={{ fontWeight: 600 }}>{new Date(visit.visited_at).toLocaleString()}</span>
                                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{visit.profiles?.name || "—"}</span>
                                                </div>
                                            </div>
                                            <div style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                                    <select value={noteType} onChange={e => setNoteType(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.85rem" }}>
                                                        {noteTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                                    </select>
                                                    <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: "0.85rem" }} />
                                                    <button className="btn-primary btn-small" onClick={() => handleAddNote(visit.id)} disabled={savingNote}>{savingNote ? <Loader2 size={12} className="spin" /> : <Plus size={12} />}</button>
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    {(visitNotes[visit.id] || []).map(note => (
                                                        <div key={note.id} style={{ padding: "8px 10px", background: "var(--surface-raised)", borderRadius: 6, fontSize: "0.85rem", display: "flex", justifyContent: "space-between" }}>
                                                            <span><span className="badge" style={{ fontSize: "0.7rem", marginRight: 6, padding: "2px 6px" }}>{note.note_type}</span>{note.note_text}</span>
                                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{note.profiles?.name || ""}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

