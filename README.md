# 🔍 Smart Plagiarism & AI Content Detector

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue. svg)
![Next.js](https://img.shields.io/badge/Next.js-16. 0-black)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)
![DigitalOcean](https://img.shields.io/badge/Deployed%20on-DigitalOcean-0080FF)

**A cloud-native application for detecting plagiarism and AI-generated content with smart content remediation capabilities.**

[🚀 Live Demo](https://squid-app-oaccw.ondigitalocean. app/) · [📖 Documentation](#-features) · [🐛 Report Bug](https://github.com/AliShahidF2023-752/CloudComputingProject/issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Team](#-team)
- [License](#-license)

---

## 🎯 About the Project

**Smart Plagiarism & AI Content Detector** is a comprehensive cloud computing project that helps users identify: 

- 🤖 **AI-Generated Content** - Detects text written by AI models like ChatGPT, Claude, etc.
- 📝 **Plagiarized Content** - Identifies copied content from various online sources
- ✨ **Content Remediation** - Helps users rewrite flagged content to be original

The application is built with a microservices architecture, containerized with Docker, and deployed on DigitalOcean App Platform for scalability and reliability. 

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔬 **AI Detection** | Uses RoBERTa-based transformer model to detect AI-generated text with high accuracy |
| 🔎 **Plagiarism Checking** | Scans text against online sources to identify copied content |
| 📊 **Confidence Scoring** | Provides detailed confidence scores for each flagged section |
| 🎨 **Highlighted Results** | Visual highlighting of problematic text sections |
| 👤 **User Authentication** | Secure login/signup with JWT-based authentication |
| 📱 **Responsive Design** | Works seamlessly on desktop and mobile devices |
| 🐳 **Containerized** | Fully dockerized for easy deployment and scaling |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| ![Next.js](https://img.shields.io/badge/Next. js-16-black) | React framework with App Router |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) | Type-safe JavaScript |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC) | Utility-first CSS framework |
| ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748) | Database ORM |
| ![NextAuth](https://img.shields.io/badge/NextAuth-4-purple) | Authentication |

### Backend - AI Text Detector
| Technology | Purpose |
|------------|---------|
| ![Python](https://img.shields.io/badge/Python-3.11-blue) | Core language |
| ![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688) | REST API framework |
| ![Transformers](https://img.shields.io/badge/HuggingFace-Transformers-yellow) | AI/ML model inference |
| ![RoBERTa](https://img.shields.io/badge/RoBERTa-AI%20Detection-orange) | Pre-trained AI detection model |

### Backend - Plagiarism Checker
| Technology | Purpose |
|------------|---------|
| ![Python](https://img.shields.io/badge/Python-3.11-blue) | Core language |
| ![FastAPI](https://img.shields.io/badge/FastAPI-latest-009688) | REST API framework |
| ![BeautifulSoup](https://img.shields.io/badge/BeautifulSoup-4-green) | Web scraping |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| ![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED) | Container runtime |
| ![DigitalOcean](https://img.shields.io/badge/DigitalOcean-Cloud-0080FF) | Cloud hosting |
| ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-CI%2FCD-2088FF) | Automation |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791) | Database |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DigitalOcean                            │
│                      App Platform                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │                 │  │                 │  │                 │ │
│  │    Frontend     │  │  AI Detector    │  │   Plagiarism    │ │
│  │   (Next.js)     │  │   (FastAPI)     │  │    Checker      │ │
│  │                 │  │                 │  │   (FastAPI)     │ │
│  │  Port:  3000     │  │  Port: 8000     │  │  Port: 5000     │ │
│  │                 │  │                 │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                │                               │
│                    ┌───────────▼───────────┐                   │
│                    │                       │                   │
│                    │     PostgreSQL        │                   │
│                    │      Database         │                   │
│                    │                       │                   │
│                    └───────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
CloudComputingProject/
├── 📁 frontend/                 # Next.js frontend application
│   ├── 📁 src/
│   │   ├── 📁 app/             # Next.js App Router pages
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 lib/             # Utility functions
│   │   └── 📁 types/           # TypeScript types
│   ├── 📁 prisma/              # Database schema & migrations
│   ├── 📄 Dockerfile
│   └── 📄 package.json
│
├── 📁 model/                    # AI Text Detection service
│   ├── 📄 run.py               # FastAPI application
│   ├── 📄 utils.py             # Text processing utilities
│   ├── 📄 requirements.txt
│   └── 📄 Dockerfile
│
├── 📁 plagiarism-checker/       # Plagiarism Detection service
│   ├── 📄 app.py               # FastAPI application
│   ├── 📄 requirements.txt
│   └── 📄 Dockerfile
│
├── 📁 . github/
│   └── 📁 workflows/           # CI/CD pipelines
│
└── 📄 README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **Python** >= 3.11
- **Docker** & **Docker Compose**
- **PostgreSQL** (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AliShahidF2023-752/CloudComputingProject.git
   cd CloudComputingProject
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   
   # Setup environment variables
   cp .env.example . env. local
   # Edit .env.local with your database URL and secrets
   
   # Run database migrations
   npx prisma migrate dev
   
   # Start development server
   npm run dev
   ```

3. **Setup AI Text Detector**
   ```bash
   cd model
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Start the service
   uvicorn run: app --host 0.0.0.0 --port 8000
   ```

4. **Setup Plagiarism Checker**
   ```bash
   cd plagiarism-checker
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Start the service
   uvicorn app:app --host 0.0.0.0 --port 5000
   ```

### Docker Deployment

Build and run all services with Docker: 

```bash
# Build images
docker build -t ccproject-frontend ./frontend
docker build -t ai-text-detector ./model
docker build -t plagiarism-checker ./plagiarism-checker

# Run containers
docker run -d -p 3000:3000 ccproject-frontend
docker run -d -p 8000:8000 ai-text-detector
docker run -d -p 5000:5000 plagiarism-checker
```

---

## ☁️ Deployment

The application is deployed on **DigitalOcean App Platform** at: 

🌐 **[https://squid-app-oaccw.ondigitalocean.app/](https://squid-app-oaccw.ondigitalocean.app/)**

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth. js |
| `NEXTAUTH_URL` | Application URL |
| `AI_DETECTOR_URL` | URL of AI detection service |
| `PLAGIARISM_CHECKER_URL` | URL of plagiarism service |

---

## 📡 API Reference

### AI Text Detection Service

**Endpoint:** `POST /detect`

```json
// Request
{
  "text": "Your text to analyze for AI-generated content..."
}

// Response
{
  "lines": [
    {
      "text":  "Detected AI-generated sentence.",
      "start": 0,
      "end": 32,
      "confidence": 0.9542
    }
  ]
}
```

### Plagiarism Checker Service

**Endpoint:** `POST /plagiarism`

```json
// Request
{
  "text": "Your text to check for plagiarism..."
}

// Response
{
  "plagiarism_score": 0.85,
  "highlights": [
    {
      "text":  "Plagiarized content here",
      "start":  0,
      "end": 24,
      "confidence": 0.95,
      "sources": ["https://example.com/source"]
    }
  ]
}
```

**Health Check:** `GET /`
```json
{
  "status":  "ok",
  "service": "plagiarism-checker"
}
```

---

## 🔄 CI/CD Pipeline

Automated pipelines using **GitHub Actions**:

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `frontend-ci-cd.yml` | Changes to `frontend/**` | Lint → Build → Push to DockerHub |
| `ai-text-detector-ci-cd.yml` | Changes to `model/**` | Lint → Build → Push to DockerHub |
| `plagiarism-checker-ci-cd.yml` | Changes to `plagiarism-checker/**` | Lint → Build → Push to DockerHub |

### Pipeline Flow

```
Code Push → Lint Check ✓ → Docker Build → Push to DockerHub → Deploy
```

---

## 👥 Team

<table>
  <tr>
    <td align="center">
      <strong>Ali Shahid</strong><br>
      <sub>Full Stack</sub>
    </td>
    <td align="center">
      <strong>Muhammad Ismail</strong><br>
      <sub>Devops</sub>
    </td>
    <td align="center">
      <strong>Fardan Aatir</strong><br>
      <sub>Frontend</sub>
    </td>
  </tr>
</table>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Hugging Face](https://huggingface. co/) for the RoBERTa AI detection model
- [DigitalOcean](https://www.digitalocean.com/) for cloud hosting
- [Vercel](https://vercel.com/) for Next.js framework

---

<div align="center">

**⭐ Star this repository if you found it helpful! **

Made with ❤️ by Ali Shahid, Muhammad Ismail & Fardan Aatir

</div>
