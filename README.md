# PT-Log 2.0
<p align="left">
  <img src="https://github.com/ostbergjohan/pt-log-backend/raw/main/image/screenshot.png" alt="Screenshot">
</p>

This project is a **React-based frontend** for managing and analyzing performance test runs.  
It integrates with a backend API to store, retrieve, and update test data across multiple projects.
https://github.com/ostbergjohan/pt-log-backend is required.

---

## ✨ Features

- 🌍 **Bilingual Interface (English/Swedish)**
  - Toggle between English and Swedish with a single click
  - Language preference persists across sessions
  - English as default language
  - All UI elements fully translated (buttons, labels, forms, modals, table headers)
  
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
  - Copy test names with a single click
  - Delete individual tests
  - View tests from both active and archived projects

- 📝 **Analysis**
  - Add or update analysis text for each test entry
  - Clickable URLs in analysis text
  - Edit analysis for tests in both active and archived projects

- 🧮 **Pacing Calculator**
  - Calculate pacing from Req/h or Req/s
  - Automatic conversions between request rates
  - Correct pacing formula: Pacing = VU / Req/s
  - Save pacing configurations
  - Copy calculated pacing values

- ⚙️ **Configuration Management**
  - Add pacing configurations with VU calculations
  - Add general configuration entries
  - Language-aware CONFIG/KONFIG naming

---

## 📦 Tech Stack

- [React](https://react.dev/) (Hooks, functional components)
- [lucide-react](https://lucide.dev/) for icons
- CSS for styling (`App.css`)
- External JSON configuration:
  - `config.js` for API base URL
  - `testers.json` for tester names

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

### 3. Configure API base
Update the `config.js` file with your backend API base URL:
```js
const config = {
  API_BASE: "https://your-backend-url"
};
export default config;
```

### 4. Run the app
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
 ├── config.js       # API base URL config
 ├── testers.json    # List of testers
 └── components/     # (Optional future split of forms/components)
```

---

## 🌍 Language Support

The application supports both English and Swedish:

- **Default Language**: English
- **Toggle**: Click the language button (🌍 EN/SV) in the header
- **Persistence**: Language preference is saved to localStorage
- **Translated Elements**:
  - All buttons and labels
  - Form fields and placeholders
  - Table column headers
  - Modal dialogs
  - Error messages
  - Test types (Reference Test/Referenstest, etc.)
  - Configuration entries (CONFIG/KONFIG)
  - Archive/restore actions (Archive/Arkivera, Restore/Återställ)

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

## 🖼️ UI Overview

- **Header bar**: 
  - Language toggle button (🌍 EN/SV)
  - "New Test" / "Nytt Test" button
  - "Create Project" / "Skapa Projekt" button
  - Project & tester dropdowns
  - Archive icon (🗄️) next to selected project
  - "Calculate Pacing" / "Beräkna Pacing" button
  - "General Config" / "Generell Konfig" button
  - Refresh button
  - "Archived" / "Arkiverade" toggle button with counter

- **Tabs**: 
  - New test form with translated test types
  - Create project form
  - Analysis editor
  - Pacing calculator
  - General configuration form

- **Main View (Active Projects)**:
  - Table displaying test data with translated columns
  - English: `DATE, TYPE, TEST NAME, PURPOSE, ANALYSIS, TESTER, ACTION`
  - Swedish: `DATUM, TYP, TESTNAMN, SYFTE, ANALYS, TESTARE, ÅTGÄRD`
  - Archive icon for quick project archiving

- **Archived View**:
  - Separate project dropdown for archived projects
  - Full test data table (same as active view)
  - Restore button to move projects back to active status
  - Delete button for permanent project removal

---

## 💾 Local Storage

The app persists the following preferences in localStorage:
- `language` - Selected language (en/sv)
- `lastProject` - Last selected project
- `lastTester` - Last selected tester

---

## 🔄 Archive/Restore Workflow

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

## 💥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🔗 Related Projects

- **Backend**: [pt-log-backend](https://github.com/ostbergjohan/pt-log-backend)

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.