# 📌 Student Task Organizer

A lightweight web-based task management system for **leaders** and **members**.  
Leaders can assign tasks, track progress, and view analytics.  
Members can log in, view assigned tasks in a **Kanban board**, update statuses, and upload completed work.  

---

## 🚀 Features  

### 👩‍🏫 Leader
- Secure login (default: **admin / 1234**).
- Register and manage members.
- Assign tasks with:
  - Title  
  - Required Skill  
  - Assignee  
  - Start & Deadline  
  - Points & Penalty  
- View all members with **points and penalties**.  
- Analytics dashboard (powered by **Chart.js**):
  - Task status distribution (pie chart).  
  - Tasks assigned per member (bar chart).  
  - Task creation timeline (line chart).  
- Delete tasks when needed.  

### 👩‍💻 Member
- Register and log in.  
- View tasks in a **Kanban board** (`To Do`, `In Progress`, `Done`).  
- Drag & drop tasks between columns.  
- Upload files for completed tasks.  
- Automatically earn **points** and **penalties** based on deadlines.  
- View personal skills and progress.  

### 🌗 Theme
- Toggle between **Light/Dark mode** (saved in `localStorage`).  

---

## 📂 Project Structure  

```
├── main.html      # UI structure (Leader & Member dashboards, Login/Register pages)
├── styles.css     # Styling (Light/Dark mode, Kanban, Cards, Buttons)
├── script.js      # Core logic (Auth, Task handling, Kanban, Charts, Storage)
```

---

## ⚡ Installation & Usage  

1. **Clone or Download** this repository.  
   ```bash
   git clone https://github.com/your-username/student-task-organizer.git
   cd student-task-organizer
   ```

2. **Open `main.html` in your browser**.  
   No server required (fully client-side with `localStorage` & `sessionStorage`).  

3. **Log in as Leader**  
   - Username: `admin`  
   - Password: `1234`  

4. **Register as a Member** and log in to access the Member Dashboard.  

---

## 🛠️ Tech Stack  

- **HTML5, CSS3, JavaScript (Vanilla)**  
- **Chart.js** – for analytics & data visualization.  
- **LocalStorage & SessionStorage** – to persist members, tasks, and sessions.  

---

## 🔮 Future Improvements  

- Authentication with a real backend (Firebase / Node.js).  
- Notifications & reminders for deadlines.  
- Export reports (CSV/PDF).  
- Role-based permissions beyond Admin/Member.  

---

## 📜 License  

This project is open-source under the **MIT License**.  
