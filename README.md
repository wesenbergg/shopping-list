# Shopping List Application

A modern, responsive shopping list application built with React, TypeScript, and Vite.

## Features

- Create, edit, and delete shopping list items
- Persistent storage using SQLite database
- Modern and responsive user interface
- Comprehensive test coverage with Jest and Cypress

## Prerequisites

- Node.js (Latest LTS version recommended)
- pnpm package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/wesenbergg/shopping-list.git
cd shopping-list
```

2. Install dependencies for both the main app and UI:
```bash
pnpm install
cd ui && pnpm install
```

## Development

To start the development server:

```bash
# In the ui directory
pnpm dev
```

## Production

To start the production server:

1. pnpm run clean:all
2. pnpm run build:all
3. pnpm run start

## Testing

This project includes both unit tests (Vitest) and end-to-end tests (Cypress).

### Unit Tests
```bash
# In the ui directory
pnpm test
```

### End-to-End Tests
```bash
# In the root directory
pnpm cypress run
```

## Project Structure

- `/ui` - Frontend React application
- `/cypress` - End-to-end tests
- `/data` - Database storage
- `app.ts` - Backend application entry point
- `db.ts` - Database configuration and setup

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
