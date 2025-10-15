import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Pencil, Copy, FilePlus, FolderPlus, Save, XCircle, PlusCircle, Calculator, RefreshCw, Check, Trash2, Archive, Server, CheckCircle, XCircleIcon, Database, Github } from "lucide-react";
import testersData from "./testers.json";
import config from "./config";
import translations from "./translations";
import "./App.css";

export default function App() {
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const projectFromUrl = urlParams.get('project');
        return projectFromUrl || localStorage.getItem('lastProject') || "";
    });
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("");
    const [form, setForm] = useState(() => {
        const savedTester = localStorage.getItem('lastTester');
        return { Typ: "reference", Testnamn: "", Syfte: "", Testare: savedTester || "Johan" };
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
    const [archiveConfirm, setArchiveConfirm] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedProjects, setArchivedProjects] = useState([]);
    const [selectedArchivedProject, setSelectedArchivedProject] = useState("");
    const [archivedData, setArchivedData] = useState([]);
    const [loadingArchived, setLoadingArchived] = useState(false);
    const [dbInfo, setDbInfo] = useState(null);
    const [backendStatus, setBackendStatus] = useState("checking");

    const t = translations[language];
    const API_BASE = config.API_BASE;

    const languageOptions = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'da', name: 'Dansk', flag: '🇩🇰' },
        { code: 'no', name: 'Norsk', flag: '🇳🇴' },
        { code: 'fi', name: 'Suomi', flag: '🇫🇮' }
    ];

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const response = await fetch(`${API_BASE}/healthcheck`, {
                    method: "GET",
                    signal: AbortSignal.timeout(3000)
                });
                if (response.ok) {
                    setBackendStatus("online");
                } else {
                    setBackendStatus("offline");
                }
            } catch (error) {
                setBackendStatus("offline");
            }
        };

        checkBackend();
        const interval = setInterval(checkBackend, 30000);
        return () => clearInterval(interval);
    }, [API_BASE]);

    useEffect(() => {
        fetch(`${API_BASE}/dbinfo`)
            .then(res => res.json())
            .then(info => setDbInfo(info))
            .catch(err => console.error("Failed to load DB info", err));
    }, [API_BASE]);

    useEffect(() => {
        if (selectedProject) {
            localStorage.setItem('lastProject', selectedProject);
            const url = new URL(window.location);
            url.searchParams.set('project', selectedProject);
            window.history.pushState({}, '', url);
        } else {
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

        fetch(`${API_BASE}/populateArkiverade`)
            .then(res => res.json())
            .then(json => Array.isArray(json) ? setArchivedProjects(json) : setArchivedProjects([]))
            .catch(err => console.error("Failed to load archived projects count", err));
    }, [API_BASE]);

    const fetchArchivedProjects = useCallback(() => {
        fetch(`${API_BASE}/populateArkiverade`)
            .then(res => res.json())
            .then(json => Array.isArray(json) ? setArchivedProjects(json) : setArchivedProjects([]))
            .catch(err => {
                console.error("Failed to load archived projects", err);
                setError("Failed to load archived projects");
            });
    }, [API_BASE]);

    useEffect(() => {
        if (showArchived) {
            fetchArchivedProjects();
        }
    }, [showArchived, fetchArchivedProjects]);

    const refreshArchivedData = useCallback(() => {
        if (!selectedArchivedProject) return Promise.resolve();
        setLoadingArchived(true);
        setError("");

        return fetch(`${API_BASE}/getData?projekt=${encodeURIComponent(selectedArchivedProject)}`)
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
                setArchivedData(formatted);
            })
            .catch(err => {
                console.error("Failed to load archived data", err);
                setError("Failed to load archived project data");
            })
            .finally(() => setLoadingArchived(false));
    }, [selectedArchivedProject, API_BASE]);

    useEffect(() => {
        if (showArchived) {
            refreshArchivedData();
        }
    }, [showArchived, refreshArchivedData]);

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
                Typ: "reference",
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

            await new Promise(resolve => setTimeout(resolve, 200));

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            const projectsList = Array.isArray(json) ? json : [];
            setProjects(projectsList);

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
        const reqS = Number(kalkyl.reqS) || 0;
        const vu = Number(kalkyl.vu) || 0;

        let calculatedReqH = reqH;
        let calculatedReqS = reqS;
        let pacing = "";

        if (reqH > 0 && kalkyl.reqH) {
            calculatedReqS = parseFloat((reqH / 3600).toFixed(4));
        } else if (reqS > 0 && kalkyl.reqS) {
            calculatedReqH = parseFloat((reqS * 3600).toFixed(2));
        }

        const finalReqS = calculatedReqS || reqS;
        if (finalReqS > 0 && vu > 0) {
            pacing = (vu / finalReqS).toFixed(2);
        }

        return {
            ...kalkyl,
            reqH: calculatedReqH.toString() || kalkyl.reqH,
            reqS: calculatedReqS.toString() || kalkyl.reqS,
            pacing
        };
    }, [kalkyl]);

    const handleAddKonfig = useCallback(async () => {
        const reqH = Number(kalkyl.reqH) || (Number(kalkyl.reqS) * 3600);
        const vu = Number(kalkyl.vu);

        if ((!kalkyl.reqH && !kalkyl.reqS) || !vu || !selectedProject) {
            setError(t.fillReqAndVu);
            return;
        }

        setError("");
        const newRow = {
            TESTNAMN: t.pacingTestName,
            REQH: reqH.toString(),
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
    }, [kalkyl, calculatedKalkyl, selectedProject, form.Testare, API_BASE, refreshData, t.fillReqAndVu, t.pacingTestName]);

    const handleAddGenerellKonfig = useCallback(async () => {
        if (!generellKonfig.beskrivning.trim() || !selectedProject) {
            setError(t.fillDescription);
            return;
        }

        setError("");
        const payload = {
            BESKRIVNING: generellKonfig.beskrivning.trim(),
            PROJEKT: selectedProject,
            TESTARE: form.Testare,
            TESTNAMN: t.configTestName
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
    }, [generellKonfig, selectedProject, form.Testare, API_BASE, refreshData, t.fillDescription, t.configTestName]);

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

            if (showArchived) {
                fetchArchivedProjects();
            }

            if (selectedProject === projectName) {
                setSelectedProject("");
                setData([]);
            }

            if (selectedArchivedProject === projectName) {
                setSelectedArchivedProject("");
                setArchivedData([]);
            }

            setDeleteConfirm(null);
        } catch (err) {
            console.error("Delete project error:", err);
            setError("Failed to delete project");
        }
    }, [API_BASE, selectedProject, selectedArchivedProject, showArchived, fetchArchivedProjects]);

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

    const handleArchiveProject = useCallback(async (projectName) => {
        setError("");

        try {
            const res = await fetch(`${API_BASE}/arkivera?namn=${encodeURIComponent(projectName)}`, {
                method: "POST"
            });

            if (!res.ok) throw new Error("Archive project failed");

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            setProjects(Array.isArray(json) ? json : []);

            if (selectedProject === projectName) {
                setSelectedProject("");
                setData([]);
            }

            setArchiveConfirm(null);

            if (showArchived) {
                fetchArchivedProjects();
            }
        } catch (err) {
            console.error("Archive project error:", err);
            setError("Failed to archive project");
        }
    }, [API_BASE, selectedProject, showArchived, fetchArchivedProjects]);

    const handleRestoreProject = useCallback(async (projectName) => {
        setError("");

        try {
            const res = await fetch(`${API_BASE}/restore?namn=${encodeURIComponent(projectName)}`, {
                method: "POST"
            });

            if (!res.ok) throw new Error("Restore project failed");

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            setProjects(Array.isArray(json) ? json : []);

            fetchArchivedProjects();

            if (selectedArchivedProject === projectName) {
                setSelectedArchivedProject("");
                setArchivedData([]);
            }
        } catch (err) {
            console.error("Restore project error:", err);
            setError("Failed to restore project");
        }
    }, [API_BASE, selectedArchivedProject, fetchArchivedProjects]);

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

    const columns = [t.date, t.colType, t.colTestName, t.colPurpose, t.colAnalysis, t.colTester, t.action];
    const isFormValid = form.Testnamn.trim() && form.Syfte.trim() && selectedProject;

    return (
        <div className="app-container">
            <div className="header-row">
                <div className="select-group">
                    <select
                        className="dropdown"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{minWidth: '70px'}}
                    >
                        {languageOptions.map(lang => (
                            <option key={lang.code} value={lang.code}>
                                {lang.code.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setActiveTab(activeTab === "newTest" ? "" : "newTest")}
                    className={`btn blue ${activeTab === "newTest" ? "active" : ""}`}
                >
                    <FilePlus size={16}/> {t.newTest}
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === "addProject" ? "" : "addProject")}
                    className={`btn green ${activeTab === "addProject" ? "active" : ""}`}
                >
                    <FolderPlus size={16}/> {t.createProject}
                </button>

                <div className="select-group">
                    <span className="label">{t.project}:</span>
                    <select
                        className="dropdown"
                        value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}
                        disabled={!projects.length}
                    >
                        <option value="">{t.selectProject}</option>
                        {projects.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {selectedProject && (
                        <Archive
                            size={18}
                            className="icon-btn"
                            onClick={() => setArchiveConfirm(selectedProject)}
                            title={t.archiveProjectBtn}
                            style={{color: '#ff8c00', cursor: 'pointer'}}
                        />
                    )}
                </div>

                <div className="select-group">
                    <span className="label">{t.tester}:</span>
                    <select
                        className="dropdown"
                        value={form.Testare}
                        onChange={e => setForm({...form, Testare: e.target.value})}
                    >
                        <option value="">{t.selectTester}</option>
                        {testers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <button
                    onClick={() => setActiveTab(activeTab === "konfig" ? "" : "konfig")}
                    className={`btn red ${activeTab === "konfig" ? "active" : ""}`}
                >
                    <Calculator size={16}/> {t.calculatePacing}
                </button>

                <button
                    onClick={() => setActiveTab(activeTab === "generellKonfig" ? "" : "generellKonfig")}
                    className={`btn red ${activeTab === "generellKonfig" ? "active" : ""}`}
                >
                    <PlusCircle size={16}/> {t.generalConfig}
                </button>

                {selectedProject && (
                    <button onClick={refreshData} className="btn gray" disabled={loading}>
                        <RefreshCw size={16} className={loading ? "spinning" : ""}/> {t.refresh}
                    </button>
                )}

                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`btn purple ${showArchived ? "active" : ""}`}
                >
                    <Archive size={16}/> {t.showArchived} ({archivedProjects.length})
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <XCircle size={16}/>
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
                    t={t}
                    language={language}
                />
            )}

            {activeTab === "addProject" && (
                <AddProjectForm
                    newProjectName={newProjectName}
                    setNewProjectName={setNewProjectName}
                    handleAddProject={handleAddProject}
                    onCancel={() => setActiveTab("")}
                    t={t}
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
                    t={t}
                />
            )}

            {activeTab === "konfig" && (
                <KonfigForm
                    kalkyl={calculatedKalkyl}
                    setKalkyl={setKalkyl}
                    handleCopy={handleCopy}
                    handleAddKonfig={handleAddKonfig}
                    onCancel={() => setActiveTab("")}
                    t={t}
                />
            )}

            {activeTab === "generellKonfig" && (
                <GenerellKonfigForm
                    generellKonfig={generellKonfig}
                    setGenerellKonfig={setGenerellKonfig}
                    handleAddGenerellKonfig={handleAddGenerellKonfig}
                    onCancel={() => setActiveTab("")}
                    t={t}
                />
            )}

            {copied && (
                <div className="copy-toast">
                    <Check size={16} /> {t.copied}
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{t.deleteProject}?</h3>
                        <p>{t.deleteProjectConfirm} <strong>{deleteConfirm}</strong>?</p>
                        <p className="warning-text">{t.deleteProjectWarning}</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteConfirm(null)} className="btn gray">
                                <XCircle size={16} /> {t.cancel}
                            </button>
                            <button onClick={() => handleDeleteProject(deleteConfirm)} className="btn red">
                                <Trash2 size={16} /> {t.deleteProject}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteTestConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteTestConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{t.deleteTest}?</h3>
                        <p>{t.deleteTestConfirm} <strong>{deleteTestConfirm.TESTNAMN ?? deleteTestConfirm.testnamn}</strong>?</p>
                        <p className="warning-text">{t.deleteTestWarning}</p>
                        <div className="modal-actions">
                            <button onClick={() => setDeleteTestConfirm(null)} className="btn gray">
                                <XCircle size={16} /> {t.cancel}
                            </button>
                            <button
                                onClick={() => handleDeleteTest(
                                    deleteTestConfirm.PROJEKT ?? deleteTestConfirm.projekt ?? selectedProject,
                                    deleteTestConfirm.TESTNAMN ?? deleteTestConfirm.testnamn
                                )}
                                className="btn red"
                            >
                                <Trash2 size={16} /> {t.deleteTest}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {archiveConfirm && (
                <div className="modal-overlay" onClick={() => setArchiveConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{t.archiveProject}?</h3>
                        <p>{t.archiveProjectConfirm} <strong>{archiveConfirm}</strong>?</p>
                        <p className="warning-text" style={{color: '#ff8c00'}}>{t.archiveProjectWarning}</p>
                        <div className="modal-actions">
                            <button onClick={() => setArchiveConfirm(null)} className="btn gray">
                                <XCircle size={16} /> {t.cancel}
                            </button>
                            <button onClick={() => handleArchiveProject(archiveConfirm)} className="btn orange">
                                <Archive size={16} /> {t.archiveProject}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="table-container">
                {showArchived ? (
                    <>
                        <div className="header-row" style={{marginBottom: '20px'}}>
                            <h2 style={{margin: 0}}>{t.showArchived}</h2>
                            <div className="select-group">
                                <span className="label">{t.project}:</span>
                                <select
                                    className="dropdown"
                                    value={selectedArchivedProject}
                                    onChange={e => setSelectedArchivedProject(e.target.value)}
                                    disabled={!archivedProjects.length}
                                >
                                    <option value="">{t.selectProject}</option>
                                    {archivedProjects.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                {selectedArchivedProject && (
                                    <>
                                        <button
                                            onClick={() => handleRestoreProject(selectedArchivedProject)}
                                            className="btn green"
                                            style={{marginLeft: '8px', padding: '4px 12px', fontSize: '14px'}}
                                            title={t.restoreProjectBtn}
                                        >
                                            <RefreshCw size={14} /> {t.restoreProject}
                                        </button>
                                        <Trash2
                                            size={18}
                                            className="icon-btn delete-btn"
                                            onClick={() => setDeleteConfirm(selectedArchivedProject)}
                                            title={t.deleteProjectBtn}
                                        />
                                    </>
                                )}
                            </div>
                            {selectedArchivedProject && (
                                <button onClick={refreshArchivedData} className="btn gray" disabled={loadingArchived}>
                                    <RefreshCw size={16} className={loadingArchived ? "spinning" : ""} /> {t.refresh}
                                </button>
                            )}
                        </div>

                        {!selectedArchivedProject ? (
                            <div className="empty-state">
                                <Archive size={48} />
                                <h3>{archivedProjects.length === 0 ? t.noArchivedProjects : t.selectArchivedProject}</h3>
                                {archivedProjects.length > 0 && <p>{t.createOrSelect}</p>}
                            </div>
                        ) : (
                            <table>
                                <thead>
                                <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                                </thead>
                                <tbody>
                                {loadingArchived ? (
                                    <tr>
                                        <td colSpan={columns.length} className="center">
                                            <div className="loading-spinner" />
                                            {t.loadingData}
                                        </td>
                                    </tr>
                                ) : archivedData.length ? (
                                    archivedData.map((row, i) => (
                                        <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                                            {columns.map(col => {
                                                let dbCol;
                                                if (col === t.date) dbCol = "DATUM";
                                                else if (col === t.action) dbCol = "ÅTGÄRD";
                                                else if (col === t.colType) dbCol = "TYP";
                                                else if (col === t.colTestName) dbCol = "TESTNAMN";
                                                else if (col === t.colPurpose) dbCol = "SYFTE";
                                                else if (col === t.colAnalysis) dbCol = "ANALYS";
                                                else if (col === t.colTester) dbCol = "TESTARE";
                                                else dbCol = col;

                                                return (
                                                    <td key={col}>
                                                        {dbCol === "ÅTGÄRD" ? (
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <Trash2
                                                                    size={18}
                                                                    className="icon-btn delete-btn"
                                                                    onClick={() => setDeleteTestConfirm(row)}
                                                                    title={t.deleteTestBtn}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </div>
                                                        ) : dbCol === "ANALYS" ? (
                                                            <div className="cell-with-action">
                                                                <span className="analys-text">
                                                                    {renderAnalysText(row[dbCol] ?? row[dbCol.toLowerCase()] ?? "")}
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
                                                        ) : dbCol === "TESTNAMN" ? (
                                                            <div className="cell-with-action">
                                                                <span>{row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""}</span>
                                                                <Copy
                                                                    size={16}
                                                                    className="icon-btn"
                                                                    onClick={() => handleCopy(row[dbCol] ?? row[dbCol.toLowerCase()] ?? "")}
                                                                />
                                                            </div>
                                                        ) : (
                                                            row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={columns.length} className="center empty-state-row">
                                            <FilePlus size={32} />
                                            <p>{t.noTestsYet}</p>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        )}
                    </>
                ) : !selectedProject ? (
                    <div className="empty-state">
                        <FolderPlus size={48} />
                        <h3>{t.selectProjectToStart}</h3>
                        <p>{t.createOrSelect}</p>
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
                                    {t.loadingData}
                                </td>
                            </tr>
                        ) : data.length ? (
                            data.map((row, i) => (
                                <tr key={i} className={i % 2 === 0 ? "even" : "odd"}>
                                    {columns.map(col => {
                                        let dbCol;
                                        if (col === t.date) dbCol = "DATUM";
                                        else if (col === t.action) dbCol = "ÅTGÄRD";
                                        else if (col === t.colType) dbCol = "TYP";
                                        else if (col === t.colTestName) dbCol = "TESTNAMN";
                                        else if (col === t.colPurpose) dbCol = "SYFTE";
                                        else if (col === t.colAnalysis) dbCol = "ANALYS";
                                        else if (col === t.colTester) dbCol = "TESTARE";
                                        else dbCol = col;

                                        return (
                                            <td key={col}>
                                                {dbCol === "ÅTGÄRD" ? (
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Trash2
                                                            size={18}
                                                            className="icon-btn delete-btn"
                                                            onClick={() => setDeleteTestConfirm(row)}
                                                            title={t.deleteTestBtn}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    </div>
                                                ) : dbCol === "ANALYS" ? (
                                                    <div className="cell-with-action">
                                                        <span className="analys-text">
                                                            {renderAnalysText(row[dbCol] ?? row[dbCol.toLowerCase()] ?? "")}
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
                                                ) : dbCol === "TESTNAMN" ? (
                                                    <div className="cell-with-action">
                                                        <span>{row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""}</span>
                                                        <Copy
                                                            size={16}
                                                            className="icon-btn"
                                                            onClick={() => handleCopy(row[dbCol] ?? row[dbCol.toLowerCase()] ?? "")}
                                                        />
                                                    </div>
                                                ) : (
                                                    row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="center empty-state-row">
                                    <FilePlus size={32} />
                                    <p>{t.noTestsYet}</p>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            <DbInfoFooter dbInfo={dbInfo} apiBase={API_BASE} backendStatus={backendStatus} />
        </div>
    );
}

function NewTestForm({ form, setForm, handleSubmit, isFormValid, onCancel, t, language }) {
    const testTypeOptions = config.testTypes.map(type => ({
        key: type.key,
        label: type[language] || type.en
    }));

    return (
        <div className="form-grid">
            <label>
                {t.type}
                <select value={form.Typ} onChange={e => setForm({ ...form, Typ: e.target.value })}>
                    {testTypeOptions.map(option =>
                        <option key={option.key} value={option.key}>{option.label}</option>
                    )}
                </select>
            </label>
            <label>
                {t.testName} *
                <input
                    value={form.Testnamn}
                    onChange={e => setForm({ ...form, Testnamn: e.target.value })}
                    placeholder={t.enterTestName}
                />
            </label>
            <label>
                {t.purpose} *
                <input
                    value={form.Syfte}
                    onChange={e => setForm({ ...form, Syfte: e.target.value })}
                    placeholder={t.describeTestPurpose}
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={isFormValid ? "btn green" : "btn"}
                >
                    <Save size={16} /> {t.saveTest}
                </button>
            </div>
        </div>
    );
}

function AddProjectForm({ newProjectName, setNewProjectName, handleAddProject, onCancel, t }) {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && newProjectName.trim()) {
            handleAddProject();
        }
    };

    return (
        <div className="form-grid">
            <label>
                {t.projectName} *
                <input
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t.enterProjectName}
                    autoFocus
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button
                    onClick={handleAddProject}
                    className="btn green"
                    disabled={!newProjectName.trim()}
                >
                    <PlusCircle size={16} /> {t.createProject}
                </button>
            </div>
        </div>
    );
}

function AddAnalysForm({ row, analysText, setAnalysText, handleSaveAnalys, cancel, t }) {
    return (
        <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
                {t.analysisFor} {row.TESTNAMN ?? row.testnamn}
                <textarea
                    value={analysText}
                    onChange={e => setAnalysText(e.target.value)}
                    rows={4}
                    placeholder={t.describeAnalysis}
                />
            </label>
            <div className="form-actions">
                <button onClick={cancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button onClick={handleSaveAnalys} className="btn green">
                    <Save size={16} /> {t.saveAnalysis}
                </button>
            </div>
        </div>
    );
}

function KonfigForm({ kalkyl, setKalkyl, handleCopy, handleAddKonfig, onCancel, t }) {
    const displayReqH = kalkyl.reqH || (kalkyl.reqS ? (Number(kalkyl.reqS) * 3600).toFixed(2) : "");
    const displayReqS = kalkyl.reqS || (kalkyl.reqH ? (Number(kalkyl.reqH) / 3600).toFixed(4) : "");

    return (
        <div className="form-grid">
            <label>
                Req/h
                <input
                    type="number"
                    value={displayReqH}
                    onChange={e => setKalkyl(prev => ({ ...prev, reqH: e.target.value, reqS: "" }))}
                    placeholder="Requests per timme"
                />
            </label>
            <label>
                Req/s
                <input
                    type="number"
                    step="0.0001"
                    value={displayReqS}
                    onChange={e => setKalkyl(prev => ({ ...prev, reqS: e.target.value, reqH: "" }))}
                    placeholder="Requests per sekund"
                />
            </label>
            <label>
                {t.numberOfVu} *
                <input
                    type="number"
                    value={kalkyl.vu}
                    onChange={e => setKalkyl(prev => ({ ...prev, vu: e.target.value }))}
                    placeholder={t.virtualUsers}
                />
            </label>
            <label>
                Pacing ({t.calculated})
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                        value={kalkyl.pacing}
                        readOnly
                        style={{ background: '#f5f5f5', flex: 1 }}
                        placeholder={t.calculatedAutomatically}
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
                {t.script}
                <input
                    value={kalkyl.skript}
                    onChange={e => setKalkyl(prev => ({ ...prev, skript: e.target.value }))}
                    placeholder={t.scriptName}
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button
                    onClick={handleAddKonfig}
                    className="btn green"
                    disabled={(!kalkyl.reqH && !kalkyl.reqS) || !kalkyl.vu}
                >
                    <FilePlus size={16} /> {t.addConfig}
                </button>
            </div>
        </div>
    );
}

function GenerellKonfigForm({ generellKonfig, setGenerellKonfig, handleAddGenerellKonfig, onCancel, t }) {
    return (
        <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
                {t.configDescription} *
                <textarea
                    value={generellKonfig.beskrivning}
                    onChange={e => setGenerellKonfig({ beskrivning: e.target.value })}
                    rows={4}
                    placeholder={t.describeConfig}
                />
            </label>
            <div className="form-actions">
                <button onClick={onCancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button
                    onClick={handleAddGenerellKonfig}
                    className="btn green"
                    disabled={!generellKonfig.beskrivning.trim()}
                >
                    <FilePlus size={16} /> {t.addConfigBtn}
                </button>
            </div>
        </div>
    );
}

function DbInfoFooter({ dbInfo, apiBase, backendStatus }) {
    if (!dbInfo) return null;

    return (
        <footer style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '0.875rem',
            color: '#6b7280'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} />
                <span style={{ fontWeight: '500' }}>Backend:</span>
                <a
                    href={apiBase}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontFamily: 'monospace'
                    }}
                >
                    {apiBase}
                </a>
                {backendStatus === "online" && (
                    <CheckCircle size={16} style={{ color: '#10b981' }} title="Backend Online" />
                )}
                {backendStatus === "offline" && (
                    <XCircleIcon size={16} style={{ color: '#ef4444' }} title="Backend Offline" />
                )}
                {backendStatus === "checking" && (
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>checking...</span>
                )}
            </div>

            <span style={{ color: '#d1d5db' }}>•</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={16} />
                <span style={{ fontWeight: '500' }}>Database:</span>
                <span>{dbInfo.type}</span>
            </div>

            {dbInfo.schema && (
                <>
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '500' }}>Schema:</span>
                        <span>{dbInfo.schema}</span>
                    </div>
                </>
            )}

            <span style={{ color: '#d1d5db' }}>•</span>

            <a
                href="https://github.com/ostbergjohan/pt-log-backend"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#6b7280',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#000'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
            >
                <Github size={16} />
                <span>ostbergjohan/pt-log-backend</span>
            </a>

            <span style={{ color: '#d1d5db' }}>•</span>

            <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                Made with ❤️ for performance testers
            </span>
        </footer>
    );
}