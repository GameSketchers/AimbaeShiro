<div align="center">
  <a href="https://youtu.be/23tSqySN_T4">
    <img src="https://img.youtube.com/vi/23tSqySN_T4/maxresdefault.jpg" alt="Watch the video guide">
  </a>
  <br>
  <sub><b>Click the image above to watch the video guide</b></sub>
</div>


# Krunker.io game.js Deobfuscation Guide

This guide provides a step-by-step process for deobfuscating and analyzing the `game.js` file from the game Krunker.io.

## About This Project

The purpose of this guide is to walk through the process of accessing and making sense of the core `game.js` script. By deobfuscating the code, you can gain insights into the game's mechanics and variables.

## Steps to Deobfuscate

1.  **Open Developer Tools**:
    * On the Krunker.io website, open your browser's developer tools by pressing `Ctrl + Shift + I` or `F12`.

2.  **Locate the Game Socket**:
    * Navigate to the "Network" tab within the developer tools.
    * Filter the connections by "WS" (WebSockets) to find the game's socket connection. Click on it.

3.  **Find `game.js` Content**:
    * In the "Messages" or "Frames" sub-tab for the WebSocket, you will see the data being sent. Look for the message that contains the `game.js` code and copy its entire content.

4.  **Deobfuscate the Code**:
    * Go to an online JavaScript deobfuscator tool like `webcrack.netlify.app`.
    * Paste the copied code into the tool to beautify and deobfuscate it.

## Code Analysis & Edits

After deobfuscating the code, you can analyze and modify it. The video demonstrates several "find and replace" actions to make the code more readable and to identify key variables.

**Important Note:** The obfuscated variable names (like `iiiiii` or `iii.Yhqqc3`) are dynamic and may be different each time you access the game. The key is to find the relevant code blocks and patterns, not to rely on the exact variable names shown in the video. Use the "Find" feature (`Ctrl + F` or `Cmd + F`) in your code editor to search for specific strings or patterns.

Here are the specific replacements made in the video, with a more detailed explanation of the process:

* **Simplifying Event Handling**:
    * **Action:** The code `iiiiii.this.events` was replaced with `iiiiii`.
    * **Details:** The deobfuscated code often has long and repetitive chains for accessing properties. In this case, the developer tools were used to find all instances of `iiiiii.this.events` and replace them with `iiiiii`. This is a common practice to shorten the code and make it easier to read. The name `iiiiii` itself is a placeholder from the obfuscation process and could be different in your version of the code. The goal is to identify a recurring, lengthy property accessor and simplify it.

* **Clarifying Variable Functions**:
    * **Action:** The obfuscated variable `iii.Yhqqc3` was replaced.
    * **Details:** Similarly to the above, this is another example of a variable with a meaningless, obfuscated name. By analyzing the surrounding code, you can often deduce the variable's purpose. In the video, this variable was identified and replaced to give it a more descriptive name, which aids in understanding the code's logic.

* **Targeting Specific Strings**:
    * **Action:** The string `moveLock` was targeted and replaced.
    * **Details:** `moveLock` is a more human-readable string that was likely part of the original source code. Searching for such strings can help you pinpoint specific functionalities within the obfuscated code, in this case, likely related to player movement restrictions.

* **Replacing Obfuscated Names**:
    * **Action:** The obfuscated name `Debkt` was replaced.
    * **Details:** Another example of replacing a randomly generated name to improve code clarity.

* **Analyzing Proxy Checks**:
    * **Action:** The proxy check `window.JFczVgZIQB8rJX.isProxy` was located and replaced.
    * **Details:** This is a crucial part of the code for understanding how the game might detect if a player is using a proxy. The `isProxy` part is a strong indicator of its purpose. The long, randomized string `JFczVgZIQB8rJX` is a classic example of obfuscation. By finding and analyzing this line, you can understand the game's anti-cheat or network security measures.

After making your desired changes, you can save the modified code for further analysis.

## Disclaimer

This project is for educational purposes only. Users are solely responsible for any actions that may violate the terms of service of Krunker.io.
