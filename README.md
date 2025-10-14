markdown
# PT-Log 2.0

![Screenshot](https://github.com/ostbergjohan/pt-log-backend/raw/main/image/screenshot.png)


This project is a **React-based frontend** for managing and analyzing performance test runs.  
It integrates with a backend API to store, retrieve, and update test data across multiple projects.
https://github.com/ostbergjohan/pt-log-backend is required.

---

## ✨ Features

- 🌍 **Bilingual Interface (English/Swedish)**
  - Toggle between English and Swedish with a single click
  - Language preference persists across sessions
  - English as default language
  - Easy to customize translations via `translations.js`
  
- 📂 **Project Management**
  - Create and select projects
  - Archive projects for later reference
  - Restore archived projects back to active status
  - View and manage archived projects separately
  - Share project links via URL
  - Delete projects with confirmation (only in archived view)
  - Real-time project counter for archived projects

- 🧪 **Test Management**
  - Add new tests with metadata (type, name, purpose, tester)
  - Support for multiple test types: Reference, Verification, Load, Endurance, Max, Create
  - Customizable test types via `config.js`
  - Copy test names with a single click
  - Delete individual tests
  - View tests from both active and archived projects

- 📝 **Analysis**
  - Add or update analysis text for each test entry
  - Edit analysis for tests in both active and archived projects

- 🧮 **Pacing Calculator**
  - Calculate pacing from Req/h or Req/s
  - Automatic conversions between request rates
  - Correct pacing formula: Pacing = VU / Req/s
  - Save pacing configurations
  - Copy calculated pacing values

- ⚙️ **Configuration Management**
  - Add general configuration entries

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/ostbergjohan/pt-log-front
cd testlog-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure API base and test types
Update the `config.js` file with your backend API base URL and customize test types if needed:
```js
const config = {
    API_BASE: "https://your-backend-url",
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
```

### 4. Customize translations (optional)
Update the `translations.js` file to modify any UI text or add new languages:
```js
const translations = {
    sv: {
        newTest: "Nytt Test",
        createProject: "Skapa Projekt",
        // ... more translations
    },
    en: {
        newTest: "New Test",
        createProject: "Create Project",
        // ... more translations
    }
};
export default translations;
```

### 5. Run the app
```bash
npm start
```
This will start the app on [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure
```
src/
 ├── App.js          # Main React component with bilingual support
 ├── App.css         # Styling
 ├── config.js       # API base URL and test types configuration
 ├── translations.js # All UI translations (English/Swedish)
 ├── testers.json    # List of testers
 └── components/     # (Optional future split of forms/components)
```

---


## 🎨 Customization

### Adding/Modifying Test Types

Edit `config.js` to add or modify test types:

```js
testTypes: [
    { key: 'your-test-key', sv: 'Swedish Name', en: 'English Name' },
    // Add more test types as needed
]
```

The `key` is used internally and saved to the database, while `sv` and `en` are the display names.

### Customizing Translations

Edit `translations.js` to modify any UI text:

```js
const translations = {
    sv: {
        yourNewKey: "Din svenska text",
        // Modify existing or add new keys
    },
    en: {
        yourNewKey: "Your english text",
        // Modify existing or add new keys
    }
};
```

### Adding a New Language

1. Add a new language object to `translations.js`:
```js
const translations = {
    sv: { /* Swedish translations */ },
    en: { /* English translations */ },
    de: { /* German translations */ },
    // Add more languages
};
```

2. Update test types in `config.js`:
```js
testTypes: [
    { key: 'reference', sv: 'Referenstest', en: 'Reference Test', de: 'Referenztest' },
    // Add language codes to all test types
]
```

3. Update the language toggle button logic in `App.js` to cycle through your languages.

---

## 📌 Backend API Endpoints

The frontend expects the following backend endpoints:

### Active Projects
- `GET /populate` → returns all active projects (WHERE ARKIVERAD = 0)
- `GET /getData?projekt={name}` → returns tests for a project
- `GET /dbinfo` → returns database information
- `POST /insert` → insert new test
- `POST /createProject` → create a new project
- `POST /addKonfig` → add pacing configuration
- `POST /addGenerellKonfig` → add general configuration
- `PUT /updateAnalys` → update analysis field for a test
- `DELETE /deleteTest` → delete a test

### Archived Projects
- `GET /populateArkiverade` → returns all archived projects (WHERE ARKIVERAD = 1)
- `POST /arkivera?namn={projectName}` → archive a project (set ARKIVERAD = 1)
- `POST /restore?namn={projectName}` → restore an archived project (set ARKIVERAD = 0)
- `DELETE /deleteProject` → permanently delete a project (available in archived view)

---


## 💾 Local Storage

The app persists the following preferences in localStorage:
- `language` - Selected language (en/sv)
- `lastProject` - Last selected project
- `lastTester` - Last selected tester

---

## 📄 Archive/Restore Workflow

1. **Archive a Project**: Click the archive icon (🗄️) next to a selected project
2. **View Archived**: Click "Archived" / "Arkiverade" button to toggle archived view
3. **Restore a Project**: Select an archived project and click "Restore Project" / "Återställ Projekt"
4. **Delete Permanently**: In archived view, click the delete icon to permanently remove a project

---

## 💡 Pacing Calculation

The pacing calculator uses the correct formula:

**Pacing = VU / Req/s**

Where:
- **VU** = Number of Virtual Users
- **Req/s** = Requests per second
- **Pacing** = Time between requests (in seconds)

Example:
- 10 VU at 2 req/s = 5 seconds pacing
- 10 VU at 1 req/s = 10 seconds pacing

---


## 🔗 Related Projects

- **Backend**: [pt-log-backend](https://github.com/ostbergjohan/pt-log-backend)

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.
```
