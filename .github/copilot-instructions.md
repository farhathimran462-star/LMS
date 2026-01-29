# Career Point Learning Management System - AI Agent Instructions

## Project Overview
React-based educational management system with role-based access (Super Admin, Admin, Teacher, Student). Built with Vite, React 19, Supabase backend, and Tailwind CSS.

## Architecture

### Component Organization
- **Reusable Components**: `src/Components/Reusable/` - DynamicTable, DynamicForm, DynamicGrid, DynamicProfile
- **Role-based Components**: Organized in `src/Components/{SuperAdmin|Admin|Teacher|Student}/`
- **Main Dashboard**: `src/Components/DashBoard.jsx` - Central routing hub with role-based menu rendering

### Data Layer
- **Supabase Client**: All API calls use `src/config/supabaseClient.js` (configured via `.env`)
- **API Modules**: `src/api/*Api.js` - Centralized data operations per entity (users, classes, batches, etc.)
- **Pattern**: Every API function returns `{ data, error }` tuple for consistent error handling
- **Database Schema**: SQL definitions in `database_schema/` - reference for understanding relationships

### Authentication & Session Management
- **Login Flow**: `LoginPage.jsx` → backend auth → stores `authToken`, `userRole`, `userData` in sessionStorage (+ localStorage if "Remember Me")
- **Role Determination**: Dashboard reads role from `location.state` → `sessionStorage` → `localStorage` (fallback chain)
- **Protected Routes**: Dashboard redirects to `/` if no valid role found
- **Backend URL**: Currently set to `https://my-career-point-updated.onrender.com` (see `LoginPage.jsx`)

## Development Patterns

### Reusable Components Usage
```jsx
// DynamicTable - Complex table with filtering, export, inline editing
<DynamicTable
  data={filteredData}
  userRole={userRole}
  columnOrder={['username', 'role', 'status']}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAddNew={() => setShowForm(true)}
  showDateFilter={true}
  pillColumns={['status', 'role']}
  displayAtFixed={['email']}
/>

// DynamicForm - Multi-field form with validation
<DynamicForm
  fields={formConfig}
  onSubmit={handleSubmit}
  onCancel={() => setShowForm(false)}
  submitLabel="Create User"
/>
```

### API Call Pattern
```javascript
// Standard error handling pattern used throughout
const { data, error } = await getAllUsers();
if (error) {
  setError(error.message);
  return;
}
setUsers(data);
```

### Role-Based Menu Structure
- Defined in `DashBoard.jsx` as `roleBasedMenus` object
- Menu IDs map to switch cases in `renderContent()` function
- When adding new features, update BOTH `roleBasedMenus` and `renderContent()`

## Styling Conventions

### CSS Organization
- **Component Styles**: `src/Styles/{ComponentPath}/*.css` - mirrors component directory structure
- **CSS Variables**: Defined in root (check `DashBoard.css`) - use `var(--color-gray-100)`, `var(--space-4)`, etc.
- **BEM-like Naming**: Component-prefixed classes (e.g., `DFORM_Dropdown_Wrapper`, `dashboard-container`)
- **Tailwind**: Used for new components via `@tailwindcss/vite` plugin, but existing components use CSS modules

### Responsive Design
- Mobile-first with breakpoints defined in CSS
- Sidebar toggle at mobile breakpoints (`mobile-menu-toggle` in `DashBoard.css`)

## Key Workflows

### Development Server
```bash
npm run dev          # Starts Vite dev server (default: http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Setup
Required `.env` variables:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Adding New Entity Management
1. Create API module in `src/api/{entity}Api.js` following existing patterns
2. Add CRUD functions returning `{ data, error }`
3. Create management component in appropriate role folder
4. Use DynamicTable + DynamicForm for UI
5. Add route case in `DashBoard.jsx` `renderContent()`
6. Add menu item to relevant roles in `roleBasedMenus`

### Adding New User Role Features
1. Update `roleBasedMenus` in `DashBoard.jsx` with new menu item
2. Add switch case in `renderContent()` to render component
3. Import new component at top of `DashBoard.jsx`
4. Update backend role permissions if needed

## Critical Implementation Details

### State Management
- React hooks only (no Redux/Context API currently)
- Props drilling from Dashboard to child components for `userRole`
- Session persistence via localStorage/sessionStorage (see LoginPage pattern)

### Icons
- **react-icons**: Primary icon library (`FiIcon` from `react-icons/fi`, `LuIcon` from `react-icons/lu`)
- **lucide-react**: Used in DynamicTable (`Edit`, `Trash2`, `Plus`, etc.)
- Choose icons from existing libraries to maintain consistency

### Export Functionality
DynamicTable supports Excel/PDF export via:
- `xlsx` library for Excel (from SheetJS CDN)
- `jspdf` + `jspdf-autotable` for PDF generation
- Reference `DynamicTable.jsx` implementation

### Form Validation
- Client-side validation in DynamicForm via `required` field property
- Field types: `text-enter`, `email`, `password`, `date`, `dropdown`, `multi-select`, `textarea`
- Custom dropdowns (not native) for consistent UX

## Common Pitfalls

1. **Role not persisting on refresh**: Ensure role is stored in sessionStorage/localStorage in LoginPage
2. **Menu item not showing**: Must add to BOTH `roleBasedMenus` array AND `renderContent()` switch
3. **Supabase errors**: Check `.env` variables are loaded (Vite requires `VITE_` prefix)
4. **Import paths**: Use relative paths from component location, not root-relative
5. **CSS conflicts**: Use component-prefixed class names to avoid collisions
6. **API errors not showing**: Always check `error` in destructured response and update UI state

## Testing & Debugging
- No test setup currently (noted in README)
- Use browser DevTools + React DevTools
- API calls logged to console via `console.error()` in API modules
- Authentication flow heavily logged in LoginPage (search for `console.log('🔐')`)

## Documentation
- API usage examples: `src/api/README.md`
- Database schema: `database_schema/classes_table_structure.md`
- Component props documented inline (see DynamicTable, DynamicForm JSDoc comments)
