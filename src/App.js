import React, { useEffect, useState } from "react";
import './App.css';
import { Pencil, Copy, FilePlus, FolderPlus, Save, XCircle, PlusCircle } from "lucide-react";
import testersData from "./testers.json"; // import testers from JSON
import config from "./config";
export default function App() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [form, setForm] = useState({
        Typ: "Referenstest",
        Testnamn: "",
        Syfte: "",
        Testare: "Johan",
    });
    const [newProjectName, setNewProjectName] = useState("");
    const [analysRow, setAnalysRow] = useState(null);
    const [analysText, setAnalysText] = useState("");
    const [copied, setCopied] = useState(false);
    const [testers, setTesters] = useState([]);

//    const API_BASE = "https://ptlog-af-neoload-acc.apps.tocp4.arbetsformedlingen.se";
    const API_BASE = config.API_BASE;

    useEffect(() => {
        // Load testers from JSON
        setTesters(testersData);

        // Load projects
        fetch(`${API_BASE}/populate`)
            .then(res => res.json())
            .then(json => Array.isArray(json) ? setProjects(json) : setProjects([]))
            .catch(err => {
                console.error("Failed to load projects", err);
                setProjects([]);
            });
    }, []);

    useEffect(() => {
        if (!selectedProject) return;
        setLoading(true);
        fetch(`${API_BASE}/getData?projekt=${encodeURIComponent(selectedProject)}`)
            .then(res => res.json())
            .then(rawData => {
                const formatted = rawData.map(item => {
                    const d = new Date(item.DATUM || item.Datum);
                    return { ...item, DATUM: `${d.toISOString().split("T")[0]} ${d.toTimeString().slice(0,5)}` };
                });
                setData(formatted);
            })
            .catch(err => { console.error("Failed to load data", err); setData([]); })
            .finally(() => setLoading(false));
    }, [selectedProject]);

    const handleSubmit = () => {
        const payload = { Datum: new Date().toISOString(), ...form, Projekt: selectedProject };
        fetch(`${API_BASE}/insert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => { if (!res.ok) throw new Error("Insert failed"); return res.text(); })
            .then(() => {
                setForm({ Typ: "Referenstest", Testnamn: "", Syfte: "", Testare: "Johan" });
                setActiveTab("");
                return refreshData();
            })
            .catch(err => console.error("Insert error:", err));
    };

    const handleAddProject = () => {
        if (!newProjectName.trim()) return;
        fetch(`${API_BASE}/createProject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Projekt: newProjectName.trim() })
        })
            .then(res => res.text())
            .then(() => {
                setNewProjectName("");
                setActiveTab("");
                return fetch(`${API_BASE}/populate`)
                    .then(res => res.json())
                    .then(json => Array.isArray(json) ? setProjects(json) : setProjects([]));
            })
            .catch(err => console.error("Add project error:", err));
    };

    const handleSaveAnalys = () => {
        if (!analysRow || !analysText.trim()) return;

        const payload = {
            Projekt: analysRow.PROJEKT ?? analysRow.projekt,
            Testnamn: analysRow.TESTNAMN ?? analysRow.testnamn,
            Analys: analysText.trim()
        };

        fetch(`${API_BASE}/updateAnalys`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => { if (!res.ok) throw new Error("Update failed"); return res.text(); })
            .then(() => {
                setAnalysRow(null);
                setAnalysText("");
                setActiveTab("");
                return refreshData();
            })
            .catch(err => console.error("UpdateAnalys error:", err));
    };

    const refreshData = () => {
        return fetch(`${API_BASE}/getData?projekt=${encodeURIComponent(selectedProject)}`)
            .then(res => res.json())
            .then(rawData => {
                const formatted = rawData.map(item => {
                    const d = new Date(item.DATUM || item.Datum);
                    return { ...item, DATUM: `${d.toISOString().split("T")[0]} ${d.toTimeString().slice(0,5)}` };
                });
                setData(formatted);
            });
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const columns = ["DATUM", "TYP", "TESTNAMN", "SYFTE", "ANALYS", "PROJEKT", "TESTARE"];
    const isFormValid = form.Testnamn.trim() && form.Syfte.trim() && selectedProject;

    return (
        <div className="app-container">
            <div className="header-row">
                <button onClick={() => setActiveTab(activeTab === "newTest" ? "" : "newTest")} className="btn blue">
                    <FilePlus size={16} style={{ marginRight: "6px" }} /> Nytt Test
                </button>
                <button onClick={() => setActiveTab(activeTab === "addProject" ? "" : "addProject")} className="btn green">
                    <FolderPlus size={16} style={{ marginRight: "6px" }} /> Skapa Projekt
                </button>

                <span className="label">Projekt:</span>
                <select className="dropdown" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <span className="label">Testare:</span>
                <select className="dropdown" value={form.Testare} onChange={e => setForm({ ...form, Testare: e.target.value })}>
                    <option value="">Select Tester</option>
                    {testers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {activeTab === "newTest" && (
                <div className="tab-container blue-tab">
                    <NewTestForm form={form} setForm={setForm} handleSubmit={handleSubmit} isFormValid={isFormValid} />
                </div>
            )}
            {activeTab === "addProject" && (
                <div className="tab-container green-tab">
                    <AddProjectForm newProjectName={newProjectName} setNewProjectName={setNewProjectName} handleAddProject={handleAddProject} />
                </div>
            )}
            {activeTab === "addAnalys" && analysRow && (
                <div className="tab-container yellow-tab">
                    <AddAnalysForm
                        row={analysRow}
                        analysText={analysText}
                        setAnalysText={setAnalysText}
                        handleSaveAnalys={handleSaveAnalys}
                        cancel={() => { setActiveTab(""); setAnalysRow(null); }}
                    />
                </div>
            )}

            {copied && <div className="copy-toast">Kopierat!</div>}

            <div className="table-container">
                <table>
                    <thead>
                    <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan={columns.length} className="center">Loading data...</td></tr>
                    ) : data.length > 0 ? (
                        data.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                                {columns.map(col => (
                                    <td key={col}>
                                        {col === "ANALYS" ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span>{row[col] ?? row[col.toLowerCase()] ?? ""}</span>
                                                <Pencil
                                                    size={16}
                                                    className="icon-btn"
                                                    onClick={() => {
                                                        setAnalysRow(row);
                                                        setAnalysText(row.ANALYS ?? "");
                                                        setActiveTab("addAnalys");
                                                    }}
                                                />
                                            </div>
                                        ) : col === "TESTNAMN" ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span>{row[col] ?? row[col.toLowerCase()] ?? ""}</span>
                                                <Copy
                                                    size={16}
                                                    className="icon-btn"
                                                    onClick={() => handleCopy(row[col] ?? row[col.toLowerCase()] ?? "")}
                                                />
                                            </div>
                                        ) : (
                                            row[col] ?? row[col.toLowerCase()] ?? ""
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={columns.length} className="center">No data available</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function NewTestForm({ form, setForm, handleSubmit, isFormValid }) {
    return (
        <div className="form-grid">
            <label>Typ
                <select value={form.Typ} onChange={e => setForm({ ...form, Typ: e.target.value })}>
                    {["Referenstest","Belastningstest","Utmattningstest","Maxtest","Skapa"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </label>
            <label>Testnamn
                <input value={form.Testnamn} onChange={e => setForm({ ...form, Testnamn: e.target.value })}/>
            </label>
            <label>Syfte
                <input value={form.Syfte} onChange={e => setForm({ ...form, Syfte: e.target.value })}/>
            </label>
            <div className="form-actions">
                <button onClick={handleSubmit} disabled={!isFormValid} className={isFormValid ? "btn green" : "btn disabled"}>
                    <Save size={16} style={{ marginRight: "6px" }} /> Save
                </button>
            </div>
        </div>
    );
}

function AddProjectForm({ newProjectName, setNewProjectName, handleAddProject }) {
    return (
        <div className="form-grid">
            <label>Project Name
                <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} />
            </label>
            <div className="form-actions">
                <button onClick={handleAddProject} className="btn green">
                    <PlusCircle size={16} style={{ marginRight: "6px" }} /> Add
                </button>
            </div>
        </div>
    );
}

function AddAnalysForm({ row, analysText, setAnalysText, handleSaveAnalys, cancel }) {
    return (
        <div className="form-grid">
            <label>Analys for {row.TESTNAMN}
                <textarea
                    value={analysText}
                    onChange={e => setAnalysText(e.target.value)}
                    rows={4}
                    style={{ width: "100%" }}
                />
            </label>
            <div className="form-actions">
                <button onClick={handleSaveAnalys} className="btn green">
                    <Save size={16} style={{ marginRight: "6px" }} /> Save
                </button>
                <button onClick={cancel} className="btn red">
                    <XCircle size={16} style={{ marginRight: "6px" }} /> Cancel
                </button>
            </div>
        </div>
    );
}
