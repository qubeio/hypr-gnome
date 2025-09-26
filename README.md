
<h1 align="center">
Hypr-GNOME
</h1>
<h4 align="center">
<span style="display:inline-flex; align-items:center; gap:12px;">
A Hyprland-inspired tiling window manager for GNOME Shell
</span>
</h4>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-3.38--48-blue.svg)](https://www.gnome.org/)

## Introduction

Hypr-GNOME is a comprehensive GNOME Shell extension that brings the power and flexibility of Hyprland's tiling window management to the GNOME desktop environment. Built as a fork of the Simple Tiling extension, it transforms GNOME Shell into a feature-rich, keyboard-driven tiling window manager while maintaining the familiar GNOME user experience.

This extension provides GNOME users with powerful tiling capabilities, extensive customization options, and a complete set of Hyprland-inspired keyboard shortcuts, bridging the gap between traditional desktop environments and modern tiling window managers.

**Compatibility**: GNOME Shell 45+ (X11 and Wayland)

## Features

### Core Tiling Features
* **Master-Stack Layout:** The first window becomes the "master," occupying the left half of the screen. All subsequent windows form a "stack" on the right half, tiled using a space-efficient Fibonacci-style algorithm.
* **Multiple Window States:** Support for tiled, floating, pseudo-tiled, and fullscreen window states.
* **Dynamic Window Operations:** Focus management, window swapping, resizing, moving, and splitting.
* **Configurable New Window Behavior:** Choose whether new windows open as the new master or are appended to the end of the stack.

### Hyprland-Inspired Keyboard Shortcuts
* **Window Focus:** `Alt + h/j/k/l` for directional focus navigation
* **Window Movement:** `Alt + Shift + h/j/k/l` to move windows between positions
* **Window Resizing:** `Alt + Ctrl + h/j/k/l` for dynamic resize operations
* **Layout Management:** `Alt + Space` to cycle through layouts, `Alt + t` to toggle tiling/floating
* **Workspace Management:** `Alt + 1-9` to switch workspaces, `Alt + Shift + 1-9` to move windows
* **Application Management:** `Alt + d` for application launcher, `Alt + q` to close windows

### Advanced Features
* **Multi-Monitor Support:** Independent layouts and workspace management per monitor
* **Dynamic Workspaces:** Auto-creation and destruction of workspaces on demand
* **Window Rules Engine:** Per-application behavior rules, size/position rules, and floating rules
* **Animation System:** Smooth transitions and visual effects for window operations
* **External Configuration:** Support for Hyprland-style config files with hot reload

### User Experience
* **Modern Preferences UI:** Clean, organized settings panel with live preview
* **Exception List:** Use `exceptions.txt` to exclude applications from tiling
* **Smart Pop-up Handling:** Dialogs and pop-ups are automatically centered and kept on top
* **Configurable Gaps:** Adjustable inner and outer window gaps for visual appeal

## Requirements

* **GNOME Shell Version:** 45+ (tested on GNOME 46+)
* **Session Type:** X11 and Wayland (both supported)
* **Monitor Setup:** Single and multi-monitor support
* **Ubuntu/Debian:** Optimized for Ubuntu and Debian-based distributions
* **System Requirements:** sudo privileges for schema installation (GNOME 46+ requirement)

## Installation

### Quick Install (Recommended)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/qubeio/hypr-gnome.git
   cd hypr-gnome
   ```

2. **Install the Extension**
   ```bash
   # Check your GNOME Shell version first (requires 45+)
   gnome-shell --version
   
   # For development/testing (requires sudo for schema)
   task install
   
   # For gallery users (no sudo required)
   task install-user
   ```

3. **Enable the Extension**
   - Open GNOME Extensions app
   - Find "Hypr-GNOME" and toggle it on
   - Or reload GNOME Shell: `Alt + F2`, type `r`, press Enter

**Installation Methods:**
- **Development/Testing**: Uses `task install` (requires sudo for system-wide schema installation)
- **Gallery Users**: Uses `task install-user` (no sudo required, schemas bundled in extension)

### Manual Installation

If you prefer to build the extension manually:

```bash
# For development/testing (requires sudo)
task build
unzip hypr-gnome@qubeio.com-v2.0.zip -d ~/.local/share/gnome-shell/extensions/
sudo cp schemas/org.gnome.shell.extensions.hypr-gnome.gschema.xml /usr/share/glib-2.0/schemas/
sudo glib-compile-schemas /usr/share/glib-2.0/schemas

# For gallery users (no sudo required)
task build-gallery
unzip hypr-gnome@qubeio.com-gallery-v2.0.zip -d ~/.local/share/gnome-shell/extensions/
```

### Uninstall
```bash
# Remove extension and schema (development method)
task uninstall

# Remove extension only (gallery method)
rm -rf ~/.local/share/gnome-shell/extensions/hypr-gnome@qubeio.com
```

### Clean Up
```bash
task clean  # Remove build artifacts and ZIP files
```

## Configuration

### Settings Panel

Access the Hypr-GNOME settings through the GNOME Extensions app:

1. Open **GNOME Extensions** (or **Settings** → **Extensions**)
2. Find **Hypr-GNOME** and click the settings gear icon
3. Configure your preferences in the organized categories:
   - **Layouts**: Layout selection and configuration
   - **Keybindings**: Keyboard shortcut customization  
   - **Appearance**: Gaps, borders, animations
   - **Workspaces**: Workspace behavior and rules
   - **Applications**: Window rules and exceptions
   - **Advanced**: Performance and debugging options

### Keyboard Shortcuts

All keyboard shortcuts can be customized through the settings panel or via the system keyboard shortcuts:

1. Open **Settings** → **Keyboard** → **View and Customize Shortcuts**
2. Scroll to **Custom Shortcuts** section
3. Find all "Hypr-GNOME" shortcuts and modify as needed

### Application Exceptions

To prevent applications from being tiled, add them to the `exceptions.txt` file:

```bash
# Find application WM_CLASS (X11)
xprop WM_CLASS
# Click on the target window

# Find application App ID (Wayland)  
# Alt + F2, type 'lg', press Enter
# Click "Windows" tab, select window, note "app id"
```

Add each application identifier to a new line in `exceptions.txt`:
```
# Floating applications
firefox
gnome-calculator
# Add your applications here
```

### Window Gaps and Margins

Configure visual spacing through the settings panel:
- **Inner Gaps**: Space between tiled windows
- **Outer Gaps**: Space between windows and screen edges
- **Border Width**: Window border thickness

### Advanced Configuration

For power users, Hypr-GNOME supports external configuration files:

```bash
# Create config file
~/.config/hypr-gnome/hypr-gnome.conf

# Example configuration
general {
    gaps_in = 10
    gaps_out = 5
    border_size = 2
}

# Hot reload configuration
Alt + r  # Reload config without restart
```

## Roadmap

### Phase 1: Core Features (Current)
- ✅ Master-Stack layout with Fibonacci tiling
- ✅ Basic keyboard shortcuts
- ✅ Window state management (tiled/floating/fullscreen)
- ✅ Application exceptions system

### Phase 2: Advanced Features (In Development)
- 🔄 Multi-monitor support with independent layouts
- 🔄 Dynamic workspace management
- 🔄 Window rules engine
- 🔄 Animation system
- 🔄 External configuration file support

### Phase 3: Power User Features (Planned)
- 📋 Plugin system for custom layouts
- 📋 Scripting support (Lua/Python)
- 📋 Advanced theming and visual effects
- 📋 Touchpad gesture integration
- 📋 Workspace groups and naming

### Phase 4: Integration (Future)
- 📋 Enhanced GNOME Shell integration
- 📋 Application-specific optimizations
- 📋 System settings integration
- 📋 Performance monitoring and optimization

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
   git clone https://github.com/qubeio/hypr-gnome.git
cd hypr-gnome

# Install development dependencies
make dev-setup

# Run tests
make test

# Build for development
make build-dev
```

## Troubleshooting

### Common Issues

**Extension not working after installation:**
- Ensure GNOME Shell version is 45 or higher
- Check that the extension is enabled in GNOME Extensions
- Reload GNOME Shell: `Alt + F2`, type `r`, press Enter

**Keyboard shortcuts not responding:**
- Check for conflicts with system shortcuts
- Verify shortcuts in Settings → Keyboard → Custom Shortcuts
- Try reloading the extension configuration

**Windows not tiling properly:**
- Check `exceptions.txt` for conflicting applications
- Verify window manager compatibility (X11/Wayland)
- Check extension logs in Looking Glass (`Alt + F2`, type `lg`)

### Getting Help

- 📖 [Documentation](docs/)
- 🐛 [Report Issues](https://github.com/qubeio/hypr-gnome/issues)
- 💬 [Discussions](https://github.com/qubeio/hypr-gnome/discussions)
- 📧 [Contact](mailto:andreas@qubeio.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built as a fork of the [Simple Tiling](https://github.com/Domoel/Simple-Tiling) extension
- Inspired by [Hyprland](https://hyprland.org/) window manager
- Thanks to the GNOME Shell community for their excellent documentation and support

