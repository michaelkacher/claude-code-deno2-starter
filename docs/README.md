# Documentation Index

This directory contains comprehensive documentation for the Deno 2 + Fresh starter template.

---

## Quick Start Guides

| Document | Description |
|----------|-------------|
| [QUICK_SETUP.md](QUICK_SETUP.md) | Get started in 5 minutes |
| [QUICK_START_CUSTOMIZATION.md](QUICK_START_CUSTOMIZATION.md) | Customize the template for your project |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Common commands and patterns |

---

## Core Architecture

| Document | Description |
|----------|-------------|
| [architecture.md](architecture.md) | System architecture overview |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | REST API reference |
| [ADVANCED_AUTH.md](ADVANCED_AUTH.md) | Authentication & authorization deep dive |

---

## Background Job Queue System 🚀

The queue system has undergone three major optimizations for production-grade performance.

### Overview & Summary

| Document | Description |
|----------|-------------|
| **[QUEUE_OPTIMIZATIONS_SUMMARY.md](QUEUE_OPTIMIZATIONS_SUMMARY.md)** | ⭐ **Start here!** High-level overview of all three optimizations |
| **[QUEUE_ARCHITECTURE_EVOLUTION.md](QUEUE_ARCHITECTURE_EVOLUTION.md)** | Visual before/after comparisons with diagrams |
| **[QUEUE_QUICK_REFERENCE.md](QUEUE_QUICK_REFERENCE.md)** | 📋 Quick reference for developers using the queue |
| **[QUEUE_PERFORMANCE_BENCHMARKS.md](QUEUE_PERFORMANCE_BENCHMARKS.md)** | 📊 Real-world performance measurements |

### Individual Optimization Guides

| Document | Optimization | Impact | Status |
|----------|-------------|--------|--------|
| [QUEUE_N1_OPTIMIZATION.md](QUEUE_N1_OPTIMIZATION.md) | N+1 Query Fix | 50% fewer queries | ✅ Complete |
| [QUEUE_CONCURRENCY_FIX.md](QUEUE_CONCURRENCY_FIX.md) | Concurrency Control | 5x faster throughput | ✅ Complete |
| [QUEUE_POLLING_OPTIMIZATION.md](QUEUE_POLLING_OPTIMIZATION.md) | Ready/Scheduled Split | 100x faster polling | ✅ Complete |

### Related Documentation

| Document | Description |
|----------|-------------|
| [BACKGROUND_JOBS.md](BACKGROUND_JOBS.md) | User guide for background jobs |
| [WEBSOCKET_JOBS.md](WEBSOCKET_JOBS.md) | Real-time job updates via WebSockets |

**Performance Summary:**
- **Before**: 1 job per poll cycle, O(N) scanning, 1001 queries for 1000 jobs
- **After**: 5 jobs per poll cycle, O(M) scanning, 1 query for 1000 jobs
- **Improvement**: 50-100x depending on scenario 🎉

---

## Features & Implementation

| Document | Description |
|----------|-------------|
| [DARK_MODE.md](DARK_MODE.md) | Dark mode implementation |
| [FILE_UPLOAD.md](FILE_UPLOAD.md) | File upload with image processing |
| [VALIDATION_MIDDLEWARE.md](VALIDATION_MIDDLEWARE.md) | Request validation with Zod |
| [RATE_LIMITING.md](RATE_LIMITING.md) | API rate limiting (user guide) |
| **[RATE_LIMIT_OPTIMIZATION.md](RATE_LIMIT_OPTIMIZATION.md)** | 🚀 Rate limiting optimization (detailed guide) |
| **[RATE_LIMIT_QUICK_SUMMARY.md](RATE_LIMIT_QUICK_SUMMARY.md)** | 📋 Rate limiting optimization (quick summary) |
| **[RATE_LIMIT_ARCHITECTURE.md](RATE_LIMIT_ARCHITECTURE.md)** | 📊 Rate limiting architecture (visual comparison) |
| [SECURITY_HEADERS.md](SECURITY_HEADERS.md) | Security headers (CSP, CORS, etc.) |

---

## Implementation Phases

| Document | Description |
|----------|-------------|
| [PHASE1_IMPLEMENTATION.md](PHASE1_IMPLEMENTATION.md) | Core features implementation |
| [PHASE2_IMPLEMENTATION.md](PHASE2_IMPLEMENTATION.md) | Advanced features implementation |
| [PROFILE_IMPLEMENTATION.md](PROFILE_IMPLEMENTATION.md) | User profile system |
| [NAVIGATION_REDESIGN.md](NAVIGATION_REDESIGN.md) | Navigation UI improvements |

---

## Production & Deployment

| Document | Description |
|----------|-------------|
| [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) | Production deployment guide |
| [PRODUCTION_ADMIN_SETUP.md](PRODUCTION_ADMIN_SETUP.md) | Setting up admin users in production |

---

## Customization & Improvements

| Document | Description |
|----------|-------------|
| [CUSTOMIZATION.md](CUSTOMIZATION.md) | How to customize the template |
| [IMPROVEMENT_RECOMMENDATIONS.md](IMPROVEMENT_RECOMMENDATIONS.md) | Suggested improvements |

---

## Developer Guides

### Code Optimization

| Document | Description |
|----------|-------------|
| [claude-optimization/](claude-optimization/) | Claude AI optimization guides |
| [dev-notes/](dev-notes/) | Development notes and tips |

### Workflow Guides

| Document | Description |
|----------|-------------|
| [guides/](guides/) | Step-by-step guides for common tasks |

---

## Contributing

| Document | Description |
|----------|-------------|
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |
| [../CHANGELOG.md](../CHANGELOG.md) | Project changelog |

---

## Need Help?

### Common Questions

**Q: How do I get started?**  
A: See [QUICK_SETUP.md](QUICK_SETUP.md)

**Q: How do I customize this template?**  
A: See [QUICK_START_CUSTOMIZATION.md](QUICK_START_CUSTOMIZATION.md)

**Q: How do I understand the queue optimizations?**  
A: Start with [QUEUE_OPTIMIZATIONS_SUMMARY.md](QUEUE_OPTIMIZATIONS_SUMMARY.md), then read [QUEUE_ARCHITECTURE_EVOLUTION.md](QUEUE_ARCHITECTURE_EVOLUTION.md) for visual explanations

**Q: How do I deploy to production?**  
A: See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)

**Q: Where are the API docs?**  
A: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) or visit `/api/docs` when running the app

### Support

- Check existing documentation first
- Look at code examples in `/features` directory
- Review test files in `/tests` directory
- See `/backend/openapi.json` for complete API specification

---

**Last Updated**: November 5, 2025
