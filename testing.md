# Testing Strategy for Hypr-GNOME

## Overview

This document provides a comprehensive testing strategy for developing and testing the Hypr-GNOME extension locally. It covers the development workflow, testing methodologies, and step-by-step instructions for ensuring quality and reliability throughout the development process.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Development Workflow](#development-workflow)
4. [Testing Methodologies](#testing-methodologies)
5. [Local Testing Procedures](#local-testing-procedures)
6. [Quality Assurance Checklist](#quality-assurance-checklist)
7. [Troubleshooting Guide](#troubleshooting-guide)

## Development Environment Setup

### Prerequisites

- **GNOME Shell**: Version 3.38 - 48+ (test on multiple versions)
- **Session Type**: Both X11 and Wayland support
- **Development Tools**: 
  - `git` for version control
  - `make` for building (existing Makefile)
  - `glib-compile-schemas` for schema compilation
  - `zip` for packaging
  - `unzip` for installation
- **Optional**: GoTask (`task`) for enhanced build automation

### Initial Setup

1. **Clone and Navigate to Project**
   ```bash
   git clone <repository-url>
   cd hypr-gnome
   ```

2. **Check GNOME Shell Version**
   ```bash
   gnome-shell --version
   # Note: Test on your target version(s)
   ```

3. **Verify Development Tools**
   ```bash
   which make glib-compile-schemas zip unzip
   # Install missing tools if needed
   ```

4. **Create Development Directories** (as per TODO.md)
   ```bash
   mkdir -p layouts keybindings rules animations monitors docs tests
   ```

## Testing Infrastructure

### File Structure for Testing

```
hypr-gnome/
├── tests/                          # Test directory
│   ├── unit/                       # Unit tests
│   │   ├── tiling-manager.test.js
│   │   ├── keybinding-manager.test.js
│   │   ├── workspace-manager.test.js
│   │   ├── window-rules.test.js
│   │   └── animation-engine.test.js
│   ├── integration/                # Integration tests
│   │   ├── layout-switching.test.js
│   │   ├── multi-monitor.test.js
│   │   └── workspace-management.test.js
│   ├── e2e/                        # End-to-end tests
│   │   ├── keyboard-shortcuts.test.js
│   │   ├── window-operations.test.js
│   │   └── user-workflows.test.js
│   ├── fixtures/                   # Test data and fixtures
│   │   ├── mock-windows.js
│   │   ├── test-configs/
│   │   └── sample-exceptions.txt
│   ├── helpers/                    # Test utilities
│   │   ├── test-runner.js
│   │   ├── mock-gnome-apis.js
│   │   └── assertion-helpers.js
│   └── README.md                   # Testing documentation
├── Taskfile.yml                    # Build and test automation
└── .github/workflows/              # CI/CD (future)
    └── test.yml
```

### Test Categories

#### 1. Unit Tests
- **Purpose**: Test individual components in isolation
- **Scope**: Each manager class, utility functions, configuration parsing
- **Tools**: Custom test runner with GNOME Shell API mocking
- **Coverage**: Expected behavior, edge cases, failure scenarios

#### 2. Integration Tests
- **Purpose**: Test component interactions and data flow
- **Scope**: Manager interactions, configuration application, state management
- **Tools**: Test environment with partial GNOME Shell integration
- **Coverage**: Component communication, state synchronization

#### 3. End-to-End Tests
- **Purpose**: Test complete user workflows
- **Scope**: Keyboard shortcuts, window operations, user interactions
- **Tools**: Automated testing with real GNOME Shell environment
- **Coverage**: User scenarios, keyboard shortcuts, visual feedback

## Development Workflow

### 1. Feature Development Cycle

```bash
# 1. Create feature branch
git checkout -b feature/tiling-manager

# 2. Implement feature with tests
# - Write failing tests first (TDD approach)
# - Implement feature to pass tests
# - Refactor while keeping tests green

# 3. Local testing
make test                    # Run all tests
make test-unit              # Run unit tests only
make test-integration       # Run integration tests only
make test-e2e              # Run end-to-end tests only

# 4. Build and install for manual testing
make build-modern          # Build for your GNOME version
make install-modern        # Install locally
# Test manually in GNOME Shell

# 5. Clean up and commit
make clean
git add .
git commit -m "feat: implement tiling manager with tests"
```

### 2. Testing During Development

#### Before Writing Code
1. **Write Test Cases**: Define expected behavior, edge cases, and failure scenarios
2. **Run Tests**: Ensure they fail (Red phase of TDD)
3. **Document Requirements**: Update test documentation

#### During Implementation
1. **Run Tests Frequently**: After each significant change
2. **Check Test Coverage**: Ensure all code paths are tested
3. **Validate Edge Cases**: Test boundary conditions and error states

#### After Implementation
1. **Full Test Suite**: Run complete test suite
2. **Manual Testing**: Test in real GNOME Shell environment
3. **Performance Testing**: Check for memory leaks and performance issues

## Testing Methodologies

### 1. Test-Driven Development (TDD)

**Red-Green-Refactor Cycle:**
1. **Red**: Write failing test
2. **Green**: Write minimal code to pass test
3. **Refactor**: Improve code while keeping tests green

**Example for TilingManager:**
```javascript
// tests/unit/tiling-manager.test.js
describe('TilingManager', () => {
    test('should arrange windows in master-stack layout', () => {
        // Arrange
        const manager = new TilingManager();
        const windows = createMockWindows(3);
        
        // Act
        manager.arrangeWindows(windows, 'master-stack');
        
        // Assert
        expect(windows[0].x).toBe(0); // Master window
        expect(windows[0].width).toBeGreaterThan(windows[1].width);
    });
    
    test('should handle single window edge case', () => {
        // Test edge case
    });
    
    test('should throw error for invalid layout', () => {
        // Test failure case
    });
});
```

### 2. Behavior-Driven Development (BDD)

**Given-When-Then Structure:**
```javascript
describe('Window Focus Navigation', () => {
    test('should focus next window when Super+Tab is pressed', () => {
        // Given: Multiple windows are open
        const windows = createMockWindows(3);
        const manager = new TilingManager();
        manager.arrangeWindows(windows);
        
        // When: Super+Tab is pressed
        const result = manager.focusNextWindow();
        
        // Then: Focus should move to next window
        expect(result.focusedWindow).toBe(windows[1]);
    });
});
```

### 3. Property-Based Testing

**Test Properties Rather Than Specific Values:**
```javascript
describe('Window Arrangement Properties', () => {
    test('all windows should fit within screen bounds', () => {
        // Test with various window counts and screen sizes
        for (let i = 1; i <= 10; i++) {
            const windows = createMockWindows(i);
            const arranged = manager.arrangeWindows(windows);
            
            arranged.forEach(window => {
                expect(window.x).toBeGreaterThanOrEqual(0);
                expect(window.x + window.width).toBeLessThanOrEqual(screenWidth);
            });
        }
    });
});
```

## Local Testing Procedures

### 1. Automated Testing

#### Setup Test Runner
```bash
# Create test runner script
cat > tests/helpers/test-runner.js << 'EOF'
#!/usr/bin/env gjs

// Test runner for Hypr-GNOME
const { GLib } = imports.gi;

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async run() {
        print(`Running ${this.tests.length} tests...\n`);
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                print(`✓ ${test.name}\n`);
                this.passed++;
            } catch (error) {
                print(`✗ ${test.name}: ${error.message}\n`);
                this.failed++;
            }
        }
        
        print(`\nResults: ${this.passed} passed, ${this.failed} failed\n`);
        return this.failed === 0;
    }
}

// Export for use in test files
global.TestRunner = TestRunner;
EOF

chmod +x tests/helpers/test-runner.js
```

#### Run Tests
```bash
# Run all tests
gjs tests/helpers/test-runner.js

# Run specific test categories
gjs tests/unit/tiling-manager.test.js
gjs tests/integration/layout-switching.test.js
```

### 2. Manual Testing Procedures

#### Installation Testing
```bash
# 1. Build extension
make build-modern  # or build-legacy/build-interim

# 2. Install extension
make install-modern

# 3. Enable extension
# - Open GNOME Extensions app
# - Find "Hypr-GNOME" and toggle on
# - Or reload GNOME Shell: Alt+F2, type 'r', Enter

# 4. Verify installation
# - Check extension is enabled
# - Verify no error messages in Looking Glass (Alt+F2, type 'lg')
```

#### Functional Testing Checklist

**Basic Tiling:**
- [ ] Open multiple windows
- [ ] Verify master-stack layout is applied
- [ ] Check window gaps and positioning
- [ ] Test with different window sizes

**Keyboard Shortcuts:**
- [ ] Test focus navigation (Super+h/j/k/l)
- [ ] Test window movement (Super+Shift+h/j/k/l)
- [ ] Test window resizing (Super+Ctrl+h/j/k/l)
- [ ] Test layout switching (Super+Space)
- [ ] Test workspace management (Super+1-9)

**Window States:**
- [ ] Test floating windows (Super+t)
- [ ] Test fullscreen (Super+f)
- [ ] Test pseudo-tiled windows
- [ ] Test window state persistence

**Multi-Monitor:**
- [ ] Test with multiple monitors
- [ ] Verify independent layouts per monitor
- [ ] Test window movement between monitors
- [ ] Test focus management across monitors

**Configuration:**
- [ ] Test settings panel functionality
- [ ] Verify configuration persistence
- [ ] Test external config file support
- [ ] Test hot reload (Super+r)

### 3. Performance Testing

#### Memory Usage Monitoring
```bash
# Monitor extension memory usage
watch -n 1 'ps aux | grep gnome-shell | grep -v grep'

# Check for memory leaks
# - Open/close many windows
# - Switch layouts frequently
# - Monitor memory usage over time
```

#### Performance Benchmarks
```bash
# Test layout calculation performance
time gjs tests/performance/layout-benchmark.js

# Test with many windows (stress test)
gjs tests/performance/stress-test.js
```

### 4. Compatibility Testing

#### GNOME Shell Versions
```bash
# Test on different GNOME versions
# - GNOME 3.38 (legacy)
# - GNOME 40-44 (interim)  
# - GNOME 45+ (modern)

# Build and test each version
make build-legacy && make install-legacy
make build-interim && make install-interim
make build-modern && make install-modern
```

#### Session Types
- [ ] Test on X11 session
- [ ] Test on Wayland session
- [ ] Verify window manager compatibility
- [ ] Test different display configurations

## Quality Assurance Checklist

### Code Quality
- [ ] All functions have JSDoc comments
- [ ] Code follows project style guidelines
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Memory leaks are prevented

### Test Coverage
- [ ] Unit tests cover all public methods
- [ ] Edge cases are tested
- [ ] Error conditions are tested
- [ ] Integration tests cover component interactions
- [ ] E2E tests cover user workflows

### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic has inline comments
- [ ] README.md is updated
- [ ] API documentation is current
- [ ] Migration notes are provided

### Performance
- [ ] No memory leaks detected
- [ ] Layout calculations are efficient
- [ ] Keyboard shortcuts respond quickly
- [ ] Extension doesn't impact system performance

### Compatibility
- [ ] Works on target GNOME versions
- [ ] Compatible with X11 and Wayland
- [ ] No conflicts with system shortcuts
- [ ] Graceful degradation on older systems

## Troubleshooting Guide

### Common Issues

#### Extension Not Loading
```bash
# Check extension status
gnome-extensions list | grep hypr-gnome

# Check for errors
journalctl -f | grep gnome-shell

# Reload GNOME Shell
Alt+F2, type 'r', Enter
```

#### Keyboard Shortcuts Not Working
```bash
# Check for conflicts
gsettings list-recursively org.gnome.desktop.wm.keybindings | grep -i super

# Verify extension keybindings
gsettings list-recursively org.gnome.shell.extensions.hypr-gnome

# Test in Looking Glass
Alt+F2, type 'lg', Enter
```

#### Windows Not Tiling
```bash
# Check exceptions.txt
cat exceptions.txt

# Verify window manager
echo $XDG_SESSION_TYPE

# Check extension logs
journalctl -f | grep "hypr-gnome"
```

#### Performance Issues
```bash
# Monitor system resources
htop

# Check for memory leaks
valgrind --tool=memcheck gjs extension.js

# Profile extension
gjs --profile extension.js
```

### Debug Mode

#### Enable Debug Logging
```javascript
// Add to extension.js
const DEBUG = true;

function debugLog(message) {
    if (DEBUG) {
        console.log(`[Hypr-GNOME] ${message}`);
    }
}
```

#### Use Looking Glass
```bash
# Open Looking Glass
Alt+F2, type 'lg', Enter

# Check extension status
# - Look for error messages
# - Verify extension is loaded
# - Check for JavaScript errors
```

### Recovery Procedures

#### Reset Extension
```bash
# Disable extension
gnome-extensions disable hypr-gnome@your-id

# Remove extension
rm -rf ~/.local/share/gnome-shell/extensions/hypr-gnome@your-id

# Reinstall
make install-modern
gnome-extensions enable hypr-gnome@your-id
```

#### Reset Configuration
```bash
# Reset GSettings
gsettings reset-recursively org.gnome.shell.extensions.hypr-gnome

# Remove external config
rm ~/.config/hypr-gnome/hypr-gnome.conf
```

## Continuous Integration (Future)

### GitHub Actions Setup
```yaml
# .github/workflows/test.yml
name: Test Hypr-GNOME

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        gnome-version: [3.38, 42, 45]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup GNOME Shell ${{ matrix.gnome-version }}
      run: |
        # Setup GNOME environment
        # Install dependencies
        # Build extension
    
    - name: Run Tests
      run: |
        make test
        make test-e2e
    
    - name: Build and Package
      run: make build
```

## Conclusion

This testing strategy provides a comprehensive framework for developing and testing the Hypr-GNOME extension. By following these procedures, developers can ensure:

- **Quality**: Thorough testing at all levels
- **Reliability**: Consistent behavior across environments
- **Maintainability**: Well-tested, documented code
- **Performance**: Optimized, leak-free implementation
- **Compatibility**: Support for multiple GNOME versions

Remember to adapt these procedures as the project evolves and new requirements emerge. The key is to maintain a balance between thorough testing and development velocity.

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Next Review**: February 2025
