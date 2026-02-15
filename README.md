# Volc 🌋

AI-Native Hyper-Personalized Fitness Coaching.

Volc is an intelligent fitness platform that replaces static workout plans with a dynamic **Coaching Loop**. It uses generative AI to analyze your performance in real-time, adapt your upcoming sets, and provide "forensic" insights into your physical progress.

## 🚀 Getting Started

### For Users

Experience Volc today via our hosted platforms:

- **Mobile**: [Download the iOS App (Beta)](https://apps.apple.com/gb/app/volc/id6751469055)
- **Web**: Access the Admin Dashboard

### For Developers

Want to run the full stack (React Native + FastAPI + Supabase) locally? We have a "rails-only" guide to get you to your first local workout in under 10 minutes.

👉 **[Start the Tutorial: Developer Quickstart](docs/tutorials/getting-started.md)**

## 📚 Documentation Map

We organize our documentation using the [Diátaxis](https://diataxis.fr/) framework to help you find exactly what you need based on your current goal.

| I want to...            | Quadrant       | Link                                                                 |
| :---------------------- | :------------- | :------------------------------------------------------------------- |
| Get the app running     | 🎓 Tutorial    | **[Getting Started](docs/tutorials/getting-started.md)**             |
| Setup the local backend | 🛠️ How-To      | **[Backend Setup](docs/how-to/setup-local-backend.md)**              |
| Understand the AI logic | 🧠 Explanation | **[Architecture & Coaching Loop](docs/explanation/architecture.md)** |
| Explore the State Model | 📖 Reference   | **[Zustand Stores](docs/reference/stores.md)**                       |
| Explore the Services    | 📖 Reference   | **[Backend Services](docs/reference/services.md)**                   |

## 🧠 The "Coaching Loop" Architecture

Unlike traditional fitness apps, Volc doesn't just log data; it **observes** it.

1.  **Input**: User logs a set (Weight/Reps/RPE).
2.  **Observation**: The AI Engine compares performance against historical trends.
3.  **Adaptation**: The Unified Coach adjusts the next exercise or set intensity immediately.
4.  **Telemetry**: Performance data is streamed via WebSockets to provide instant feedback.

## 🛠️ Technical Stack

- **Frontend**: React Native (Expo), Tamagui, Zustand.
- **Backend**: FastAPI (Python), LangChain, PostgreSQL (Supabase).
- **Real-time**: WebSockets for streaming AI reasoning and workout updates.
- **Infrastructure**: Dockerized local development environment.

## 📄 License

Copyright © 2026 Volc. All rights reserved. For licensing inquiries or commercial use, please contact the maintainers.
