const config = {
    API_BASE: "https://ptlog-af-neoload-acc.apps.tocp4.arbetsformedlingen.se",
    testTypes: [
        { key: 'reference', sv: 'Referenstest', en: 'Reference Test' },
        { key: 'verification', sv: 'Verifikationstest', en: 'Verification Test' },
        { key: 'load', sv: 'Belastningstest', en: 'Load Test' },
        { key: 'endurance', sv: 'Utmattningstest', en: 'Endurance Test' },
        { key: 'max', sv: 'Maxtest', en: 'Max Test' },
        { key: 'create', sv: 'Skapa', en: 'Create' }
    ]
};

export default config;