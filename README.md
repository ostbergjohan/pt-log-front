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
  - Share project links via URL
  - Delete projects with confirmation

- 🧪 **Test Management**
  - Add new tests with metadata (type, name, purpose, tester)
  - Support for multiple test types: Reference, Verification, Load, Endurance, Max, Create
  - Copy test names with a single click
  - Delete individual tests

- 📝 **Analysis**
  - Add or update analysis text for each test entry
  - Clickable URLs in analysis text

- 🧮 **Pacing Calculator**
  - Calculate pacing from Req/h or Req/s
  - Automatic conversions between request rates
  - Save pacing configurations

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

## 🌐 Language Support

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

---

## 🔌 Backend API Endpoints

The frontend expects the following backend endpoints:

- `GET /populate` → returns all projects
- `GET /getData?projekt={name}` → returns tests for a project
- `GET /dbinfo` → returns database information
- `POST /insert` → insert new test
- `POST /createProject` → create a new project
- `POST /addKonfig` → add pacing configuration
- `POST /addGenerellKonfig` → add general configuration
- `PUT /updateAnalys` → update analysis field for a test
- `DELETE /deleteProject` → delete a project
- `DELETE /deleteTest` → delete a test

---

## 🖼️ UI Overview

- **Header bar**: 
  - Language toggle button (🌍 EN/SV)
  - "New Test" / "Nytt Test" button
  - "Create Project" / "Skapa Projekt" button
  - Project & tester dropdowns
  - "Calculate Pacing" / "Beräkna Pacing" button
  - "General Config" / "Generell Konfig" button
  - Refresh button

- **Tabs**: 
  - New test form with translated test types
  - Create project form
  - Analysis editor
  - Pacing calculator
  - General configuration form

- **Table**: Displays test data with translated columns:
  - English: `DATE, TYPE, TEST NAME, PURPOSE, ANALYSIS, TESTER, ACTION`
  - Swedish: `DATUM, TYP, TESTNAMN, SYFTE, ANALYS, TESTARE, ÅTGÄRD`

---

## 💾 Local Storage

The app persists the following preferences in localStorage:
- `language` - Selected language (en/sv)
- `lastProject` - Last selected project
- `lastTester` - Last selected tester


---

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.