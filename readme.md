# 📚 AI Study Buddy - PLP

An **AI-powered study assistant** that helps students learn smarter by generating explanations, summaries, and interactive responses using **Hugging Face's LLM API**.

🌐 **Live Demo**: [study-assistant-ai.vercel.app](https://study-assistant-ai.vercel.app)

## 👥 Contributors

* **Frontend**: [Itsshisia](https://github.com/Itsshisia)
* **Backend**: [talesofcarter](https://github.com/talesofcarter)


## 🚀 Features

* 🤖 **AI-Powered Q\&A** – Get instant answers and explanations.
* 📑 **Summarization** – Summarize long texts into key points.
* 🎯 **Study Guidance** – Personalized recommendations for learners.
* 🔒 **Secure Backend** – Flask backend with authentication & validation.
* 🛢️ **Database Support** – Store user sessions and data in **MySQL**.
* ⚡ **Scalable Deployment** – Served with **Gunicorn** for production.


## 🛠️ Tech Stack

### Backend

* [Flask](https://flask.palletsprojects.com/) – Python micro-framework
* [Gunicorn](https://gunicorn.org/) – WSGI HTTP server for production

### Database

* [MySQL](https://www.mysql.com/) – Relational database management system

### External APIs

* [Hugging Face LLM API](https://huggingface.co/docs/api-inference/index) – AI/LLM integration

## 📂 Project Structure

```
study-assistant-ai/
│── backend/
│   ├── app.py             # Main Flask app
│   ├── routes/            # API endpoints
│   ├── models/            # Database models (MySQL)
│   ├── services/          # Hugging Face API integration
│── frontend/              # Deployed on Vercel
│── requirements.txt       # Python dependencies
│── README.md              # Project documentation
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Itsshisia/study-assistant-ai.git
cd study-assistant-ai
```

### 2. Create a Virtual Environment & Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate   # On Linux/Mac
venv\Scripts\activate      # On Windows

pip install -r requirements.txt
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```ini
FLASK_ENV=development
DATABASE_URL=mysql://username:password@localhost:3306/study_assistant
HUGGINGFACE_API_KEY=your_huggingface_api_key
SECRET_KEY=your_secret_key
```

### 4. Run the Backend

```bash
flask run
```

Or with **Gunicorn** (for production):

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🌐 Deployment

* **Frontend** is hosted on **Vercel** → [study-assistant-ai.vercel.app](https://study-assistant-ai.vercel.app)
* **Backend** runs on Flask + Gunicorn (can be deployed on Render, Railway, or any VPS).
* **Database**: MySQL (cloud-hosted or local).

## 🔒 Security Features

* ✅ Input validation & sanitization
* ✅ Environment variables for API keys & DB credentials
* ✅ Secure authentication (JWT/session management)
* ✅ Protected routes for sensitive data

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repo
2. Create a new branch (`feature/your-feature`)
3. Commit your changes
4. Submit a pull request

## 📜 License

This project is licensed under the **MIT License**.
