<h1 align="center">🌸 Krunker.io Game.js Deobfuscation Guide</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Target-Krunker.io-ff66cc?style=for-the-badge&logo=krunker&logoColor=white" alt="Target Krunker">
  <img src="https://img.shields.io/badge/Language-JavaScript-ff66cc?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript">
  <img src="https://img.shields.io/badge/Tool-WebCrack-ff66cc?style=for-the-badge&logo=netlify&logoColor=white" alt="WebCrack">
  <img src="https://img.shields.io/badge/Difficulty-Advanced-ff66cc?style=for-the-badge&logo=hackthebox&logoColor=white" alt="Difficulty">
</p>

<div align="center">
  <a href="https://youtu.be/23tSqySN_T4">
    <img src="https://img.youtube.com/vi/23tSqySN_T4/maxresdefault.jpg" alt="Watch the video guide" style="border-radius: 10px; box-shadow: 0px 0px 20px rgba(255, 102, 204, 0.4);">
  </a>
  <br>
  <sub><b>👆 Click the image above to watch the full video tutorial 👆</b></sub>
</div>

---

## 📖 Overview

This guide provides a comprehensive, step-by-step walkthrough for deobfuscating and analyzing the core `game.js` file of **Krunker.io**. Understanding the structure of this file is essential for reverse engineering, script analysis, and understanding how the game client communicates with the server.

> [!NOTE]
> This guide is based on the manual extraction and analysis method shown in the video. It focuses on identifying patterns rather than copy-pasting code, as Krunker obfuscation changes frequently.

---

## ⚠️ Important: Understanding Dynamic Obfuscation

Before you begin, you **MUST** understand that Krunker.io uses dynamic obfuscation.

*   **Variables change every update:** Strings like `iiiiii`, `Yhqqc3`, `JFczVg`, or `Debkt` are **randomly generated**.
*   **Do not search for exact names:** If you search for `Yhqqc3` in your file, you probably won't find it.
*   **Look for patterns:** You must look for the *structure* of the code (e.g., how events are called, or where `moveLock` is located) rather than the specific variable names shown in the screenshots or video.

---

## 🛠️ Tools Required

1.  **Modern Web Browser** (Chrome, Edge, Brave, etc.)
2.  **Developer Tools** (Built-in)
3.  **WebCrack** (Online Deobfuscator) - [Visit WebCrack](https://webcrack.netlify.app/)
4.  **Text Editor** (VS Code, Sublime Text, or Notepad++)

---

## 🚀 Step-by-Step Guide

### 1. Intercepting the Source Code
The `game.js` file is loaded dynamically. To catch it, we need to inspect the network traffic.

1.  Open **Krunker.io** in your browser.
2.  Open **Developer Tools**:
    *   Press `F12` or `Ctrl + Shift + I`.
3.  Navigate to the **Network** tab.
4.  In the filter bar, click on **WS** (WebSockets) to filter the traffic.
5.  Refresh the page (`F5`) if necessary to catch the initial connection.
6.  Look for the game socket connection (often a random URL or one ending in `/ws`).

### 2. Extracting the Payload
1.  Click on the WebSocket connection you found.
2.  Go to the **Messages** (or **Response**) tab inside the network panel.
3.  Look for a large message frame that initializes the game. This contains the raw `game.js` logic.
4.  **Right-click** the message and select **Copy Message** (or copy the text content).

### 3. Deobfuscation Process
The raw code is "minified" and "obfuscated," making it unreadable. We need to make it human-readable.

1.  Go to [WebCrack](https://webcrack.netlify.app/).
2.  **Paste** the copied code into the input box.
3.  Click **Deobfuscate** / **Crack**.
4.  Wait for the process to finish.
5.  **Copy** the output code into your Text Editor (e.g., VS Code) for analysis.

---

## 🧠 Code Analysis & Refactoring

Now that you have the readable code, we need to find specific logic blocks. Remember, **ignore the random variable names** and focus on the logic shown below.

### 🔍 1. Fixing Event Handlers
The game often wraps event listeners in complex chains. We want to simplify references to `this.events`.

*   **Search for:** Code logic that handles packet events.
*   **Pattern:** Often looks like `variable.this.events`.
*   **Action:**
    *   Find instances where the code references the event manager.
    *   Replace the long obfuscated chain (e.g., `iiiiii.this.events`) with a simpler variable name (e.g., `iiiiii`) or mapped name.
    *   *Note in Video:* The user replaces `iiiiii.this.events` assignments to clean up the logic flow.

### 🔍 2. Identifying Configuration Variables
There are specific boolean flags or configuration objects used for anti-cheat or game settings.

*   **Target:** `iii.Yhqqc3` (Example Name)
*   **How to find it:** Look for variables that toggle visibility or rendering settings near the main update loop.
*   **Refactoring:**
    *   Once identified, use **Ctrl + H** (Replace All).
    *   Replace the random string `iii.Yhqqc3` with something descriptive if you can confirm its function, or simply trace where it is used.

### 🔍 3. Locating Movement Logic (`moveLock`)
One of the few things that often remains in plain text is string literals.

*   **Search Keyword:** `moveLock`
*   **Context:** This string is usually associated with movement restrictions or the "slide" mechanic.
*   **Action:**
    *   Press `Ctrl + F` and search for `"moveLock"`.
    *   This will lead you to the `this.update` or player movement function.
    *   By finding this, you can identify the variables surrounding it, which control player X/Y/Z coordinates.

### 🔍 4. Cleaning Random Function Names (`Debkt`)
You will see function calls like `Debkt()`.

*   **Action:** These are often utility functions (math helpers, decoding helpers).
*   **Strategy:** If you see a function being called repeatedly with random names, you can rename them globally to `func_1`, `func_2`, etc., to make the code less cluttered, though standard deobfuscators often handle this.

### 🔍 5. Anti-Cheat & Proxy Detection
The game checks if it's running in a trusted environment.

*   **Pattern:** `window.[RANDOM_STRING].isProxy`
*   **Example from Video:** `window.JFczVgZIQB8rJX.isProxy`
*   **How to find:**
    *   Search for `.isProxy` inside the code.
    *   If that fails, search for `window.` and look for long, suspicious random property access.
*   **Significance:** This block is crucial. It determines if the game detects a modified client or a browser extension injecting code. Understanding this logic is key to bypassing checks.

---

## 📝 Summary of Key Replacements

| Obfuscated Pattern (Example) | Likely Meaning | Search Strategy |
| :--- | :--- | :--- |
| `iiiiii.this.events` | Event Manager | Look for `.events` property access. |
| `iii.Yhqqc3` | Config/Visibility | Look for booleans toggled in render loops. |
| `"moveLock"` | Movement State | Search text string `"moveLock"`. |
| `window.JFc...isProxy` | Anti-Tamper Check | Search for `isProxy` or window properties. |

---

## ⚖️ Disclaimer

> This project and guide are for **educational purposes only**. The information provided here is intended to help developers understand web security, obfuscation techniques, and JavaScript code analysis.
>
> We do not encourage hacking, cheating, or violating the Terms of Service of Krunker.io. Users are solely responsible for any actions taken using this information.

---

<p align="center">
  <sub>Guide generated based on visual analysis of the provided tutorial.</sub>
</p>
