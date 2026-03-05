# CoSpace - Collaborative Workspace

A modern, feature-rich Kanban-style project management application built with React, TypeScript, and Tailwind CSS. CoSpace helps teams organize tasks, collaborate on projects, and track progress with an intuitive board-based interface.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19.2-blue)
![Vite](https://img.shields.io/badge/Vite-7.3-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2-38B2AC)

## Overview

CoSpace is a full-featured project management tool featuring:

- 📋 **Multiple Boards** - Create and manage multiple project boards
- 📊 **Kanban Columns** - Organize work into customizable columns (To Do, In Progress, Done, etc.)
- 🎫 **Rich Cards** - Add detailed tasks with descriptions, tags, and due dates
- 📝 **Markdown Support** - Write card descriptions with markdown formatting
- 🏷️ **Tag System** - Categorize and filter cards with custom tags
- 📅 **Due Dates** - Track deadlines and identify overdue tasks
- 🔍 **Search** - Quickly find boards by title or description
- 💾 **Persistent Storage** - Automatic localStorage persistence of all data
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS
- ⚡ **Fast Performance** - Lazy loading and memoization for optimal speed
- ♿ **Accessible** - Full keyboard navigation and ARIA labels

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/cospace.git
cd cospace
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

### Dashboard

When you launch CoSpace, you'll see the Dashboard with your boards. Here you can:

- **Create a new board** - Click "New Board" to add a project
- **Search boards** - Use the search bar to find boards by title or description
- **View board stats** - See the number of columns and cards per board
- **Delete boards** - Click the menu (three dots) on any board card

### Board View

Inside a board, you can:

- **Add columns** - Click "Add Column" to create workflow stages (To Do, In Progress, etc.)
- **Rename columns** - Click the menu on a column header
- **Delete columns** - Removes the column and all its cards
- **Add cards** - Click "Add card" in any column to create tasks
- **Edit cards** - Click the menu on a card to edit or delete it

### Cards

Cards are rich task containers with:

- **Title** - Brief task name
- **Description** - Detailed notes with markdown support
  - Supports: **bold**, _italic_, `code`, [links](url), lists, headings
- **Tags** - Categorize cards with custom tags (e.g., "bug", "feature", "urgent")
- **Due Date** - Set deadlines (overdue dates appear in red)
- **Timestamps** - Automatically tracked creation and last update times

## Project Structure

```
cospace/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── board/          # Board-related components
│   │   │   ├── BoardCard.tsx
│   │   │   └── CreateBoardModal.tsx
│   │   ├── card/           # Card/task components
│   │   │   ├── CardComponent.tsx
│   │   │   └── CardModal.tsx
│   │   ├── column/         # Column components
│   │   │   └── ColumnComponent.tsx
│   │   └── ui/             # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       └── TagInput.tsx
│   ├── pages/              # Page-level components
│   │   ├── Dashboard.tsx   # Board list and search
│   │   └── BoardView.tsx   # Individual board view
│   ├── context/            # React context and state management
│   │   └── AppContext.tsx  # Global app state with useReducer
│   ├── lib/                # Utility functions and hooks
│   │   ├── utils.ts        # Helper functions
│   │   ├── markdown.tsx    # Markdown renderer component
│   │   └── hooks/
│   │       └── useKeyboard.ts # Keyboard shortcuts hook
│   ├── types/              # TypeScript definitions
│   │   └── index.ts        # All app types
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── eslint.config.js        # ESLint configuration
```

## Architecture

### State Management

CoSpace uses **React's built-in useReducer** with **Context API** for global state management:

- **AppContext** holds the entire application state
- Normalized state structure (byId + allIds) for efficient data access
- Memoized selectors prevent unnecessary re-renders
- localStorage persistence with automatic sync

### State Structure

```typescript
AppState {
  boards: {
    byId: { [boardId]: Board },
    allIds: [boardIds]
  },
  columns: {
    byId: { [columnId]: Column },
    allIds: [columnIds]
  },
  cards: {
    byId: { [cardId]: Card },
    allIds: [cardIds]
  },
  ui: {
    activeBoardId: string | null,
    editingCardId: string | null,
    editingColumnId: string | null,
    modalType: ModalType | null,
    modalData: object
  }
}
```

### Available Custom Hooks

- `useAppState()` - Access global state and dispatch
- `useBoards()` - Get list of all boards (memoized)
- `useActiveBoard()` - Get currently active board
- `useBoardColumns(boardId)` - Get columns for a board
- `useUI()` - Access UI state
- `useKeyboard(key, callback, options)` - Handle keyboard events
- `useFocusTrap(ref, isActive)` - Keyboard focus management in modals

## Key Technologies

- **React 19** - Modern component framework with hooks
- **TypeScript 5.9** - Type-safe development
- **Vite 7.3** - Lightning-fast build tool with HMR
- **Tailwind CSS 4.2** - Utility-first styling
- **Lucide React** - Clean, consistent icon library
- **React Markdown** - Render markdown with security
- **Framer Motion** - Smooth animations (integrated)
- **localStorage** - Browser-based persistence

## Features Deep Dive

### Markdown Support

Card descriptions support GitHub Flavored Markdown:

```markdown
# Heading

## Subheading

**Bold text**
_Italic text_
`code snippet`

- List item
  [Link text](https://example.com)
```

### Tag System

- Assign multiple tags to cards
- Suggested tags for quick selection
- Visual color coding per tag
- Easy tag removal with inline buttons

### Search Functionality

- Real-time board search
- Searches both title and description
- Case-insensitive matching
- Displays "No boards found" for empty results

### Data Persistence

- Automatic localStorage saving on state changes
- Loads previous state on app start
- Safe error handling if storage fails
- Data stored under key: `co space-state`

### Keyboard Navigation

- **Escape** - Close modals and dialogs
- **Enter** - Submit forms and create items
- **Tab/Shift+Tab** - Focus trap in modals
- **Board cards** - Enter/Space to open
- **Backspace** - Remove tags in tag input

## Component Overview

### UI Components

| Component  | Purpose                                                           |
| ---------- | ----------------------------------------------------------------- |
| `Button`   | Reusable button with variants (primary, secondary, ghost, danger) |
| `Input`    | Text input with labels, validation, and helper text               |
| `Textarea` | Multi-line text input for descriptions                            |
| `Modal`    | Centered dialog with focus management                             |
| `TagInput` | Multi-tag input with suggestions                                  |

### Domain Components

| Component          | Purpose                              |
| ------------------ | ------------------------------------ |
| `BoardCard`        | Card display for boards in dashboard |
| `CreateBoardModal` | Modal to create new boards           |
| `ColumnComponent`  | Kanban column with cards             |
| `CardComponent`    | Individual task card                 |
| `CardModal`        | Modal to create/edit cards           |

## Performance Optimizations

- **Code Splitting** - BoardView lazily loaded
- **Memoization** - Components wrapped with React.memo
- **useCallback** - Event handlers memoized
- **useMemo** - Computed values cached
- **Normalized State** - Efficient lookups and updates
- **Virtual Scrolling Ready** - Column cards can be virtualized for large boards

## Accessibility

- Full keyboard navigation support
- ARIA labels on interactive elements
- Proper semantic HTML structure
- Focus management in modals
- Color contrast compliance
- Screen reader friendly

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Code Quality

- **ESLint** - Code linting and style consistency
- **TypeScript** - Static type checking
- **Tailwind CSS** - Consistent styling
- **Prettier** (ready to integrate) - Code formatting

### Extending the App

To add new features:

1. **Add types** in `src/types/index.ts`
2. **Implement action** in `AppContext.reducer`
3. **Create component** in appropriate folder
4. **Use hooks** to access state with memoization
5. **Style** with Tailwind classes

## Common Tasks

### Creating a New Feature

1. Define types in `src/types/index.ts`
2. Add reducer case in `src/context/AppContext.tsx`
3. Create component in `src/components/`
4. Dispatch actions from components
5. Subscribe to state with custom hooks

### Adding a New Modal

1. Create modal component in `src/components/`
2. Use `Modal` base component for consistency
3. Add `useState` for open/close
4. Dispatch actions on form submit
5. Handle close with `onClose` callback

### Customizing Styling

All components use Tailwind CSS. To customize:

1. Edit `src/index.css` for global styles
2. Adjust colors in component className props
3. Tailwind config is in `tailwind.config.js` (if needed)

## Troubleshooting

### Data not persisting

- Check browser localStorage quota
- Verify localStorage is not disabled
- Open DevTools → Application → LocalStorage → check `co space-state` key

### Modal focus issues

- Ensure `useFocusTrap` is called correctly
- Check that modal has proper `role="dialog"` and `aria-modal="true"`

### Performance issues

- Check for missing memoization on frequently-rendered components
- Use React DevTools Profiler to identify bottlenecks
- Verify useCallback dependencies are minimal

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2020 support

## Future Enhancements

Potential features for future versions:

- Drag-and-drop card reordering
- User authentication and collaboration
- Card comments and activity history
- Real-time sync with backend
- Recurring tasks and templates
- Integration with external tools
- Dark mode theme
- Mobile app with React Native

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure code quality with `npm run lint`
5. Submit a pull request

## Support

For issues, questions, or suggestions:

1. Check existing GitHub issues
2. Create a new issue with details
3. Include screenshots or error messages
4. Describe your environment (OS, browser, etc.)

## Author

Created by Joshua Joel as part of my prerequisite task with Telonvo Residency Program.

---

**Happy organizing with CoSpace! 🚀**
