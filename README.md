# BigQuery Release Notes Dashboard (BQ Tracker)

A premium, modern web dashboard built with Python Flask and vanilla HTML, CSS, and JavaScript. This tool fetches the live BigQuery Release Notes RSS/Atom feed, parses individual updates dynamically, and allows developers to easily search, filter, and draft updates to share on Twitter/X.

## 🚀 Features

- **Live Feeds Synchronization**: Directly fetches the official GCP Atom feed stream.
- **Granular Update Splitting**: Splits composite daily release notes into individual cards based on update categories.
- **Type-based Filters**: Filter items instantly by categories: `Features`, `Announcements`, `Issues`, `Changes`, and `Breaking` changes.
- **Instant Search**: Real-time keyword filtering across description text, categories, and dates.
- **Twitter Web Intent Integration**: Automatically drafts formatted tweets matching the 280-character limit with a visual circular progress ring.
- **Aesthetic Design**: Implements a high-end, responsive dark theme styling featuring smooth animations and visual skeleton loading feedback.

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Requests
- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **External Integration**: Twitter/X Web Share Intent

---

## 📂 Project Structure

```text
bq-release-notes/
├── app.py                 # Flask server and XML parser
├── requirements.txt       # Python dependencies list
├── .gitignore             # Git exclusion rules
├── templates/
│   └── index.html         # Frontend layout structure
├── static/
│   ├── css/
│   │   └── style.css      # Dark mode styling and UI states
│   └── js/
│   │   └── app.js         # Fetch, client-side parser, and events logic
└── venv/                  # Python Virtual Environment (ignored)
```

---

## ⚙️ Installation & Setup

### Prerequisites
* Python 3.8 or higher
* Git

### Local Development Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/edoerner/agy-cli-event-talks-app.git
   cd agy-cli-event-talks-app
   ```

2. **Initialize and activate virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Flask application**:
   ```bash
   PORT=8080 python app.py
   ```

5. **Open your browser**:
   Navigate to [http://127.0.0.1:8080](http://127.0.0.1:8080) to view the live dashboard.

---

## 🔗 Repository Links
- **GitHub Repository**: [edoerner/agy-cli-event-talks-app](https://github.com/edoerner/agy-cli-event-talks-app)
