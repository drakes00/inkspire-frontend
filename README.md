<p align="center">
  <img src="logo.png" alt="InkSpire Logo" width="200"/>
</p>

# InkSpire Frontend

InkSpire is a modern web-based text editor designed for writers who want to leverage the power of AI to enhance their creative process. It provides a clean and organized interface for managing files and directories, along with AI-powered tools to rephrase, translate, and generate text.

## ✨ Features

-   **File System Navigation**: A hierarchical tree view to easily organize and navigate through your files and directories.
-   **Rich Text Editor**: A simple and focused writing environment.
-   **AI-Powered Assistance**:
    -   **Rephrase**: Select text to have it rephrased by the AI.
    -   **Translate**: Translate your text into different languages.
    -   **Add Content**: Ask the AI to generate and add new content to your document.
-   **User Authentication**: Secure login system to protect your work.
-   **Dynamic UI**: Interactive menus and modals for a smooth user experience.

## 🛠️ Tech Stack

-   **[Angular](https://angular.io/)**: A powerful framework for building dynamic single-page applications.
-   **[Angular Material](https://material.angular.io/)**: A UI component library for creating a clean and modern user interface.
-   **[TypeScript](https://www.typescriptlang.org/)**: Superset of JavaScript that adds static typing.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)

### Installation & Running

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd inkspire-frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:4200/`. It will automatically reload if you make changes to the source files.

## 📂 Project Structure

The core application logic is located in the `src/app` directory:

```
src/app/
├── components/
│   ├── tree-file/    # The main file system navigation component
│   ├── text-component/ # The main text editor component
│   ├── modal/          # Reusable modal for user input
│   └── ...
├── services/
│   ├── files-manager.service.ts  # Handles all API calls for file/directory operations
│   ├── ollama.service.ts         # Interacts with the Ollama AI service
│   ├── auth.interceptor.ts       # Intercepts HTTP requests to handle authentication
│   └── ...
├── app.routes.ts     # Defines the application's routes (login, main page)
└── ...
```

---

*This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.9.*

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.