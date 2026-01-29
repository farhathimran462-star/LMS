# User Import Guide

## Supported File Formats

The User Management system supports importing users via:
- **CSV** (.csv) - Comma Separated Values
- **JSON** (.json) - JavaScript Object Notation
- **Excel** (.xlsx, .xls) - Microsoft Excel Spreadsheet

---

## Required Fields (All Roles)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `full_name` | String | User's full legal name | "John Doe" |
| `email` | String | Valid email address | "john@example.com" |
| `phone` | String | 10-digit phone number | "1234567890" |
| `username` | String | Unique username | "john.doe" |
| `password` | String | User password | "Pass123" |
| `role` | String | Must be: Student, Teacher, Admin, or Super Admin | "Student" |

---

## Role-Specific Fields

### **Student**
- `roll_number` (Required) - Student's roll number
- `institute_id` (Required) - Institute ID from institutions table (use institute_id field, not the UUID id field)

### **Teacher**
- `employee_id` (Required) - Employee ID

### **Admin**
- `employee_id` (Required) - Employee ID
- `institutes_managed` (Required) - Institute IDs (semicolon or comma-separated)

### **Super Admin**
- `employee_id` (Required) - Employee ID

---

## Optional Fields (All Roles)

| Field | Type | Description |
|-------|------|-------------|
| `is_active` | Boolean | Account status (default: true) |
| `notes` | String | Additional notes/remarks |
| `suspension_reason` | String | Reason if suspended |
| `suspension_start` | Date | Suspension start date (YYYY-MM-DD) |
| `suspension_end` | Date | Suspension end date (YYYY-MM-DD) |

---

## CSV Format

### Template
```csv
full_name,email,phone,username,password,role,roll_number,employee_id,institute_id,institutes_managed,is_active,notes
```

### Example: Mixed Roles
```csv
full_name,email,phone,username,password,role,roll_number,employee_id,institute_id,institutes_managed,is_active,notes
John Doe,john@example.com,1234567890,john.doe,Pass123,Student,S001,,INST001,,true,New student
Jane Smith,jane@example.com,9876543210,jane.smith,Pass456,Teacher,,EMP001,,,true,Math teacher
Bob Admin,bob@example.com,5555555555,bob.admin,Pass789,Admin,,EMP002,,INST001;INST002,true,Regional admin
Alice Super,alice@example.com,4444444444,alice.super,Pass000,Super Admin,,EMP000,,,true,System administrator
```

**CSV Notes:**
- Leave fields empty if not applicable for the role
- For `institutes_managed`, use semicolon (;) or comma to separate multiple institute IDs
- Boolean values: `true` or `false`
- Dates: Use `YYYY-MM-DD` format

---

## JSON Format

### Template
```json
[
  {
    "full_name": "String",
    "email": "String",
    "phone": "String",
    "username": "String",
    "password": "String",
    "role": "Student|Teacher|Admin|Super Admin",
    "roll_number": "String (Student only)",
    "employee_id": "String (Teacher/Admin/Super Admin)",
    "institute_id": "UUID (Student only)",
    "institutes_managed": ["UUID", "UUID"] | "UUID1;UUID2" (Admin only),
    "is_active": true,
    "notes": "String",
    "suspension_reason": "String",
    "suspension_start": "YYYY-MM-DD",
    "suspension_end": "YYYY-MM-DD"
  }
]
```

### Example: Student Import
```json
[
  {
    "full_name": "John Doe",
    "email": "john.doe@student.edu",
    "phone": "1234567890",
    "username": "john.doe",
    "password": "Student@123",
    "role": "Student",
    "roll_number": "2025001",
    "institute_id": "INST001",
    "is_active": true,
    "notes": "First year student"
  },
  {
    "full_name": "Jane Smith",
    "email": "jane.smith@student.edu",
    "phone": "9876543210",
    "username": "jane.smith",
    "password": "Student@456",
    "role": "Student",
    "roll_number": "2025002",
    "institute_id": "550e8400-e29b-41d4-a716-446655440000",
    "is_active": true
  }
]
```

### Example: Teacher Import
```json
[
  {
    "full_name": "Dr. Sarah Johnson",
    "email": "sarah.j@institute.edu",
    "phone": "5551234567",
    "username": "sarah.johnson",
    "password": "Teacher@2025",
    "role": "Teacher",
    "employee_id": "TCH001",
    "is_active": true,
    "notes": "Physics department head"
  },
  {
    "full_name": "Prof. Michael Brown",
    "email": "m.brown@institute.edu",
    "phone": "5559876543",
    "username": "michael.brown",
    "password": "Teacher@2025",
    "role": "Teacher",
    "employee_id": "TCH002",
    "is_active": true,
    "notes": "Mathematics teacher"
  }
]
```

### Example: Admin Import
```json
[
  {
    "full_name": "Robert Admin",
    "email": "robert.admin@institute.edu",
    "phone": "5555555555",
    "username": "robert.admin",
    "password": "Admin@2025",
    "role": "Admin",
    "employee_id": "ADM001",
    "institutes_managed": [
      "550e8400-e29b-41d4-a716-446655440000",
      "660e8400-e29b-41d4-a716-446655440001"
    ],
    "is_active": true,
    "notes": "Regional administrator"
  }
]
```

**JSON Notes:**
- `institutes_managed` can be array of UUIDs or semicolon-separated string
- All string values must be in quotes
- Boolean values: `true` or `false` (no quotes)
- Dates must be in `"YYYY-MM-DD"` format

---

## Excel Format (.xlsx, .xls)

Excel files follow the same structure as CSV - the first row should contain column headers, and each subsequent row represents a user.

### Excel Template Structure

| full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes |
|-----------|-------|-------|----------|----------|------|-------------|-------------|--------------|-------------------|-----------|-------|
| John Doe | john@example.com | 1234567890 | john.doe | Pass123 | Student | S001 | | uuid-here | | TRUE | New student |
| Jane Smith | jane@example.com | 9876543210 | jane.smith | Pass456 | Teacher | | EMP001 | | | TRUE | Math teacher |

### Excel-Specific Notes:
- **Column Headers**: First row must contain exact field names (case-sensitive)
- **Boolean Values**: Use `TRUE` or `FALSE` (Excel format)
- **Empty Cells**: Leave cells blank for non-applicable fields
- **Institute IDs**: Use `institute_id` from institutions table (e.g., 'INST001'), NOT the UUID
- **Multiple Institutes**: For Admin, use semicolon (;) to separate institute IDs
- **Date Format**: Excel dates should be formatted as `YYYY-MM-DD` or Excel date format
- **No Formulas**: Use plain values only, formulas will not be evaluated
- **Sheet Selection**: Only the first sheet will be imported

### Creating Excel Files:
1. Open Microsoft Excel or Google Sheets
2. Add column headers in the first row (exact field names)
3. Fill in user data in subsequent rows
4. Save as `.xlsx` (recommended) or `.xls`
5. Import via User Management interface

---

## Validation Rules

### Automatic Validation
The system automatically validates:

✅ **Required Fields** - All mandatory fields must be present
✅ **Phone Numbers** - Must be exactly 10 digits
✅ **Role Values** - Must be: Student, Teacher, Admin, or Super Admin
✅ **Student Requirements** - roll_number and institute_id required
✅ **Employee Requirements** - employee_id required for Teacher/Admin/Super Admin
✅ **Admin Requirements** - institutes_managed required
✅ **Unique Constraints** - Username and employee_id must be unique

### Import Process
1. **Validation** - All rows validated before import
2. **Creation** - Users created one by one
3. **Transaction Rollback** - Failed rows don't affect successful imports
4. **Results Report** - Shows successful and failed imports

---

## Error Handling

### Common Errors

❌ **Missing Required Fields**
```
Row 3: Missing required fields (full_name, email, phone, username, password, role)
```
**Solution:** Ensure all required fields are present

❌ **Invalid Phone Number**
```
Row 5: Phone number must be 10 digits
```
**Solution:** Provide exactly 10-digit phone number

❌ **Invalid Role**
```
Row 7: Invalid role 'Staff'. Must be one of: Student, Teacher, Admin, Super Admin
```
**Solution:** Use exact role names (case-sensitive)

❌ **Missing Role-Specific Fields**
```
Row 10: Student requires roll_number and institute_id
```
**Solution:** Provide all required fields for the specific role

❌ **Duplicate Constraint**
```
Row 15: Employee ID already exists. Please use a unique Employee ID.
```
**Solution:** Ensure unique usernames and employee_ids

---

## How to Import

1. **Prepare your data** using CSV, JSON, or Excel format (templates above)
2. **Navigate to User Management** page
3. **Click the Import button** in DynamicTable toolbar
4. **Select your file** (.csv, .json, .xlsx, or .xls)
5. **Review validation results**
6. **Check import summary** - successful vs failed imports

### Import Results
- ✅ **Success:** All users imported successfully
- ⚠️ **Partial Success:** Some users imported, some failed (detailed error report)
- ❌ **Failed:** Validation errors prevent import (fix and retry)

---

## Best Practices

1. **Test with small batch first** - Import 5-10 users to verify format
2. **Use UUID for institute_id** - Get actual UUIDs from database
3. **Validate employee_id uniqueness** - Check existing employees before import
4. **Strong passwords** - Ensure passwords meet security requirements
5. **Backup before bulk import** - Always backup before large imports
6. **Review error logs** - Fix failed rows and re-import them separately

---

## Getting Institute IDs

To get valid `institute_id` values:

```sql
-- Run in Supabase SQL Editor
SELECT institute_id, institution_name FROM institutions;
```

Copy the values from the `institute_id` column for use in your import file. Use the `institute_id` (like 'INST001'), NOT the UUID `id` field.

---

## Sample Files

Download sample import files:
- [students_import_sample.csv](./import_samples/students_import_sample.csv)
- [teachers_import_sample.csv](./import_samples/teachers_import_sample.csv)
- [mixed_users_import_sample.json](./import_samples/mixed_users_import_sample.json)
- Excel files: Create using the templates above or convert CSV samples to Excel

**Note**: For Excel files, open any CSV sample in Excel and save as `.xlsx`

---

## Support

For import issues:
1. Check validation error messages
2. Verify data format matches templates
3. Ensure UUIDs are valid
4. Check database constraints (unique usernames, employee_ids)
5. Review import logs for specific error details
