# PT-Log

![Screenshot](https://github.com/ostbergjohan/pt-log-backend/raw/main/image/screenshot.png)

This project is a **React-based frontend** for managing and analyzing performance test runs.  
It integrates with a backend API to store, retrieve, and update test data across multiple projects.
https://github.com/ostbergjohan/pt-log-backend is required.

---

## ✨ Features

- 🌍 **Multilingual Interface (9 Languages)**
  - Supports English, Swedish, French, German, Danish, Norwegian, Finnish, Spanish, and Portuguese
  - Language preference persists across sessions
  - English as default language
  - Easy to customize translations via `translations.js`
  
- 📝 **Rich Text Editor**
  - Format text with **bold**, *italic*, and <u>underline</u>
  - Create bullet and numbered lists
  - Add hyperlinks
  - Clear formatting with one click
  - Powered by Tiptap editor
  - Used in: Project descriptions, Test purposes, and Analysis fields
  
- 📂 **Project Management**
  - Create and select projects with rich text descriptions
  - Archive projects for later reference
  - Share project links via URL
  - Delete projects with confirmation (only in archived view)
  - Edit project descriptions with rich text formatting

- 🧪 **Test Management**
  - Add new tests with metadata (type, name, purpose, tester)
  - Support for multiple test types: Reference, Verification, Load, Endurance, Max, Create
  - Customizable test types via `config.js`
  - View tests from both active and archived projects
  - ⭐ **Highlight/Star important tests** for quick visibility
  - Edit test purposes with rich text formatting

- 👥 **User Management**
  - Add Users to `testers.json`

- 📊 **Analysis**
  - Add or update analysis text for each test entry with rich text formatting
  - Edit analysis for tests in both active and archived projects
  - Format analysis with lists, bold text, and links
  - URL auto-detection in plain text

- 🧮 **Pacing Calculator**
  - Calculate pacing from Req/h or Req/s

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone https://github.com/ostbergjohan/pt-log-front
cd pt-log-front
```

### 2. Install dependencies
```bash
npm install
```

### 3. Install Tiptap (Rich Text Editor)
```bash
npm install @tiptap/core @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-underline
```

### 4. Configure API base, test types and users
Update the `config.js` file with your backend API base URL and customize test types if needed:
```js
const config = {
    API_BASE: "https://your-backend-url",
    testTypes: [
        {
            key: 'reference',
            sv: 'Referenstest',
            en: 'Reference Test',
            fr: 'Test de Référence',
            de: 'Referenztest',
            da: 'Referencetest',
            no: 'Referansetest',
            fi: 'Viitetesti',
            es: 'Prueba de Referencia',
            pt: 'Teste de Referência'
        },
        // ... more test types
    ]
};
export default config;
```

Update `testers.json`:
```json
[
  "John",
  "Peter",
  "Maria"
]
```

### 5. Customize translations (optional)
Update the `translations.js` file to modify any UI text or add new languages:
```js
const translations = {
    en: {
        newTest: "New Test",
        createProject: "Create Project",
        // ... more translations
    },
    sv: {
        newTest: "Nytt Test",
        createProject: "Skapa Projekt",
        // ... more translations
    },
    es: {
        newTest: "Nueva Prueba",
        createProject: "Crear Proyecto",
        // ... more translations
    },
    pt: {
        newTest: "Novo Teste",
        createProject: "Criar Projeto",
        // ... more translations
    }
    // ... more languages
};
export default translations;
```

### 6. Run the app
```bash
npm start
```
This will start the app on [http://localhost:3000](http://localhost:3000).

---

## 🎨 Customization

### Adding/Modifying Test Types

Edit `config.js` to add or modify test types:
```js
testTypes: [
    {
        key: 'your-test-key',
        en: 'English Name',
        sv: 'Swedish Name',
        es: 'Spanish Name',
        pt: 'Portuguese Name'
        // Add translations for all supported languages
    },
    // Add more test types as needed
]
```

The `key` is used internally and saved to the database, while language codes are the display names.

### Customizing Translations

Edit `translations.js` to modify any UI text:
```js
const translations = {
    en: {
        yourNewKey: "Your english text",
        // Modify existing or add new keys
    },
    sv: {
        yourNewKey: "Din svenska text",
        // Modify existing or add new keys
    },
    es: {
        yourNewKey: "Tu texto en español",
        // Modify existing or add new keys
    },
    pt: {
        yourNewKey: "O seu texto em português",
        // Modify existing or add new keys
    }
};
```

### Adding a New Language

1. Add a new language object to `translations.js`:
```js
const translations = {
    en: { /* English translations */ },
    sv: { /* Swedish translations */ },
    es: { /* Spanish translations */ },
    pt: { /* Portuguese translations */ },
    it: { /* Italian translations */ },  // New language
    // Add more languages
};
```

2. Update test types in `config.js`:
```js
testTypes: [
    {
        key: 'reference',
        en: 'Reference Test',
        sv: 'Referenstest',
        es: 'Prueba de Referencia',
        pt: 'Teste de Referência',
        it: 'Test di Riferimento'  // Add to all test types
    },
    // Update all test types
]
```

3. Update the `languageOptions` array in `App.js`:
```js
const languageOptions = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }  // Add new language
];
```

---

## 📌 Backend API Endpoints

The frontend expects the following backend endpoints:

### Active Projects
- `GET /populate` → returns all active projects (WHERE ARKIVERAD = 0)
- `GET /getData?projekt={name}` → returns tests for a project
- `GET /getProjectInfo?projekt={name}` → returns project information including description
- `GET /dbinfo` → returns database information
- `GET /healthcheck` → health check endpoint
- `POST /insert` → insert new test
- `POST /createProject` → create a new project
- `POST /addKonfig` → add pacing configuration
- `POST /addGenerellKonfig` → add general configuration
- `PUT /updateAnalys` → update analysis field for a test
- `PUT /updateSyfte` → update purpose field for a test
- `PUT /updateProjectBeskrivning` → update project description
- `PUT /updateMarkera` → toggle star/highlight on a test
- `DELETE /deleteTest` → delete a test

### Archived Projects
- `GET /populateArkiverade` → returns all archived projects (WHERE ARKIVERAD = 1)
- `POST /arkivera?namn={projectName}` → archive a project (set ARKIVERAD = 1)
- `POST /restore?namn={projectName}` → restore an archived project (set ARKIVERAD = 0)
- `DELETE /deleteProject` → permanently delete a project (available in archived view)

---

## 💾 Local Storage

The app persists the following preferences in localStorage:
- `language` - Selected language (en/sv/fr/de/da/no/fi/es/pt)
- `lastProject` - Last selected project
- `lastTester` - Last selected tester

---

## 📄 Archive/Restore Workflow

1. **Archive a Project**: Click the archive icon (🗄️) next to a selected project
2. **View Archived**: Click "Archived" / "Arkiverade" button to toggle archived view
3. **Restore a Project**: Select an archived project and click "Restore Project"
4. **Delete Permanently**: In archived view, click the delete icon to permanently remove a project

---

## ⭐ Highlighting Tests

- Click the **star icon** (⭐) in the Action column to highlight important tests
- Highlighted tests appear with a yellow gradient background
- Perfect for marking critical tests, failures, or tests requiring attention
- Highlight status is saved to the database and syncs across all users

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

When saved, pacing configurations are displayed as formatted lists with the pacing value highlighted in bold.


---

## 🔗 Related Projects

- **Backend**: [pt-log-backend](https://github.com/ostbergjohan/pt-log-backend)

---

## 🛠️ Technologies Used

- **React** - Frontend framework
- **Tiptap** - Rich text editor
- **Lucide React** - Icon library
- **CSS3** - Styling with animations
- **LocalStorage** - Client-side persistence

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

## 📝 License

MIT License - See LICENSE file for details

---

**Made with ❤️ for performance testers**