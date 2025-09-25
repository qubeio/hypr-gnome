# Product Requirements Document (PRD)
## Hyprland-Inspired GNOME Shell Extension

**Version**: 2.0  
**Date**: January 2025  
**Author**: Andreas  
**Status**: Active Development  

---

## 1. Executive Summary

This document outlines the requirements for transforming the existing Simple Tiling GNOME Shell extension into a comprehensive Hyprland-inspired tiling window manager. The goal is to bring Hyprland's powerful keyboard-driven window management, dynamic tiling algorithms, and extensive customization options to GNOME Shell users.

## 2. Project Overview

### 2.1 Background
- **Current State**: Fork of abandoned Simple Tiling extension (v7.2)
- **Target**: Create a feature-rich, Hyprland-inspired tiling extension
- **Compatibility**: GNOME Shell 45+ (modern implementation only)

### 2.2 Objectives
- **Primary**: Replicate Hyprland's core tiling functionality and keyboard shortcuts
- **Secondary**: Maintain GNOME Shell integration and user experience
- **Tertiary**: Provide extensive customization options for power users

## 3. Core Features

### 3.1 Window Management

#### 3.1.1 Tiling Algorithms
- **Master-Stack Layout** (current): Master window + Fibonacci stack

#### 3.1.2 Window States
- **Tiled**: Normal tiling behavior
- **Floating**: Free-floating windows
- **Pseudo-tiled**: Floating but constrained to tile size
- **Fullscreen**: True fullscreen mode

#### 3.1.3 Window Operations
- **Focus Management**: Directional focus navigation
- **Window Swapping**: Move windows between positions
- **Window Resizing**: Dynamic resize with keyboard/mouse
- **Window Moving**: Drag windows between tiles
- **Window Splitting**: Split tiles horizontally/vertically

### 3.2 Keyboard Shortcuts (Hyprland-inspired)

#### 3.2.1 Window Focus
```
Super + h/j/k/l          # Focus left/down/up/right
Super + Left/Down/Up/Right # Focus in direction
Super + Tab              # Focus next window
Super + Shift + Tab      # Focus previous window
Super + m                # Focus master window
Super + c                # Focus center window
```

#### 3.2.2 Window Movement
```
Super + Shift + h/j/k/l  # Move window left/down/up/right
Super + Shift + Left/Down/Up/Right # Move window in direction
Super + Shift + m        # Move window to master
Super + Shift + c        # Move window to center
```

#### 3.2.3 Window Resizing
```
Super + Ctrl + h/j/k/l   # Resize window left/down/up/right
Super + Ctrl + Left/Down/Up/Right # Resize in direction
Super + =                # Increase master width
Super + -                # Decrease master width
Super + Shift + =        # Increase master count
Super + Shift + -        # Decrease master count
```

#### 3.2.4 Layout Management
```
Super + Space            # Next layout
Super + Shift + Space    # Previous layout
Super + t                # Toggle tiling/floating
Super + Shift + t        # Toggle pseudo-tiling
Super + f                # Toggle fullscreen
Super + Shift + f        # Toggle fake fullscreen
```

#### 3.2.5 Workspace Management
```
Super + 1-9              # Switch to workspace
Super + Shift + 1-9      # Move window to workspace
Super + Ctrl + 1-9       # Move window to workspace and follow
Super + Tab              # Next workspace
Super + Shift + Tab      # Previous workspace
Super + g                # Go to workspace
Super + Shift + g        # Move window to workspace
```

#### 3.2.6 Window Splitting
```
Super + Enter            # Split horizontally
Super + Shift + Enter    # Split vertically
Super + Backspace        # Remove split
Super + Shift + Backspace # Remove all splits
```

#### 3.2.7 Application Management
```
Super + d                # Application launcher
Super + Shift + d        # Application launcher (alternative)
Super + q                # Close window
Super + Shift + q        # Kill window
Super + r                # Reload configuration
Super + Shift + r        # Restart extension
```

### 3.3 Advanced Features

#### 3.3.1 Multi-Monitor Support
- **Independent Layouts**: Each monitor has its own layout
- **Window Movement**: Move windows between monitors
- **Focus Management**: Focus windows across monitors
- **Workspace Per Monitor**: Independent workspaces per monitor

#### 3.3.2 Dynamic Workspaces
- **Auto-Creation**: Create workspaces on demand
- **Auto-Destruction**: Remove empty workspaces
- **Workspace Naming**: Custom workspace names
- **Workspace Groups**: Group related workspaces

#### 3.3.3 Window Rules
- **Application Rules**: Per-application behavior
- **Size Rules**: Force specific window sizes
- **Position Rules**: Force window positions
- **Floating Rules**: Auto-float specific applications
- **Workspace Rules**: Auto-assign to workspaces

#### 3.3.4 Animations & Effects
- **Window Animations**: Smooth transitions
- **Focus Animations**: Visual focus indicators
- **Layout Transitions**: Animated layout changes
- **Workspace Transitions**: Smooth workspace switching

## 4. Technical Architecture

### 4.1 File Structure
```
hypr-gnome/
├── extension.js          # Main extension logic (GNOME Shell 45+)
├── prefs.js             # Preferences UI
├── metadata.json        # Extension metadata
├── schemas/             # GSettings schemas
├── layouts/             # Tiling layout algorithms
│   ├── master-stack.js
├── keybindings/         # Keyboard shortcut handlers
│   ├── focus.js
│   ├── movement.js
│   ├── resizing.js
│   ├── layouts.js
│   └── workspaces.js
├── rules/               # Window rules engine
├── animations/          # Animation system
├── monitors/            # Multi-monitor support
└── docs/                # Documentation
```

### 4.2 Core Components

#### 4.2.1 TilingManager
- **Responsibility**: Core tiling logic and layout management
- **Features**: Layout switching, window arrangement, resize handling
- **Dependencies**: Meta, Shell, Gio

#### 4.2.2 KeybindingManager
- **Responsibility**: Keyboard shortcut handling
- **Features**: Shortcut registration, conflict resolution, customization
- **Dependencies**: Shell, Gio

#### 4.2.3 WorkspaceManager
- **Responsibility**: Workspace creation, destruction, and management
- **Features**: Dynamic workspaces, workspace rules, multi-monitor support
- **Dependencies**: Meta, Shell

#### 4.2.4 WindowRules
- **Responsibility**: Window behavior rules and exceptions
- **Features**: Application rules, size/position rules, floating rules
- **Dependencies**: Meta, Gio

#### 4.2.5 AnimationEngine
- **Responsibility**: Smooth transitions and visual effects
- **Features**: Window animations, focus effects, layout transitions
- **Dependencies**: Clutter, Meta

### 4.3 Configuration System

#### 4.3.1 GSettings Schema
```xml
<schema id="org.gnome.shell.extensions.hypr-gnome">
  <!-- Layout Settings -->
  <key name="default-layout" type="s">
    <default>'master-stack'</default>
  </key>
  <key name="layout-cycle" type="as">
    <default>['master-stack', 'dwindle', 'spiral', 'monocle']</default>
  </key>
  
  <!-- Window Gaps -->
  <key name="inner-gap" type="i">
    <default>10</default>
  </key>
  <key name="outer-gap-horizontal" type="i">
    <default>5</default>
  </key>
  <key name="outer-gap-vertical" type="i">
    <default>5</default>
  </key>
  
  <!-- Keybindings -->
  <key name="focus-left" type="as">
    <default>['<Super>h', '<Super>Left']</default>
  </key>
  <!-- ... more keybindings ... -->
  
  <!-- Advanced Settings -->
  <key name="enable-animations" type="b">
    <default>true</default>
  </key>
  <key name="animation-duration" type="i">
    <default>200</default>
  </key>
  <key name="multi-monitor-support" type="b">
    <default>true</default>
  </key>
</schema>
```

#### 4.3.2 Configuration File Support
- **Hyprland-style Config**: Support for external config files
- **Hot Reload**: Reload configuration without restart
- **Validation**: Config file validation and error reporting

## 5. User Interface

### 5.1 Preferences UI
- **Modern Design**: Use Adw (Adwaita) components for GNOME 45+
- **Categories**: Organized settings by functionality
- **Live Preview**: Real-time preview of changes

### 5.2 Settings Categories
1. **Layouts**: Layout selection and configuration
2. **Keybindings**: Keyboard shortcut customization
3. **Appearance**: Gaps, borders, animations
4. **Workspaces**: Workspace behavior and rules
5. **Applications**: Window rules and exceptions
6. **Advanced**: Performance and debugging options

## 8. Risk Assessment

### 8.1 Technical Risks
- **GNOME API Changes**: Mitigation through modern API usage and testing
- **Performance Issues**: Mitigation through profiling and optimization
- **Compatibility Issues**: Mitigation through extensive testing on GNOME 45+

### 8.2 User Experience Risks
- **Learning Curve**: Mitigation through documentation and tutorials
- **Conflicts with GNOME**: Mitigation through careful integration
- **Feature Bloat**: Mitigation through modular design

## 9. Future Enhancements

### 9.1 Advanced Features
- **Plugin System**: Allow third-party layout algorithms
- **Scripting Support**: Lua/Python scripting for advanced users
- **Theming Support**: Custom themes and visual effects
- **Gesture Support**: Touchpad gesture integration

### 9.2 Integration Features
- **GNOME Shell Integration**: Better integration with shell components
- **Application Integration**: Special handling for specific applications
- **System Integration**: Integration with system settings and preferences

## 10. Conclusion

This PRD outlines a comprehensive plan to transform the Simple Tiling extension into a full-featured, Hyprland-inspired tiling window manager for GNOME Shell. The phased approach ensures steady progress while maintaining stability and user experience.

The extension will provide GNOME users with powerful tiling capabilities while maintaining the familiar GNOME environment, bridging the gap between traditional desktop environments and modern tiling window managers.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: February 2025
