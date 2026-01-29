uu# Reference Template Instructions

## 📋 **USER_IMPORT_TEMPLATE.csv** - Your Starting Point

This template includes example rows for all user roles. Follow these steps:

### **Step 1: Open the Template**
1. Open `USER_IMPORT_TEMPLATE.csv` in Microsoft Excel or Google Sheets
2. You'll see example data for all user types

### **Step 2: Understand the Structure**

**Column Headers (DO NOT CHANGE):**
```
full_name | email | phone | username | password | role | roll_number | employee_id | institute_id | institutes_managed | is_active | notes
```

### **Step 3: Replace Example Data**

The template includes these examples:
- **2 Students** - See how roll_number and institute_id work
- **2 Teachers** - See how employee_id works
- **2 Admins** - See how institutes_managed (multiple institutes) works
- **1 Super Admin** - See how super admin is formatted

**DELETE the example rows and ADD your actual users!**

### **Step 4: Fill Your Data**

#### **For Students:**
| Required Fields | Example |
|----------------|---------|
| full_name | John Doe |
| email | john@student.edu |
| phone | 1234567890 (exactly 10 digits) |
| username | john.doe |
| password | Student@123 |
| role | Student |
| roll_number | 2025001 |
| institute_id | INST001 |
| is_active | TRUE |

**Leave blank:** employee_id, institutes_managed

#### **For Teachers:**
| Required Fields | Example |
|----------------|---------|
| full_name | Dr. Sarah Johnson |
| email | sarah@teacher.edu |
| phone | 5551234567 |
| username | sarah.johnson |
| password | Teacher@123 |
| role | Teacher |
| employee_id | TCH001 |
| is_active | TRUE |

**Leave blank:** roll_number, institute_id, institutes_managed

#### **For Admins:**
| Required Fields | Example |
|----------------|---------|
| full_name | Robert Admin |
| email | robert@admin.edu |
| phone | 5555555555 |
| username | robert.admin |
| password | Admin@123 |
| role | Admin |
| employee_id | ADM001 |
| institutes_managed | INST001;INST002 (semicolon-separated) |
| is_active | TRUE |

**Leave blank:** roll_number, institute_id

#### **For Super Admin:**
| Required Fields | Example |
|----------------|---------|
| full_name | Alice SuperAdmin |
| email | alice@system.edu |
| phone | 4444444444 |
| username | alice.super |
| password | SuperAdmin@123 |
| role | Super Admin (with space) |
| employee_id | SA001 |
| is_active | TRUE |

**Leave blank:** roll_number, institute_id, institutes_managed

### **Step 5: Get Your Institute IDs**

Before importing students or admins, get your actual institute IDs:

```sql
SELECT institute_id, institution_name FROM institutions;
```

Replace `INST001`, `INST002` in the template with your actual institute IDs.

### **Step 6: Important Rules**

✅ **DO:**
- Keep column headers in row 1
- Use TRUE/FALSE for is_active
- Phone numbers: exactly 10 digits
- Role names: Student, Teacher, Admin, Super Admin (exact spelling)
- Leave cells empty (not "N/A") for non-applicable fields

❌ **DON'T:**
- Change column header names
- Mix up role-specific fields
- Use spaces in phone numbers
- Delete columns (leave them empty instead)
- Use formulas in data cells

### **Step 7: Save and Import**

1. **Save As Excel:**
   - File → Save As
   - Choose: "Excel Workbook (*.xlsx)"
   - Name: `my_users_import.xlsx`

2. **Or Keep as CSV:**
   - File → Save As
   - Choose: "CSV (Comma delimited) (*.csv)"
   - Name: `my_users_import.csv`

3. **Import:**
   - Go to User Management page
   - Click "Import" button
   - Select your file
   - Review results

### **Quick Reference - Field Mapping**

| Field | Student | Teacher | Admin | Super Admin |
|-------|---------|---------|-------|-------------|
| full_name | ✅ | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ |
| phone | ✅ | ✅ | ✅ | ✅ |
| username | ✅ | ✅ | ✅ | ✅ |
| password | ✅ | ✅ | ✅ | ✅ |
| role | ✅ | ✅ | ✅ | ✅ |
| roll_number | ✅ | ❌ | ❌ | ❌ |
| employee_id | ❌ | ✅ | ✅ | ✅ |
| institute_id | ✅ | ❌ | ❌ | ❌ |
| institutes_managed | ❌ | ❌ | ✅ | ❌ |
| is_active | Optional | Optional | Optional | Optional |
| notes | Optional | Optional | Optional | Optional |

### **Example: Creating 10 Students**

1. Open `USER_IMPORT_TEMPLATE.csv`
2. Delete all example rows (keep headers)
3. Add 10 rows with student data:
   - Fill: full_name, email, phone, username, password
   - Set role: "Student"
   - Add: roll_number (unique for each)
   - Add: institute_id (same for all if same institute)
   - Set: is_active to TRUE
   - Leave blank: employee_id, institutes_managed
4. Save as Excel or CSV
5. Import!

### **Need Help?**

- See [USER_IMPORT_GUIDE.md](../USER_IMPORT_GUIDE.md) for complete documentation
- See [EXCEL_IMPORT_INSTRUCTIONS.md](./EXCEL_IMPORT_INSTRUCTIONS.md) for Excel-specific help
- Check other sample files in this folder for more examples

---

**Ready to start?** Open `USER_IMPORT_TEMPLATE.csv`, replace the examples with your data, and import! 🚀
