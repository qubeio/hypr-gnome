# Simple Tiling

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![GNOME Shell Version](https://img.shields.io/badge/GNOME%20Shell-3.38-blue)

A lightweight, opinionated, and automatic tiling window manager for GNOME Shell 3.38.

<img width="2560" height="1440" alt="Simple-Tiling" src="https://github.com/user-attachments/assets/18fcbb34-3e0e-45b8-abe1-0e752b8d970c" />
*A screenshot of the extension in action with a master window and a Fibonacci-tiled stack.*

## Introduction

Simple Tiling is a GNOME Shell extension created for users who want a clean, predictable, and automatic tiling layout without the complexity of larger, more feature-heavy tiling extensions. It is designed to be simple to configure and intuitive to use, focusing on a core set of essential tiling features.

This extension was built from the ground up to be stable and performant on **GNOME Shell 3.38**.

## Features

* **Automatic Tiling:** Windows are automatically arranged into a master and stack layout without any manual intervention.
* **Master & Fibonacci Stack Layout:** The first window becomes the "master," occupying the left half of the screen. All subsequent windows form a "stack" on the right half, which is tiled using a space-efficient Fibonacci-style algorithm.
* **Tiling Lock:** The layout is strict by default. If you manually move a window with the mouse and drop it in an empty space, it will automatically "snap back" to its designated tile position, preserving the integrity of the layout.
* **Interactive Window Swapping:**
    * **Drag & Drop:** Swap any two windows by simply dragging one and dropping it over the other.
    * **Keyboard Shortcuts:** A full set of keyboard shortcuts allows you to swap the focused window with the master or with its nearest neighbor in any direction (left, right, up, down).
* **Configurable Gaps:** Easily configure inner and outer gaps by editing variables directly in the `extension.js` code to achieve your desired aesthetic.
* **External Exception List:** Use a simple `exceptions.txt` file to list applications (by their `WM_CLASS`) that should be ignored by the tiling manager.
* **Smart Pop-up Handling:** Windows on the exception list, as well as dialogs and other pop-ups, are automatically centered and kept "always on top" for a smooth workflow.

## Requirements

Please note that this extension has been developed for a very specific environment:

* **GNOME Shell Version:** **3.38**
* **Session Type:** **X11** (Wayland is not supported).
* **Monitor Setup:** **Single monitor only.** Multi-monitor support is not yet implemented.

## Installation

#### From extensions.gnome.org (Recommended)

*(Link to be added once the extension is published)*

#### Manual Installation

1.  **Clone the repository** into your local extensions directory:
    ```bash
    git clone [[https://github.com/YOUR_USERNAME/YOUR_REPOSITORY](https://github.com/Domoel/Simple-Tiling).git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git) ~/.local/share/gnome-shell/extensions/simple-tiling@domoel
    ```
2.  **Compile the GSettings schema.** This is a mandatory step for the keyboard shortcuts to work.
    ```bash
    cd ~/.local/share/gnome-shell/extensions/simple-tiling@domoel/
    glib-compile-schemas schemas/
    ```
3.  **Restart GNOME Shell.** Press `Alt` + `F2`, type `r`, and press `Enter`.
4.  **Enable the extension** using the GNOME Extensions app or GNOME Tweaks.

## Configuration

#### Keyboard Shortcuts

All keyboard shortcuts can be configured through the standard GNOME Settings panel:
1.  Open **Settings**.
2.  Navigate to **Keyboard** -> **View and Customize Shortcuts**.
3.  Scroll down to the **Custom Shortcuts** section at the bottom.
4.  You will find all shortcuts for "Simple Tiling" listed there and can change them to your preference.

#### Ignoring Applications (`exceptions.txt`)

To prevent an application from being tiled, you can add its `WM_CLASS` to the `exceptions.txt` file in the extension's directory.

* Each application's `WM_CLASS` should be on a new line.
* Lines starting with `#` are treated as comments and are ignored.
* The check is case-insensitive.

To find an application's `WM_CLASS`, open a terminal and run the command `xprop WM_CLASS`. Your cursor will turn into a crosshair. Click on the window of the application you want to exclude.

*Example `exceptions.txt`:*
