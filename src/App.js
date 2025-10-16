import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Pencil, Copy, FilePlus, FolderPlus, Save, XCircle, PlusCircle, Calculator, RefreshCw, Check, Trash2, Archive, Server, CheckCircle, Database, Github, Info, Star } from "lucide-react";
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
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [projectInfo, setProjectInfo] = useState(null);
    const [analysRow, setAnalysRow] = useState(null);
    const [analysText, setAnalysText] = useState("");
    const [syfteRow, setSyfteRow] = useState(null);
    const [syfteText, setSyfteText] = useState("");
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
    const [archivedProjectInfo, setArchivedProjectInfo] = useState(null);
    const [dbInfo, setDbInfo] = useState(null);
    const [backendStatus, setBackendStatus] = useState("checking");
    const [showFormattingHelp, setShowFormattingHelp] = useState(false);
    const [updatingMarkera, setUpdatingMarkera] = useState(null);
    const [santaClicked, setSantaClicked] = useState(0);
    const [showSantaMessage, setShowSantaMessage] = useState(false);

    const isChristmasWeek = useMemo(() => {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const day = now.getDate();
        return month === 11 && day >= 18 && day <= 27; // December 18-27
    }, []);

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

    useEffect(() => {
        if (selectedProject) {
            fetch(`${API_BASE}/getProjectInfo?projekt=${encodeURIComponent(selectedProject)}`)
                .then(res => res.json())
                .then(info => setProjectInfo(info))
                .catch(err => console.error("Failed to load project info", err));
        } else {
            setProjectInfo(null);
        }
    }, [selectedProject, API_BASE]);

    useEffect(() => {
        if (selectedArchivedProject) {
            fetch(`${API_BASE}/getProjectInfo?projekt=${encodeURIComponent(selectedArchivedProject)}`)
                .then(res => res.json())
                .then(info => setArchivedProjectInfo(info))
                .catch(err => console.error("Failed to load archived project info", err));
        } else {
            setArchivedProjectInfo(null);
        }
    }, [selectedArchivedProject, API_BASE]);

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
                console.log("Raw archived data from backend:", rawData);
                const formatted = rawData.map(item => {
                    const d = new Date(item.DATUM || item.Datum);
                    const dateStr = d.toISOString().split("T")[0];
                    const timeStr = d.toTimeString().slice(0, 5);
                    return {
                        ...item,
                        DATUM: `${dateStr} ${timeStr}`,
                        MARKERA: item.MARKERA ?? item.markera ?? 0
                    };
                });
                console.log("Formatted archived data:", formatted);
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
                console.log("Raw data from backend:", rawData);
                const formatted = rawData.map(item => {
                    const d = new Date(item.DATUM || item.Datum);
                    const dateStr = d.toISOString().split("T")[0];
                    const timeStr = d.toTimeString().slice(0, 5);
                    return {
                        ...item,
                        DATUM: `${dateStr} ${timeStr}`,
                        MARKERA: item.MARKERA ?? item.markera ?? 0
                    };
                });
                console.log("Formatted data:", formatted);
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
                body: JSON.stringify({
                    Projekt: trimmedName,
                    Beskrivning: newProjectDescription.trim()
                })
            });

            if (!res.ok) throw new Error("Create project failed");

            await new Promise(resolve => setTimeout(resolve, 200));

            const projectsRes = await fetch(`${API_BASE}/populate`);
            const json = await projectsRes.json();
            const projectsList = Array.isArray(json) ? json : [];
            setProjects(projectsList);

            setNewProjectName("");
            setNewProjectDescription("");
            setActiveTab("");
            setSelectedProject(trimmedName);
        } catch (err) {
            console.error("Add project error:", err);
            setError("Failed to create project");
        }
    }, [newProjectName, newProjectDescription, projects, API_BASE]);

    const handleUpdateProjectDescription = useCallback(async (newDescription) => {
        if (!selectedProject) return;

        setError("");
        try {
            const res = await fetch(`${API_BASE}/updateProjectBeskrivning`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Projekt: selectedProject,
                    Beskrivning: newDescription.trim()
                })
            });

            if (!res.ok) throw new Error("Update failed");

            const infoRes = await fetch(`${API_BASE}/getProjectInfo?projekt=${encodeURIComponent(selectedProject)}`);
            const info = await infoRes.json();
            setProjectInfo(info);
        } catch (err) {
            console.error("Update description error:", err);
            setError("Failed to update project description");
        }
    }, [selectedProject, API_BASE]);

    const handleUpdateArchivedProjectDescription = useCallback(async (newDescription) => {
        if (!selectedArchivedProject) return;

        setError("");
        try {
            const res = await fetch(`${API_BASE}/updateProjectBeskrivning`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Projekt: selectedArchivedProject,
                    Beskrivning: newDescription.trim()
                })
            });

            if (!res.ok) throw new Error("Update failed");

            const infoRes = await fetch(`${API_BASE}/getProjectInfo?projekt=${encodeURIComponent(selectedArchivedProject)}`);
            const info = await infoRes.json();
            setArchivedProjectInfo(info);
        } catch (err) {
            console.error("Update archived description error:", err);
            setError("Failed to update project description");
        }
    }, [selectedArchivedProject, API_BASE]);

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

    const handleSaveSyfte = useCallback(async () => {
        if (!syfteRow) return;

        setError("");
        const payload = {
            Projekt: syfteRow.PROJEKT ?? syfteRow.projekt,
            Testnamn: syfteRow.TESTNAMN ?? syfteRow.testnamn,
            Syfte: syfteText.trim()
        };

        try {
            const res = await fetch(`${API_BASE}/updateSyfte`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Update failed");

            setSyfteRow(null);
            setSyfteText("");
            setActiveTab("");
            await refreshData();
        } catch (err) {
            console.error("UpdateSyfte error:", err);
            setError("Failed to update purpose");
        }
    }, [syfteRow, syfteText, API_BASE, refreshData]);

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

    const handleToggleMarkera = useCallback(async (row) => {
        const projekt = row.PROJEKT ?? row.projekt;
        const testnamn = row.TESTNAMN ?? row.testnamn;
        const currentMarkera = row.MARKERA ?? row.markera ?? 0;
        const newMarkera = currentMarkera === 1 ? 0 : 1;

        setUpdatingMarkera(`${projekt}-${testnamn}`);
        setError("");

        try {
            const res = await fetch(`${API_BASE}/updateMarkera`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Projekt: projekt,
                    Testnamn: testnamn,
                    Markera: newMarkera
                })
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Update markera failed: ${errorText}`);
            }

            // Small delay to ensure backend has committed the change
            await new Promise(resolve => setTimeout(resolve, 100));

            // Refresh data based on which view is active
            if (showArchived && selectedArchivedProject) {
                await refreshArchivedData();
            } else if (selectedProject) {
                await refreshData();
            }

            console.log(`Successfully toggled MARKERA for ${testnamn} to ${newMarkera}`);
        } catch (err) {
            console.error("Toggle markera error:", err);
            setError("Failed to toggle highlight: " + err.message);
        } finally {
            setUpdatingMarkera(null);
        }
    }, [API_BASE, showArchived, selectedArchivedProject, selectedProject, refreshArchivedData, refreshData]);

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

    const handleSantaClick = useCallback(() => {
        const messages = [
            "🎅 Ho Ho Ho! Keep testing!",
            "🎄 Merry Load Testing!",
            "⭐ May your response times be low!",
            "🎁 Santa's checking your test coverage twice!",
            "❄️ Let it load, let it load, let it load!",
            "🔔 Jingle tests, jingle tests, jingle all the way!",
            "🎅 Santa approves of your performance tests!"
        ];
        setSantaClicked(prev => prev + 1);
        setShowSantaMessage(true);

        if (santaClicked >= 5) {
            alert("🎅🎄 BONUS EASTER EGG! 🎄🎅\n\nYou've clicked Santa " + (santaClicked + 1) + " times!\n\nMay your servers never crash and your load tests always pass!\n\n- Santa's Performance Testing Workshop 🎁");
            setSantaClicked(0);
        }

        setTimeout(() => setShowSantaMessage(false), 3000);
    }, [santaClicked]);

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
                    newProjectDescription={newProjectDescription}
                    setNewProjectDescription={setNewProjectDescription}
                    handleAddProject={handleAddProject}
                    onCancel={() => setActiveTab("")}
                    onShowFormattingHelp={() => setShowFormattingHelp(true)}
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

            {activeTab === "editSyfte" && syfteRow && (
                <EditSyfteForm
                    row={syfteRow}
                    syfteText={syfteText}
                    setSyfteText={setSyfteText}
                    handleSaveSyfte={handleSaveSyfte}
                    cancel={() => {
                        setActiveTab("");
                        setSyfteRow(null);
                        setSyfteText("");
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

            {showFormattingHelp && (
                <FormattingHelpModal onClose={() => setShowFormattingHelp(false)} />
            )}

            {selectedProject && projectInfo && !showArchived && (
                <ProjectDescriptionBox
                    projectInfo={projectInfo}
                    onUpdate={handleUpdateProjectDescription}
                    onShowFormattingHelp={() => setShowFormattingHelp(true)}
                    t={t}
                />
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

                        {selectedArchivedProject && archivedProjectInfo && (
                            <ProjectDescriptionBox
                                projectInfo={archivedProjectInfo}
                                onUpdate={handleUpdateArchivedProjectDescription}
                                onShowFormattingHelp={() => setShowFormattingHelp(true)}
                                t={t}
                            />
                        )}

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
                                        <tr
                                            key={i}
                                            className={i % 2 === 0 ? "even" : "odd"}
                                            style={(row.MARKERA ?? row.markera) === 1 ? {
                                                background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                                                borderLeft: '3px solid #fbbf24'
                                            } : {}}
                                        >
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
                                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                                <Star
                                                                    size={18}
                                                                    className="icon-btn"
                                                                    onClick={() => handleToggleMarkera(row)}
                                                                    title={(row.MARKERA ?? row.markera) === 1 ? t.unmarkTest || "Remove highlight" : t.markTest || "Highlight test"}
                                                                    style={{
                                                                        cursor: updatingMarkera === `${row.PROJEKT ?? row.projekt}-${row.TESTNAMN ?? row.testnamn}` ? 'wait' : 'pointer',
                                                                        fill: (row.MARKERA ?? row.markera) === 1 ? '#fbbf24' : 'none',
                                                                        color: (row.MARKERA ?? row.markera) === 1 ? '#fbbf24' : '#9ca3af',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                />
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
                                                        ) : dbCol === "SYFTE" ? (
                                                            <div className="cell-with-action">
                                                                <span>{row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""}</span>
                                                                <Pencil
                                                                    size={16}
                                                                    className="icon-btn"
                                                                    onClick={() => {
                                                                        setSyfteRow(row);
                                                                        setSyfteText(row.SYFTE ?? row.syfte ?? "");
                                                                        setActiveTab("editSyfte");
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
                                <tr
                                    key={i}
                                    className={i % 2 === 0 ? "even" : "odd"}
                                    style={(row.MARKERA ?? row.markera) === 1 ? {
                                        background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
                                        borderLeft: '3px solid #fbbf24'
                                    } : {}}
                                >
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
                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                                        <Star
                                                            size={18}
                                                            className="icon-btn"
                                                            onClick={() => handleToggleMarkera(row)}
                                                            title={(row.MARKERA ?? row.markera) === 1 ? t.unmarkTest || "Remove highlight" : t.markTest || "Highlight test"}
                                                            style={{
                                                                cursor: updatingMarkera === `${row.PROJEKT ?? row.projekt}-${row.TESTNAMN ?? row.testnamn}` ? 'wait' : 'pointer',
                                                                fill: (row.MARKERA ?? row.markera) === 1 ? '#fbbf24' : 'none',
                                                                color: (row.MARKERA ?? row.markera) === 1 ? '#fbbf24' : '#9ca3af',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        />
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
                                                ) : dbCol === "SYFTE" ? (
                                                    <div className="cell-with-action">
                                                        <span>{row[dbCol] ?? row[dbCol.toLowerCase()] ?? ""}</span>
                                                        <Pencil
                                                            size={16}
                                                            className="icon-btn"
                                                            onClick={() => {
                                                                setSyfteRow(row);
                                                                setSyfteText(row.SYFTE ?? row.syfte ?? "");
                                                                setActiveTab("editSyfte");
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

            {isChristmasWeek && (
                <>
                    <div
                        onClick={handleSantaClick}
                        style={{
                            position: 'fixed',
                            bottom: '80px',
                            right: '20px',
                            cursor: 'pointer',
                            zIndex: 1000,
                            animation: 'bounce 2s infinite',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2) rotate(10deg)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                        title="🎅 Click me for holiday cheer!"
                    >
                        <img
                            src="/santa.png"
                            alt="Santa"
                            style={{
                                width: '80px',
                                height: '80px',
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                            }}
                        />
                    </div>

                    {showSantaMessage && (
                        <div style={{
                            position: 'fixed',
                            bottom: '170px',
                            right: '20px',
                            background: '#dc2626',
                            color: 'white',
                            padding: '12px 20px',
                            borderRadius: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 1001,
                            animation: 'slideUp 0.3s ease',
                            fontWeight: '600',
                            fontSize: '14px',
                            border: '3px solid #16a34a'
                        }}>
                            {["🎅 Ho Ho Ho! Keep testing!", "🎄 Merry Load Testing!", "⭐ May your response times be low!", "🎁 Santa's checking your test coverage twice!", "❄️ Let it load, let it load, let it load!", "🔔 Jingle tests, jingle tests, jingle all the way!", "🎅 Santa approves of your performance tests!"][santaClicked % 7]}
                        </div>
                    )}

                    <style>{`
                        @keyframes bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-20px); }
                        }
                        
                        @keyframes snowfall {
                            0% { transform: translateY(-10px) translateX(0); opacity: 1; }
                            100% { transform: translateY(100vh) translateX(50px); opacity: 0.3; }
                        }
                        
                        .snowflake {
                            position: fixed;
                            top: -10px;
                            color: white;
                            font-size: 20px;
                            user-select: none;
                            pointer-events: none;
                            z-index: 999;
                            animation: snowfall linear infinite;
                        }
                    `}</style>

                    {/* Snowflakes */}
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="snowflake"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${5 + Math.random() * 10}s`,
                                animationDelay: `${Math.random() * 5}s`,
                                opacity: Math.random() * 0.6 + 0.4
                            }}
                        >
                            ❄
                        </div>
                    ))}
                </>
            )}

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

function AddProjectForm({ newProjectName, setNewProjectName, newProjectDescription, setNewProjectDescription, handleAddProject, onCancel, onShowFormattingHelp, t }) {
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
            <label style={{ gridColumn: '1 / -1' }}>
                {t.projectDescription}
                <textarea
                    value={newProjectDescription}
                    onChange={e => setNewProjectDescription(e.target.value)}
                    rows={3}
                    placeholder={t.enterProjectDescription}
                    style={{ maxHeight: '72px', overflowY: 'auto', fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    💡 Formatting: **bold**, *italic*, * bullets, 1. numbers, URLs auto-link
                    <button
                        onClick={onShowFormattingHelp}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            color: '#3b82f6',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            gap: '2px'
                        }}
                        title="View formatting examples"
                    >
                        <Info size={14} />
                        <span style={{ fontSize: '11px' }}>Examples</span>
                    </button>
                </div>
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

function EditSyfteForm({ row, syfteText, setSyfteText, handleSaveSyfte, cancel, t }) {
    return (
        <div className="form-grid">
            <label style={{ gridColumn: '1 / -1' }}>
                {t.purposeFor || "Purpose for"} {row.TESTNAMN ?? row.testnamn}
                <textarea
                    value={syfteText}
                    onChange={e => setSyfteText(e.target.value)}
                    rows={4}
                    placeholder={t.describePurpose || t.describeTestPurpose}
                />
            </label>
            <div className="form-actions">
                <button onClick={cancel} className="btn gray">
                    <XCircle size={16} /> {t.cancel}
                </button>
                <button onClick={handleSaveSyfte} className="btn green">
                    <Save size={16} /> {t.savePurpose || t.save}
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

function ProjectDescriptionBox({ projectInfo, onUpdate, onShowFormattingHelp, t }) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (projectInfo) {
            setDescription(projectInfo.beskrivning || "");
        }
    }, [projectInfo]);

    const handleSave = () => {
        onUpdate(description);
        setIsEditing(false);
    };

    const renderDescriptionText = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements = [];
        let inBulletList = false;
        let inNumberedList = false;
        let bulletItems = [];
        let numberedItems = [];

        const parseInlineFormatting = (line) => {
            const parts = [];
            let currentText = line;
            let key = 0;

            const urlRegex = /(https?:\/\/[^\s]+)|(\*\*(.+?)\*\*)|(__(.+?)__)|(\*(.+?)\*)|(_(.+?)_)/g;
            let lastIndex = 0;
            let match;

            while ((match = urlRegex.exec(currentText)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(currentText.substring(lastIndex, match.index));
                }

                if (match[1]) {
                    parts.push(
                        <a key={key++} href={match[1]} target="_blank" rel="noopener noreferrer"
                           style={{color: '#3b82f6', textDecoration: 'underline', fontWeight: 'inherit'}}>
                            {match[1]}
                        </a>
                    );
                } else if (match[2]) {
                    parts.push(<strong key={key++}>{match[3]}</strong>);
                } else if (match[4]) {
                    parts.push(<strong key={key++}>{match[5]}</strong>);
                } else if (match[6]) {
                    parts.push(<em key={key++}>{match[7]}</em>);
                } else if (match[8]) {
                    parts.push(<em key={key++}>{match[9]}</em>);
                }

                lastIndex = match.index + match[0].length;
            }

            if (lastIndex < currentText.length) {
                parts.push(currentText.substring(lastIndex));
            }

            return parts.length > 0 ? parts : currentText;
        };

        lines.forEach((line, lineIdx) => {
            const trimmedLine = line.trim();

            const bulletMatch = trimmedLine.match(/^[\*\-•]\s+(.+)$/);
            const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);

            if (bulletMatch) {
                if (inNumberedList) {
                    elements.push(<ol key={`ol-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{numberedItems}</ol>);
                    numberedItems = [];
                    inNumberedList = false;
                }

                inBulletList = true;
                bulletItems.push(
                    <li key={bulletItems.length} style={{marginBottom: '2px'}}>
                        {parseInlineFormatting(bulletMatch[1])}
                    </li>
                );
            } else if (numberedMatch) {
                if (inBulletList) {
                    elements.push(<ul key={`ul-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{bulletItems}</ul>);
                    bulletItems = [];
                    inBulletList = false;
                }

                inNumberedList = true;
                numberedItems.push(
                    <li key={numberedItems.length} style={{marginBottom: '2px'}}>
                        {parseInlineFormatting(numberedMatch[2])}
                    </li>
                );
            } else {
                if (inBulletList) {
                    elements.push(<ul key={`ul-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{bulletItems}</ul>);
                    bulletItems = [];
                    inBulletList = false;
                }
                if (inNumberedList) {
                    elements.push(<ol key={`ol-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{numberedItems}</ol>);
                    numberedItems = [];
                    inNumberedList = false;
                }

                if (trimmedLine) {
                    elements.push(
                        <div key={`line-${lineIdx}`} style={{marginBottom: '4px'}}>
                            {parseInlineFormatting(line)}
                        </div>
                    );
                } else {
                    elements.push(<div key={`line-${lineIdx}`} style={{height: '8px'}} />);
                }
            }
        });

        if (inBulletList) {
            elements.push(<ul key={`ul-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{bulletItems}</ul>);
        }
        if (inNumberedList) {
            elements.push(<ol key={`ol-${elements.length}`} style={{margin: '4px 0', paddingLeft: '24px'}}>{numberedItems}</ol>);
        }

        return elements;
    };

    if (!projectInfo) return null;

    return (
        <div style={{
            margin: '20px 0',
            padding: '16px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            position: 'relative'
        }}>
            {!isEditing && (
                <Pencil
                    size={16}
                    className="icon-btn"
                    onClick={() => setIsEditing(true)}
                    style={{ cursor: 'pointer', position: 'absolute', top: '16px', right: '16px' }}
                    title={t.edit || "Edit"}
                />
            )}
            {isEditing ? (
                <div>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '8px',
                            fontSize: '14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            resize: 'vertical',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            fontFamily: 'monospace'
                        }}
                    />
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        💡 Formatting: **bold**, *italic*, * bullets, 1. numbers, URLs auto-link
                        <button
                            onClick={onShowFormattingHelp}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: '#3b82f6',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                gap: '2px'
                            }}
                            title="View formatting examples"
                        >
                            <Info size={14} />
                            <span style={{ fontSize: '11px' }}>Examples</span>
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button onClick={handleSave} className="btn green" style={{ fontSize: '12px', padding: '4px 12px' }}>
                            <Save size={14} /> {t.save}
                        </button>
                        <button onClick={() => {
                            setDescription(projectInfo.beskrivning || "");
                            setIsEditing(false);
                        }} className="btn gray" style={{ fontSize: '12px', padding: '4px 12px' }}>
                            <XCircle size={14} /> {t.cancel}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal'
                }}>
                    {projectInfo.beskrivning ? renderDescriptionText(projectInfo.beskrivning) : <em>{t.noDescriptionYet}</em>}
                </div>
            )}
        </div>
    );
}

function DbInfoFooter({ dbInfo, apiBase, backendStatus }) {
    const isChristmasWeek = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();
        return month === 11 && day >= 18 && day <= 27;
    }, []);

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
                    <XCircle size={16} style={{ color: '#ef4444' }} title="Backend Offline" />
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
                href="https://github.com/ostbergjohan/pt-log-front"
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
                <span>Frontend</span>
            </a>

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
                <span>Backend</span>
            </a>

            <span style={{ color: '#d1d5db' }}>•</span>

            <span style={{ fontSize: '0.875rem', color: isChristmasWeek ? '#dc2626' : '#9ca3af', fontWeight: isChristmasWeek ? '600' : 'normal' }}>
                {isChristmasWeek ? '🎄 Happy Holidays from PT-Log! 🎅' : 'Made with ❤️ for performance testers'}
            </span>
        </footer>
    );
}

function FormattingHelpModal({ onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '16px' }}>📋 Formatting Quick Reference</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#374151' }}>Format</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#374151' }}>Syntax</th>
                        <th style={{ textAlign: 'left', padding: '8px', color: '#374151' }}>Result</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>Bold</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>**text**</td>
                        <td style={{ padding: '8px' }}><strong>text</strong></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>Italic</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>*text*</td>
                        <td style={{ padding: '8px' }}><em>text</em></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>Bullet</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>* item</td>
                        <td style={{ padding: '8px' }}>• item</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>Numbered</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>1. item</td>
                        <td style={{ padding: '8px' }}>1. item</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px' }}>Link</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>https://example.com</td>
                        <td style={{ padding: '8px' }}><a href="https://example.com" style={{ color: '#3b82f6' }}>https://example.com</a></td>
                    </tr>
                    <tr>
                        <td style={{ padding: '8px' }}>Spacing</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace', background: '#f5f5f5' }}>(blank line)</td>
                        <td style={{ padding: '8px', fontSize: '13px', color: '#6b7280' }}>Adds space between sections</td>
                    </tr>
                    </tbody>
                </table>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                    <button onClick={onClose} className="btn blue">
                        <Check size={16} /> Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}