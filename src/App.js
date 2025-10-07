import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Pencil, Copy, FilePlus, FolderPlus, Save, XCircle, PlusCircle, Calculator, RefreshCw, Check, Trash2 } from "lucide-react";
import testersData from "./testers.json";
import config from "./config";
import "./App.css";

export default function App() {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(() => {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const projectFromUrl = urlParams.get('project');
        return projectFromUrl || localStorage.getItem('lastProject') || "";
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [form, setForm] = useState(() => {
        const savedTester = localStorage.getItem('lastTester');
        return { Typ: "Referenstest", Testnamn: "", Syfte: "", Testare: savedTester || "Johan" };
    });
    const [newProjectName, setNewProjectName] = useState("");
    const [analysRow, setAnalysRow] = useState(null);
    const [analysText, setAnalysText] = useState("");
    const [copied, setCopied] = useState(false);
    const [testers] = useState(testersData);
    const [kalkyl, setKalkyl] = useState({ reqH: "", reqS: "", vu: "", pacing: "", skript: "" });
    const [generellKonfig, setGenerellKonfig] = useState({ beskrivning: "" });
    const [error, setError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleteTestConfirm, setDeleteTestConfirm] = useState(null);

    const API_BASE = config.API_BASE;

    useEffect(() => {
        if (selectedProject) {
            localStorage.setItem('lastProject', selectedProject);
            // Update URL without reloading the page
            const url = new URL(window.location);
            url.searchParams.set('project', selectedProject);
            window.history.pushState({}, '', url);
        } else {
            // Remove project param if no project selected
            const url = new URL(window.location);
            url.searchParams.delete('project');
            window.history.pushState({}, '', url);
        }
    }, [selectedProject]);

    useEffect(() => {
        if (form.Testare) localStorage.setItem('lastTester', form.Testare);
    }, [form.Testare]);

    useEffect(() => {
        fetch(`${API_BASE}/populate`)
            .then(res => res.json())
            .then(json => Array.isArray(json) ? setProjects(json) : setProjects([]))
            .catch(err => {
                console.error("Failed to load projects", err);
                setError("Failed to load projects");
            });
    }, [API_BASE]);

    const refreshData = useCallback(() => {
        if (!selectedProject) return Promise.resolve();
        setLoading(true);
        setError("");

        return fetch(`${API_BASE}/getData?projekt=${encodeURIComponent(selectedProject)}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(rawData => {
                const formatted = rawData.map(item => {
                    const d = new Date(item.DATUM || item.Datum);
                    const dateStr = d.toISOString().split("T")[0];
                    const timeStr = d.toTimeString().slice(0, 5);
                    return { ...item, DATUM: `${dateStr} ${timeStr}` };
                });
                setData(formatted);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setError("Failed to load project data");
            })
            .finally(() => setLoading(false));
    }, [selectedProject, API_BASE]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const handleSubmit = useCallback(async () => {
        if (!form.Testnamn.trim() || !form.Syfte.trim() || !selectedProject) return;

        setError("");
        const payload = {
            Datum: new Date().toISOString(),
            ...form,
            Projekt: selectedProject
        };

        try {
            const res = await fetch(`${API_BASE}/insert`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Insert failed");

            setForm(prev => ({
                Typ: "Referenstest",
                Testnamn: "",
                Syfte: "",
                Testare: prev.Testare
            }));
            setActiveTab("");
            await refreshData();
        } catch (err) {
            console.error("Insert error:", err);
            setError("Failed to create test");
        }
    }, [form, selectedProject, API_BASE, refreshData]);

    const handleAddProject = useCallback(async () => {
        const trimmedName = newProjectName.trim();
        if (!trimmedName) return;

        if (projects.includes(trimmedName)) {
            setError("Project already exists");
            return;
        }

        setError("");
        try {
            const res = await fetch(`${API_BASE}/createProject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Projekt: trimmedName })
            });

            if (!res.ok) throw new Error("Create project failed");

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            setProjects(Array.isArray(json) ? json : []);
            setNewProjectName("");
            setActiveTab("");
            setSelectedProject(trimmedName);
        } catch (err) {
            console.error("Add project error:", err);
            setError("Failed to create project");
        }
    }, [newProjectName, projects, API_BASE]);

    const handleSaveAnalys = useCallback(async () => {
        if (!analysRow) return;

        setError("");
        const payload = {
            Projekt: analysRow.PROJEKT ?? analysRow.projekt,
            Testnamn: analysRow.TESTNAMN ?? analysRow.testnamn,
            Analys: analysText.trim()
        };

        try {
            const res = await fetch(`${API_BASE}/updateAnalys`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Update failed");

            setAnalysRow(null);
            setAnalysText("");
            setActiveTab("");
            await refreshData();
        } catch (err) {
            console.error("UpdateAnalys error:", err);
            setError("Failed to update analysis");
        }
    }, [analysRow, analysText, API_BASE, refreshData]);

    const handleCopy = useCallback((text) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error("Copy failed:", err);
            setError("Failed to copy to clipboard");
        });
    }, []);

    const calculatedKalkyl = useMemo(() => {
        const reqH = Number(kalkyl.reqH) || 0;
        const vu = Number(kalkyl.vu) || 0;
        const reqS = reqH ? (reqH / 3600).toFixed(2) : "";
        const pacing = (reqH && vu) ? (reqH / vu).toFixed(2) : "";
        return { ...kalkyl, reqS, pacing };
    }, [kalkyl]);

    const handleAddKonfig = useCallback(async () => {
        const reqH = Number(kalkyl.reqH);
        const vu = Number(kalkyl.vu);

        if (!reqH || !vu || !selectedProject) {
            setError("Please fill in required fields (Req/h and Antal Vu)");
            return;
        }

        setError("");
        const newRow = {
            TESTNAMN: "PACING",
            REQH: kalkyl.reqH,
            REQS: calculatedKalkyl.reqS,
            VU: kalkyl.vu,
            PACING: calculatedKalkyl.pacing,
            SKRIPT: kalkyl.skript || "",
            PROJEKT: selectedProject,
            TESTARE: form.Testare
        };

        try {
            const res = await fetch(`${API_BASE}/addKonfig`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRow)
            });

            if (!res.ok) throw new Error("Add konfig failed");

            setKalkyl({ reqH: "", reqS: "", vu: "", pacing: "", skript: "" });
            setActiveTab("");
            await refreshData();
        } catch (err) {
            console.error("AddKonfig error:", err);
            setError("Failed to add configuration");
        }
    }, [kalkyl, calculatedKalkyl, selectedProject, form.Testare, API_BASE, refreshData]);

    const handleAddGenerellKonfig = useCallback(async () => {
        if (!generellKonfig.beskrivning.trim() || !selectedProject) {
            setError("Vänligen fyll i beskrivning");
            return;
        }

        setError("");
        const payload = {
            BESKRIVNING: generellKonfig.beskrivning.trim(),
            PROJEKT: selectedProject,
            TESTARE: form.Testare
        };

        try {
            const res = await fetch(`${API_BASE}/addGenerellKonfig`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Add generell konfig failed");

            setGenerellKonfig({ beskrivning: "" });
            setActiveTab("");
            await refreshData();
        } catch (err) {
            console.error("AddGenerellKonfig error:", err);
            setError("Failed to add generell konfig");
        }
    }, [generellKonfig, selectedProject, form.Testare, API_BASE, refreshData]);

    const handleDeleteProject = useCallback(async (projectName) => {
        setError("");

        try {
            const res = await fetch(`${API_BASE}/deleteProject`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Projekt: projectName })
            });

            if (!res.ok) throw new Error("Delete project failed");

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            setProjects(Array.isArray(json) ? json : []);

            if (selectedProject === projectName) {
                setSelectedProject("");
                setData([]);
            }

            setDeleteConfirm(null);
        } catch (err) {
            console.error("Delete project error:", err);
            setError("Failed to delete project");
        }
    }, [API_BASE, selectedProject]);

    const handleDeleteTest = useCallback(async (projekt, testnamn) => {
        setError("");

        try {
            const res = await fetch(`${API_BASE}/deleteTest`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Projekt: projekt, Testnamn: testnamn })
            });

            if (!res.ok) throw new Error("Delete test failed");

            setDeleteTestConfirm(null);
            await refreshData();
        } catch (err) {
            console.error("Delete test error:", err);
            setError("Failed to delete test");
        }
    }, [API_BASE, refreshData]);

    const renderAnalysText = useCallback((text) => {
        if (!text) return "";
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        return parts.map((part, idx) =>
            urlRegex.test(part)
                ? <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="analys-link">{part}</a>
                : part
        );
    }, []);

    const columns = ["DATUM", "TYP", "TESTNAMN", "SYFTE", "ANALYS", "TESTARE", "ÅTGÄRD"];
    const isFormValid = form.Testnamn.trim() && form.Syfte.trim() && selectedProject;

    return (
        <div className="app-container">
            <div className="header-row">
                <button
                    onClick={() => setActiveTab(activeTab === "newTest" ? "" : "newTest")}
                    className={`btn blue ${activeTab === "newTest" ? "active" : ""}`}
                >
                    <FilePlus size={16} /> Nytt Test
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === "addProject" ? "" : "addProject")}
                    className={`btn green ${activeTab === "addProject" ? "active" : ""}`}
                >
                    <FolderPlus size={16} /> Skapa Projekt
                </button>

                <div className="select-group">
                    <span className="label">Projekt:</span>
                    <select
                        className="dropdown"
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                        disabled={!projects.length}
                    >
                        <option value="">Välj Projekt</option>
                        {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {selectedProject && (
                        <>
                            <Copy
                                size={18}
                                className="icon-btn"
                                onClick={() => handleCopy(window.location.href)}
                                title="Kopiera länk till projekt"
                            />
                            <Trash2
                                size={18}
                                className="icon-btn delete-btn"
                                onClick={() => setDeleteConfirm(selectedProject)}
                                title="Radera projekt"
                            />
                        </>
                    )}
                </div>

                <div className="select-group">
                    <span className="label">Testare:</span>
                    <select
                        className="dropdown"
                        value={form.Testare}
                        onChange={e => setForm({ ...form, Testare: e.target.value })}
                    >
                        <option value="">Välj Testare</option>
                        {testers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => setActiveTab(activeTab === "konfig" ? "" : "konfig")}
                    className={`btn red ${activeTab === "konfig" ? "active" : ""}`}
                >
                    <Calculator size={16} /> Beräkna Pacing
                </button>

                <button
                    onClick={() => setActiveTab(activeTab === "generellKonfig" ? "" : "generellKonfig")}
                    className={`btn red ${activeTab === "generellKonfig" ? "active" : ""}`}
                >
                    <PlusCircle size={16} /> Generell Konfig
                </button>

                {selectedProject && (
                    <button onClick={refreshData} className="btn gray" disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spinning" : ""} /> Uppdatera
                    </button>
                )}
            </div>

            {error && (
                <div className="error-banner">
                    <XCircle size={16} />
                    <span>{error}</span>
                    <button onClick={() => setError("")} className="close-btn">×</button>
                </div>
            )}

            {activeTab === "newTest" && (
                <NewTestForm
                    form={form}
                    setForm={setForm}
                    handleSubmit={handleSubmit}
                    isFormValid={isFormValid}
                    onCancel={() => setActiveTab("")}
                />
            )}

            {activeTab === "addProject" && (
                <AddProjectForm
                    newProjectName={newProjectName}
                    setNewProjectName={setNewProjectName}
                    handleAddProject={handleAddProject}
                    onCancel={() => setActiveTab("")}
                />
            )}

            {activeTab === "addAnalys" && analysRow && (
                <AddAnalysForm
                    row={analysRow}
                    analysText={analysText}
                    setAnalysText={setAnalysText}
                    handleSaveAnalys={handleSaveAnalys}
                    cancel={() => {
                        setActiveTab("");
                        setAnalysRow(null);
                        setAnalysText("");
                    }}
                />
            )}

            {activeTab === "konfig" && (
                <KonfigForm
                    kalkyl={calculatedKalkyl}
                    setKalkyl={setKalkyl}
                    handleCopy={handleCopy}
                    handleAddKonfig={handleAddKonfig}
                    onCancel={() => setActiveTab("")}
                />
            )}

            {activeTab === "generellKonfig" && (
                <GenerellKonfigForm
                    generellKonfig={generellKonfig}
                    setGenerellKonfig={setGenerellKonfig}
                    handleAddGenerellKonfig={handleAddGenerellKonfig}
                    onCancel={() => setActiveTab("")}
                />
            )}

            {copied && (
                <div className="copy-toast">
                    <Check size={16} /> Kopierat!
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Radera Projekt?</h3>
                        <p>Är du säker på att du vill radera <strong>{deleteConfirm}</strong>?</p>
                        <p className="warning-text">Detta kommer att radera alla tester i projektet. Denna åtgärd kan inte ångras.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteConfirm(null)} className="btn gray">
                                <XCircle size={16} /> Avbryt
                            </button>
                            <button onClick={() => handleDeleteProject(deleteConfirm)} className="btn red">
                                <Trash2 size={16} /> Radera Projekt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTestConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteTestConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Radera Test?</h3>
                        <p>Är du säker på att du vill radera testet <strong>{deleteTestConfirm.TESTNAMN ?? deleteTestConfirm.testnamn}</strong>?</p>
                        <p className="warning-text">Denna åtgärd kan inte ångras.</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteTestConfirm(null)} className="btn gray">
                                <XCircle size={16} /> Avbryt
                            </button>
                            <button
                                onClick={() => handleDeleteTest(
                                    deleteTestConfirm.PROJEKT ?? deleteTestConfirm.projekt ?? selectedProject,
                                    deleteTestConfirm.TESTNAMN ?? deleteTestConfirm.testnamn
                                )}
                                className="btn red"
                            >
                                <Trash2 size={16} /> Radera Test
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                {!selectedProject ? (
                    <div className="empty-state">
                        <FolderPlus size={48} />
                        <h3>Välj ett projekt för att komma igång</h3>
                        <p>Skapa ett nytt projekt eller välj ett befintligt från listan ovan</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                        <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="center">
                                    <div className="loading-spinner" />
                                    Laddar data...
                                </td>
                            </tr>
                        ) : data.length ? (
                            data.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                                    {columns.map(col => (
                                        <td key={col}>
                                            {col === "ANALYS" ? (
                                                <div className="cell-with-action">
                                                    <span className="analys-text">
                                                        {renderAnalysText(row[col] ?? row[col.toLowerCase()] ?? "")}
                                                    </span>
                                                    <Pencil
                                                        size={16}
                                                        className="icon-btn"
                                                        onClick={() => {
                                                            setAnalysRow(row);
                                                            setAnalysText(row.ANALYS ?? row.analys ?? "");
                                                            setActiveTab("addAnalys");
                                                        }}
                                                    />
                                                </div>
                                            ) : col === "TESTNAMN" ? (
                                                <div className="cell-with-action">
                                                    <span>{row[col] ?? row[col.toLowerCase()] ?? ""}</span>
                                                    <Copy
                                                        size={16}
                                                        className="icon-btn"
                                                        onClick={() => handleCopy(row[col] ?? row[col.toLowerCase()] ?? "")}
                                                    />
                                                </div>
                                            ) : col === "ÅTGÄRD" ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Trash2
                                                        size={18}
                                                        className="icon-btn delete-btn"
                                                        onClick={() => setDeleteTestConfirm(row)}
                                                        title="Radera test"
                                                        style={{ cursor: 'pointer' }}
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
                            <tr>
                                <td colSpan={columns.length} className="center empty-state-row">
                                    <FilePlus size={32} />
                                    <p>Inga tester ännu. Skapa ditt första test!</p>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function NewTestForm({ form, setForm, handleSubmit, isFormValid, onCancel }) {
    return (
        <div className="form-grid">
            <label>
                Typ
                <select value={form.Typ} onChange={e => setForm({ ...form, Typ: e.target.value })}>
                    {["Referenstest","Verifikationstest","Belastningstest","Utmattningstest","Maxtest","Skapa"].map(t =>
                        <option key={t} value={t}>{t}</option>
                    )}
                </select>
            </label>
            <label>
                Testnamn *
                <input
                    value={form.Testnamn}
                    onChange={e => setForm({ ...form, Testnamn: e.target.value })}
                    placeholder="Ange testnamn"
                />
            </label>
            <label>
                Syfte *
                <input
                    value={form.Syfte}
                    onChange={e => setForm({ ...form, Syfte: e.target.value })}
                    placeholder="Beskriv testets syfte"
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> Avbryt
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={isFormValid ? "btn green" : "btn"}
                >
                    <Save size={16} /> Spara Test
                </button>
            </div>
        </div>
    );
}

function AddProjectForm({ newProjectName, setNewProjectName, handleAddProject, onCancel }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && newProjectName.trim()) {
            handleAddProject();
        }
    };

    return (
        <div className="form-grid">
            <label>
                Projektnamn *
                <input
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ange projektnamn"
                    autoFocus
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> Avbryt
                </button>
                <button
                    onClick={handleAddProject}
                    className="btn green"
                    disabled={!newProjectName.trim()}
                >
                    <PlusCircle size={16} /> Skapa Projekt
                </button>
            </div>
        </div>
    );
}

function AddAnalysForm({ row, analysText, setAnalysText, handleSaveAnalys, cancel }) {
    return (
        <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
                Analys för {row.TESTNAMN ?? row.testnamn}
                <textarea
                    value={analysText}
                    onChange={e => setAnalysText(e.target.value)}
                    rows={4}
                    placeholder="Beskriv analysen..."
                />
            </label>
            <div className="form-actions">
                <button onClick={cancel} className="btn gray">
                    <XCircle size={16} /> Avbryt
                </button>
                <button onClick={handleSaveAnalys} className="btn green">
                    <Save size={16} /> Spara Analys
                </button>
            </div>
        </div>
    );
}

function KonfigForm({ kalkyl, setKalkyl, handleCopy, handleAddKonfig, onCancel }) {
    return (
        <div className="form-grid">
            <label>
                Req/h *
                <input
                    type="number"
                    value={kalkyl.reqH}
                    onChange={e => setKalkyl(prev => ({ ...prev, reqH: e.target.value }))}
                    placeholder="Requests per timme"
                />
            </label>
            <label>
                Req/s (beräknad)
                <input
                    type="text"
                    value={kalkyl.reqS}
                    readOnly
                    style={{ background: '#f5f5f5' }}
                />
            </label>
            <label>
                Antal Vu *
                <input
                    type="number"
                    value={kalkyl.vu}
                    onChange={e => setKalkyl(prev => ({ ...prev, vu: e.target.value }))}
                    placeholder="Antal virtuella användare"
                />
            </label>
            <label>
                Pacing (beräknad)
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        value={kalkyl.pacing}
                        readOnly
                        style={{ background: '#f5f5f5', flex: 1 }}
                    />
                    {kalkyl.pacing && (
                        <Copy
                            size={16}
                            className="icon-btn"
                            onClick={() => handleCopy(kalkyl.pacing)}
                        />
                    )}
                </div>
            </label>
            <label>
                Skript
                <input
                    value={kalkyl.skript}
                    onChange={e => setKalkyl(prev => ({ ...prev, skript: e.target.value }))}
                    placeholder="Skriptnamn (valfritt)"
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> Avbryt
                </button>
                <button
                    onClick={handleAddKonfig}
                    className="btn green"
                    disabled={!kalkyl.reqH || !kalkyl.vu}
                >
                    <FilePlus size={16} /> Lägg till KONFIG
                </button>
            </div>
        </div>
    );
}

function GenerellKonfigForm({ generellKonfig, setGenerellKonfig, handleAddGenerellKonfig, onCancel }) {
    return (
        <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
                Konfigurationsbeskrivning *
                <textarea
                    value={generellKonfig.beskrivning}
                    onChange={e => setGenerellKonfig({ beskrivning: e.target.value })}
                    rows={4}
                    placeholder="Beskriv konfigurationen (t.ex. Applikationsserver: Tomcat 9.0.45, JVM: OpenJDK 11, Memory: 4GB)"
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> Avbryt
                </button>
                <button
                    onClick={handleAddGenerellKonfig}
                    className="btn green"
                    disabled={!generellKonfig.beskrivning.trim()}
                >
                    <FilePlus size={16} /> Lägg till Konfig
                </button>
            </div>
        </div>
    );
}