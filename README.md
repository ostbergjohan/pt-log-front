# Testlog React App

![Screenshot](https://github.com/ostbergjohan/pt-log-backend/blob/main/image/screenshot.png?raw=true | width=600)

This project is a **React-based frontend** for managing and analyzing performance test logs.  
It integrates with a backend API to store, retrieve, and update test data across multiple projects.
https://github.com/ostbergjohan/pt-log-backend is required.

---

## ✨ Features

- 📂 **Project Management**
  - Create and select projects.
- 🧪 **Test Management**
  - Add new tests with metadata (type, name, purpose, tester).
  - Copy test names with a single click.
- 📝 **Analysis**
  - Add or update analysis text for each test entry.
- 👤 **Testers**
  - Tester names are loaded from `testers.json` and selectable in the UI.
- 🔄 **Data Handling**
  - Fetches and refreshes data from backend APIs.
  - Inline editing and saving of analysis.
- ✅ **Feedback**
  - Shows loading states and “Copied!” toast notifications.

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
 ├── App.js          # Main React component
 ├── App.css         # Styling
 ├── config.js       # API base URL config
 ├── testers.json    # List of testers
 └── components/     # (Optional future split of forms/components)
```

---

## 🔌 Backend API Endpoints

The frontend expects the following backend endpoints:

- `GET /populate` → returns all projects
- `GET /getData?projekt={name}` → returns tests for a project
- `POST /insert` → insert new test
- `POST /createProject` → create a new project
- `PUT /updateAnalys` → update analysis field for a test

---

## 🖼️ UI Overview

- **Header bar**: Buttons for "Nytt Test" (new test), "Skapa Projekt" (create project), project & tester dropdowns.
- **Tabs**: 
  - New test form
  - Create project form
  - Analysis editor
- **Table**: Displays test data with columns:  
  `DATUM, TYP, TESTNAMN, SYFTE, ANALYS, PROJEKT, TESTARE`

---