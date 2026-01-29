# Expense Management API - Usage Guide

## Overview
Complete expense claim and approval system with role-based access control for Teachers, Admins, and Super Admins.

## Database Tables Required

### 1. expenses
Main expense records table. Create via Supabase UI with columns:
- `id` (uuid, primary key)
- `teacher_id` (uuid, FK → teachers.id)
- `institution_id` (uuid, FK → institutions.id)
- `course_id`, `level_id`, `programme_id`, `batch_id`, `class_id` (uuids, nullable/required)
- `expense_date` (date)
- `payment_mode` (text: 'Self-paid' or 'Institute Advance')
- `status` (text: 'Pending', 'Approved', 'Rejected', 'OnHold')
- `total_amount` (numeric(10,2))
- `description` (text, nullable)
- `file_url`, `file_path`, `file_name`, `file_type`, `file_size` (for documents)
- `submitted_date`, `approval_date` (timestamps)
- `approved_by` (uuid, FK → Users.user_id, nullable)
- `rejection_reason` (text, nullable)

### 2. expense_line_items
Individual expense items table:
- `id` (uuid, primary key)
- `expense_id` (uuid, FK → expenses.id, CASCADE DELETE)
- `expense_type` (text: Travel/Training/Accommodation/Materials/Other)
- `purpose` (text)
- `start_date`, `end_date` (dates)
- `amount` (numeric(10,2))

### 3. Supabase Storage Bucket
Create bucket named: **expense-documents** (private)

## API Functions

### Create Expense
```javascript
import { createExpense } from '../api/expensesApi';

const expenseData = {
    teacher_id: 'teacher-uuid',
    institution_id: 'institution-uuid',
    course_id: 'course-uuid',
    level_id: 'level-uuid',
    programme_id: 'programme-uuid',
    batch_id: 'batch-uuid',
    class_id: 'class-uuid',
    expense_date: '2026-01-17',
    payment_mode: 'Self-paid',
    total_amount: 2500.00,
    description: 'Travel expense for guest lecture'
};

const lineItems = [
    { expense_type: 'Travel', purpose: 'Flight ticket', start_date: '2026-01-17', end_date: '2026-01-17', amount: 1800 },
    { expense_type: 'Travel', purpose: 'Local taxi', start_date: '2026-01-17', end_date: '2026-01-17', amount: 700 }
];

const file = document.getElementById('fileInput').files[0]; // Optional

const { data, error } = await createExpense(expenseData, lineItems, file);
```

### Get Expenses (Role-Based)
```javascript
import { getAllExpenses, getExpensesByTeacher, getExpensesByInstitution } from '../api/expensesApi';

// Teacher: Only their expenses
const { data: teacherExpenses } = await getExpensesByTeacher(teacherId);

// Admin: Only their institution's expenses
const { data: adminExpenses } = await getExpensesByInstitution(institutionId);

// Super Admin: All expenses
const { data: allExpenses } = await getAllExpenses();

// With filters
const { data: filtered } = await getAllExpenses({ 
    status: 'Pending', 
    institution_id: 'xyz',
    class_id: 'abc' 
});
```

### Get Single Expense (with Line Items)
```javascript
import { getExpenseById } from '../api/expensesApi';

const { data: expense, error } = await getExpenseById(expenseId);
// Returns: { ...expense, lineItems: [...] }
```

### Update Expense Status (Approve/Reject)
```javascript
import { updateExpenseStatus } from '../api/expensesApi';

// Approve
const { data, error } = await updateExpenseStatus(
    expenseId, 
    'Approved', 
    currentUserId, 
    null // no rejection reason
);

// Reject
const { data, error } = await updateExpenseStatus(
    expenseId, 
    'Rejected', 
    currentUserId, 
    'Invoice not clear'
);

// On Hold
const { data, error } = await updateExpenseStatus(expenseId, 'OnHold', currentUserId);
```

### Update Expense (Edit - Pending Only)
```javascript
import { updateExpense } from '../api/expensesApi';

const updatedData = {
    expense_date: '2026-01-18',
    payment_mode: 'Institute Advance',
    total_amount: 3000.00,
    description: 'Updated description'
};

const updatedLineItems = [
    { expense_type: 'Travel', purpose: 'Flight', start_date: '2026-01-18', end_date: '2026-01-18', amount: 3000 }
];

const newFile = document.getElementById('fileInput').files[0]; // Optional

const { data, error } = await updateExpense(expenseId, updatedData, updatedLineItems, newFile);
```

### Delete Expense (Pending Only)
```javascript
import { deleteExpense } from '../api/expensesApi';

const { data, error } = await deleteExpense(expenseId);
// Also deletes file from storage and line items (cascade)
```

### Download Document
```javascript
import { downloadExpenseDocument } from '../api/expensesApi';

const { data, error } = await downloadExpenseDocument(expense.file_path, expense.file_name);
// Automatically triggers browser download
```

### Get Statistics
```javascript
import { getExpenseStatistics } from '../api/expensesApi';

// For specific teacher
const { data: stats } = await getExpenseStatistics({ teacher_id: teacherId });

// For specific institution
const { data: stats } = await getExpenseStatistics({ institution_id: institutionId });

// Returns:
// {
//   totalRequests: 10,
//   pendingCount: 3,
//   approvedCount: 5,
//   rejectedCount: 1,
//   onHoldCount: 1,
//   totalApprovedAmount: 25000,
//   totalPendingAmount: 7500
// }
```

## Role-Based Access Control

### Teacher
- **Can View**: Only their own expenses
- **Can Create**: Expenses for classes they teach (must select full hierarchy)
- **Can Edit**: Only their Pending expenses
- **Can Delete**: Only their Pending expenses
- **Cannot**: Approve/Reject any expenses

### Admin
- **Can View**: All expenses from their institution
- **Can Create**: No (not a teacher)
- **Can Edit**: No (view only)
- **Can Delete**: No (view only)
- **Can Approve/Reject/Hold**: Expenses from their institution only

### Super Admin
- **Can View**: All expenses across all institutions
- **Can Create**: No (not a teacher)
- **Can Edit**: No (view only)
- **Can Delete**: No (view only)
- **Can Approve/Reject/Hold**: All expenses

## Component Integration

### ExpenseApproval.jsx
Main component handles:
- Hierarchy navigation for teachers (Institution → Course → Level → Programme → Batch → Class)
- Expense list display with real-time filtering
- DynamicForm integration for create/edit
- Status change actions for admins
- File upload/download
- Summary statistics cards

### Usage in Dashboard
```javascript
import ExpenseRequestDashboard from './Components/SuperAdmin/ExpenseApproval';

// In Dashboard.jsx renderContent():
case 'expense-claims': // For Teacher
    return <ExpenseRequestDashboard userRole="Teacher" />;

case 'expense-approvals': // For Admin/Super Admin
    return <ExpenseRequestDashboard userRole={userRole} />;
```

## File Upload Specifications
- **Accepted Types**: PDF, PNG, JPG, JPEG
- **Max Size**: 5MB
- **Storage Path**: `expenses/{institution_id}/{teacher_id}/{timestamp}_{filename}`
- **Auto Cleanup**: Files deleted when expense is deleted

## Error Handling
All functions return `{ data, error }` tuple:
```javascript
const { data, error } = await createExpense(...);
if (error) {
    console.error('Error:', error);
    alert('Failed: ' + error);
    return;
}
// Use data
```

## Important Notes
1. **RLS Policies**: Ensure Row Level Security policies are created in Supabase (see main DB structure doc)
2. **Cascade Delete**: Line items auto-delete when expense is deleted
3. **Status Validation**: Only Pending expenses can be edited/deleted
4. **File Management**: Old files are replaced when updating with new file
5. **Teacher Context**: Teacher must be linked to institution via `teachers.institute_id`
6. **User Session**: Uses `sessionStorage.userData` to get current user info

## Testing Checklist
- [ ] Teacher can create expense for their class
- [ ] Teacher can edit/delete only Pending expenses
- [ ] Admin can approve expenses from their institution only
- [ ] Super Admin can approve all expenses
- [ ] File upload works and downloads correctly
- [ ] Status changes update approval_date automatically
- [ ] Rejection requires rejection_reason
- [ ] Line items save correctly with expense
- [ ] Statistics calculate correctly
- [ ] Search/filter works across all fields
