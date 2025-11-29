# NexShell

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ███╗   ██╗███████╗██╗  ██╗███████╗██╗  ██╗███████╗║
║   ████╗  ██║██╔════╝╚██╗██╔╝██╔════╝██║  ██║██╔════╝║
║   ██╔██╗ ██║█████╗   ╚███╔╝ ███████╗███████║███████╗║
║   ██║╚██╗██║██╔══╝   ██╔██╗ ╚════██║██╔══██║╚════██║║
║   ██║ ╚████║███████╗██╔╝ ██╗███████║██║  ██║███████║║
║   ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝║
║                                                       ║
║        A secure, sandboxed terminal shell            ║
║        Built with Electron + TypeScript + React      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

> **Local-first terminal shell** with real shell features (pipes, redirection, background jobs) running in a **secure TypeScript sandbox**. No external process execution—pure Node.js APIs.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Window                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Renderer       │  IPC    │     Main         │    │
│  │   (React UI)     │◄───────►│   (Backend)      │    │
│  │                  │         │                  │    │
│  │  • TerminalView  │         │  • Command Exec │    │
│  │  • IntroScreen   │         │  • Shell Parser │    │
│  │  • Syntax Highl. │         │  • Job Manager  │    │
│  └──────────────────┘         │  • Security     │    │
│                                └──────────────────┘    │
│                                         │              │
│                                         ▼              │
│                                ┌──────────────────┐    │
│                                │  Command Registry│    │
│                                │  • Core Commands │    │
│                                │  • Admin (nexus) │    │
│                                └──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Core Shell Features
```
┌─────────────────────────────────────────────────────────┐
│  📁 File Operations    │  🔍 Text Processing           │
│  • ls, pwd, cd, cat    │  • grep, sort, unique        │
│                        │                               │
│  🌐 Network            │  ⚙️  System                   │
│  • fetch (URL/file)    │  • jobs, killjobs            │
│                        │  • nexus (admin)              │
│                        │                               │
│  🔗 Shell Features     │  🔒 Security                 │
│  • pipes (|)           │  • Sandboxed execution        │
│  • redirection (>, <) │  • Path validation           │
│  • background jobs (&) │  • IPC validation            │
└─────────────────────────────────────────────────────────┘
```

### Nexus Admin Commands
```
nexus status    → System uptime, memory, CPU
nexus system    → Detailed hardware info
nexus network   → Network interfaces
nexus users     → User information
nexus env       → Environment variables
nexus version   → Version info
nexus config    → Security settings
nexus clear     → Clear terminal
```

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development mode
npm run dev

# Build for production
npm run build

# Package application
npm run package
```

---

## 📋 Commands

### Core Commands
| Command | Description | Example |
|---------|-------------|---------|
| `ls` | List directory | `ls` |
| `pwd` | Print working directory | `pwd` |
| `cd <path>` | Change directory | `cd ./src` |
| `cat <file>` | Display file contents | `cat README.md` |
| `fetch <url\|file>` | Fetch URL or read file | `fetch https://api.example.com` |
| `grep <pattern> <file>` | Search for pattern | `grep "error" log.txt` |
| `sort <file>` | Sort lines | `sort data.txt` |
| `unique <file>` | Remove duplicates | `unique data.txt` |
| `jobs` | List background jobs | `jobs` |
| `killjobs <id>` | Kill background job | `killjobs 1` |
| `help` | Show command reference | `help` |

### Shell Features

**Pipes**
```bash
cat file.txt | grep "pattern" | sort
```

**Redirection**
```bash
ls > output.txt
cat < input.txt
grep "test" < file.txt > results.txt
```

**Background Jobs**
```bash
fetch https://example.com &
jobs
killjobs 1
```

---

## 🔒 Security

```
┌─────────────────────────────────────────────┐
│  ✓ No external process execution           │
│  ✓ Path traversal protection               │
│  ✓ IPC payload validation                  │
│  ✓ File size limits (50KB)                 │
│  ✓ Sandboxed TypeScript execution          │
│  ✓ Content Security Policy (CSP)           │
│  ✓ Context isolation enabled               │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

- **Electron** - Desktop framework
- **TypeScript** - Type safety
- **React** - UI framework
- **Vite** - Build tool
- **Node.js APIs** - File system, network

---

## 📝 License

Built by **Savitender Singh**

---

## 🎯 Project Status

**Version:** `0.1.0`

Active development. Core shell features implemented with security hardening.
