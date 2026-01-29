# Excel Import Instructions

## Quick Start Guide for Excel Users

### Step 1: Create Your Excel File

1. Open **Microsoft Excel** or **Google Sheets**
2. Create a new blank workbook
3. Add column headers in **Row 1** (exact names, case-sensitive)

### Step 2: Add Column Headers

Copy these exact column names into the first row:

```
full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes
```

**Important**: Column names must be exact (including underscores)

---

## Column Headers Reference

### For All Roles (Required)
| Column | Example Value |
|--------|---------------|
| full_name | John Doe |
| email | john.doe@example.com |
| phone | 1234567890 |
| username | john.doe |
| password | SecurePass123 |
| role | Student |

### Role-Specific Columns

**For Students (Required):**
- `roll_number` → Example: S001, 2025001
- `institute_id` → Institute ID from database (e.g., 'INST001', NOT the UUID)

**For Teachers (Required):**
- `employee_id` → Example: TCH001, EMP001

**For Admins (Required):**
- `employee_id` → Example: ADM001
- `institutes_managed` → UUID1;UUID2 (semicolon-separated)

**For Super Admin (Required):**
- `employee_id` → Example: SA001

### Optional Columns (All Roles)
- `is_active` → TRUE or FALSE
- `notes` → Any text/remarks

---

## Excel Template Examples

### Students Template

| full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes |
|-----------|-------|-------|----------|----------|------|-------------|-------------|--------------|--------------------|-----------| ------|
| John Doe | john@student.edu | 1234567890 | john.doe | Pass123 | Student | 2025001 | | INST001 | | TRUE | New admission |
| Jane Smith | jane@student.edu | 2345678901 | jane.smith | Pass456 | Student | 2025002 | | INST001 | | TRUE | Transfer student |

### Teachers Template

| full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes |
|-----------|-------|-------|----------|----------|------|-------------|-------------|--------------|--------------------|-----------| ------|
| Dr. Sarah Johnson | sarah.j@institute.edu | 5551234567 | sarah.johnson | Teacher@2025 | Teacher | | TCH001 | | | TRUE | Physics dept head |
| Prof. Michael Brown | m.brown@institute.edu | 5559876543 | michael.brown | Teacher@2025 | Teacher | | TCH002 | | | TRUE | Math professor |

### Admins Template

| full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes |
|-----------|-------|-------|----------|----------|------|-------------|-------------|--------------|--------------------|-----------| ------|
| Robert Admin | robert@admin.edu | 5555555555 | robert.admin | Admin@2025 | Admin | | ADM001 | | INST001;INST002 | TRUE | Regional admin |

---

## Important Excel Tips

### ✅ Do's
- ✅ Save as `.xlsx` (Excel 2007+) or `.xls` (Excel 97-2003)
- ✅ Use TRUE/FALSE for `is_active` column
- ✅ Leave cells empty for non-applicable fields (don't delete columns)
- ✅ Keep column headers in Row 1
- ✅ Use plain text values (no formulas)
- ✅ Ensure phone numbers are 10 digits
- ✅ Double-check spelling of role names

### ❌ Don'ts
- ❌ Don't use different column names
- ❌ Don't add extra rows above the headers
- ❌ Don't use formulas in data cells
- ❌ Don't merge cells
- ❌ Don't change column order (order doesn't matter, but names must be exact)
- ❌ Don't leave required fields empty
- ❌ Don't use special characters in usernames

---

## Excel-Specific Formatting

### Phone Numbers
Excel might auto-format phone numbers. To prevent this:
1. Select the phone column
2. Right-click → Format Cells
3. Select "Text" format
4. Enter phone numbers as text

### Institute IDs
Institute IDs are the `institute_id` field from the institutions table (e.g., 'INST001', 'INST002'):
1. Format cells as "Text" before entering
2. Copy-paste institute IDs from database query results
3. Use `institute_id` field, NOT the UUID `id` field

### Boolean Values
- Use `TRUE` or `FALSE` (Excel recognizes these)
- Or use `1` for TRUE, `0` for FALSE
- The system will convert them correctly

### Multiple Institute IDs (Admins)
Separate multiple institute IDs with semicolon:
```
INST001;INST002;INST003
```

---

## Step-by-Step: Creating Your First Import

### Example: Importing 3 Students

1. **Open Excel** → New Workbook

2. **Add Headers** (Row 1):
   ```
   full_name | email | phone | username | password | role | roll_number | institute_id | is_active | notes
   ```

3. **Add Student 1** (Row 2):
   ```
   John Doe | john@student.edu | 1234567890 | john.doe | Pass123 | Student | S001 | INST001 | TRUE | First year
   ```

4. **Add Student 2** (Row 3):
   ```
   Jane Smith | jane@student.edu | 2345678901 | jane.smith | Pass456 | Student | S002 | INST001 | TRUE | Second year
   ```

5. **Add Student 3** (Row 4):
   ```
   Bob Wilson | bob@student.edu | 3456789012 | bob.wilson | Pass789 | Student | S003 | INST001 | TRUE | Transfer
   ```

6. **Save File**:
   - File → Save As
   - Choose location
   - File type: "Excel Workbook (*.xlsx)"
   - Name: `students_import.xlsx`
   - Click Save

7. **Import**:
   - Go to User Management page
   - Click "Import" button
   - Select your `students_import.xlsx` file
   - Review results

---

## Getting Institute UUIDs

You need the actual `institute_id` from your database:

### Method 1: SQL Query (Recommended)
```sql
SELECT institute_id, institution_name FROM institutions;
```
Copy the value from the `institute_id` column (e.g., 'INST001', 'INST002').

**Important**: Use `institute_id` field, NOT the UUID `id` field.

### Method 2: Ask Your Database Admin
Request the institute UUIDs you need for your users.

---

## Common Excel Errors

### Error: "Missing required fields"
**Cause**: Empty required columns
**Fix**: Ensure all required fields have values (see role-specific requirements)

### Error: "Phone number must be 10 digits"
**Cause**: Phone number is not exactly 10 digits
**Fix**: 
- Format as Text first
- Remove spaces, dashes, or country codes
- Enter exactly 10 digits: `1234567890`

### Error: "Invalid role"
**Cause**: Role name spelling mistake or wrong case
**Fix**: Use exact role names:
- `Student` (capital S)
- `Teacher` (capital T)
- `Admin` (capital A)
- `Super Admin` (capital S and A, with space)

### Error: "Student requires roll_number and institute_id"
**Cause**: Missing role-specific fields
**Fix**: Fill in all required fields for that role

---

## Converting CSV to Excel

If you have CSV sample files and want to use Excel:

1. Open Excel
2. File → Open → Select CSV file
3. Excel will auto-import
4. File → Save As → Choose `.xlsx` format
5. Now you can edit and import

---

## Testing Your Import

**Best Practice**: Test with 2-3 users first!

1. Create Excel file with 2-3 test users
2. Import and verify success
3. If successful, add more users
4. If errors, fix and retry

---

## Bulk Import Best Practices

1. **Prepare Data** in Excel carefully
2. **Verify UUIDs** are correct from database
3. **Test Small Batch** first (5-10 users)
4. **Review Errors** if any occur
5. **Fix and Re-import** failed rows
6. **Backup Database** before large imports

---

## Support

For help with Excel imports:
1. Check column headers match exactly
2. Verify required fields for each role
3. Ensure UUIDs are valid
4. Test with small batch first
5. Review error messages carefully

See [USER_IMPORT_GUIDE.md](../USER_IMPORT_GUIDE.md) for complete documentation.
