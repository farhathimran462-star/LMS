// expensesApi.js - API functions for Expense Management
import { supabase } from '../config/supabaseClient';

/**
 * Create a new expense with line items and optional file upload
 * @param {Object} expenseData - Main expense data
 * @param {Array} lineItems - Array of expense line items
 * @param {File} file - Optional supporting document file
 * @returns {Object} { data, error }
 */
export const createExpense = async (expenseData, lineItems, file = null) => {
    try {
        let fileUrl = null;
        let filePath = null;
        let fileName = null;
        let fileType = null;
        let fileSize = null;

        // Upload file to Supabase Storage if provided
        if (file) {
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            filePath = `expenses/${expenseData.institution_id}/${expenseData.teacher_id}/${timestamp}_${sanitizedFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('expense-documents')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('File upload error:', uploadError);
                return { data: null, error: 'Failed to upload document: ' + uploadError.message };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('expense-documents')
                .getPublicUrl(filePath);

            fileUrl = publicUrl;
            fileName = file.name;
            fileType = file.type;
            fileSize = file.size;
        }

        // Insert main expense record
        const { data: expenseRecord, error: expenseError } = await supabase
            .from('expenses')
            .insert([{
                teacher_id: expenseData.teacher_id,
                institution_id: expenseData.institution_id,
                course_id: expenseData.course_id || null,
                level_id: expenseData.level_id || null,
                programme_id: expenseData.programme_id || null,
                batch_id: expenseData.batch_id || null,
                class_id: expenseData.class_id,
                expense_date: expenseData.expense_date,
                payment_mode: expenseData.payment_mode,
                total_amount: expenseData.total_amount,
                description: expenseData.description || null,
                file_url: fileUrl,
                file_path: filePath,
                file_name: fileName,
                file_type: fileType,
                file_size: fileSize,
                status: 'Pending'
            }])
            .select()
            .single();

        if (expenseError) {
            console.error('Expense creation error:', expenseError);
            // Clean up uploaded file if expense creation fails
            if (filePath) {
                await supabase.storage.from('expense-documents').remove([filePath]);
            }
            return { data: null, error: expenseError.message };
        }

        // Insert line items
        if (lineItems && lineItems.length > 0) {
            const lineItemsData = lineItems.map(item => ({
                expense_id: expenseRecord.id,
                expense_type: item.expense_type || item.type,
                purpose: item.purpose,
                start_date: item.start_date,
                end_date: item.end_date,
                amount: parseFloat(item.amount)
            }));

            const { error: lineItemsError } = await supabase
                .from('expense_line_items')
                .insert(lineItemsData);

            if (lineItemsError) {
                console.error('Line items creation error:', lineItemsError);
                // Rollback: delete expense record
                await supabase.from('expenses').delete().eq('id', expenseRecord.id);
                if (filePath) {
                    await supabase.storage.from('expense-documents').remove([filePath]);
                }
                return { data: null, error: 'Failed to create line items: ' + lineItemsError.message };
            }
        }

        return { data: expenseRecord, error: null };
    } catch (error) {
        console.error('Create expense error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get all expenses with optional filters
 * @param {Object} filters - Optional filters (teacher_id, institution_id, class_id, status)
 * @returns {Object} { data, error }
 */
export const getAllExpenses = async (filters = {}) => {
    try {
        let query = supabase
            .from('expenses')
            .select('*')
            .order('submitted_date', { ascending: false });

        // Apply filters
        if (filters.teacher_id) {
            query = query.eq('teacher_id', filters.teacher_id);
        }
        if (filters.institution_id) {
            query = query.eq('institution_id', filters.institution_id);
        }
        if (filters.course_id) {
            query = query.eq('course_id', filters.course_id);
        }
        if (filters.level_id) {
            query = query.eq('level_id', filters.level_id);
        }
        if (filters.programme_id) {
            query = query.eq('programme_id', filters.programme_id);
        }
        if (filters.batch_id) {
            query = query.eq('batch_id', filters.batch_id);
        }
        if (filters.class_id) {
            query = query.eq('class_id', filters.class_id);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Get expenses error:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Get expenses error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get expenses by teacher ID
 * @param {string} teacherId - Teacher UUID
 * @returns {Object} { data, error }
 */
export const getExpensesByTeacher = async (teacherId) => {
    return await getAllExpenses({ teacher_id: teacherId });
};

/**
 * Get expenses by institution ID (for Admin)
 * @param {string} institutionId - Institution UUID
 * @returns {Object} { data, error }
 */
export const getExpensesByInstitution = async (institutionId) => {
    return await getAllExpenses({ institution_id: institutionId });
};

/**
 * Get single expense by ID with line items
 * @param {string} expenseId - Expense UUID
 * @returns {Object} { data, error }
 */
export const getExpenseById = async (expenseId) => {
    try {
        // Get expense record
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('id', expenseId)
            .single();

        if (expenseError) {
            console.error('Get expense error:', expenseError);
            return { data: null, error: expenseError.message };
        }

        // Get line items
        const { data: lineItems, error: lineItemsError } = await supabase
            .from('expense_line_items')
            .select('*')
            .eq('expense_id', expenseId)
            .order('created_at', { ascending: true });

        if (lineItemsError) {
            console.error('Get line items error:', lineItemsError);
            return { data: null, error: lineItemsError.message };
        }

        return {
            data: {
                ...expense,
                lineItems: lineItems || []
            },
            error: null
        };
    } catch (error) {
        console.error('Get expense by ID error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Update expense status (Approve/Reject/OnHold)
 * @param {string} expenseId - Expense UUID
 * @param {string} status - New status ('Approved', 'Rejected', 'OnHold')
 * @param {string} approvedByUserId - User ID of approver
 * @param {string} rejectionReason - Optional rejection reason
 * @returns {Object} { data, error }
 */
export const updateExpenseStatus = async (expenseId, status, approvedByUserId, rejectionReason = null) => {
    try {
        const updateData = {
            status: status,
            approved_by: approvedByUserId,
            approval_date: new Date().toISOString()
        };

        if (rejectionReason) {
            updateData.rejection_reason = rejectionReason;
        }

        const { data, error } = await supabase
            .from('expenses')
            .update(updateData)
            .eq('id', expenseId)
            .select()
            .single();

        if (error) {
            console.error('Update expense status error:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Update expense status error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Update expense details (only for Pending status)
 * @param {string} expenseId - Expense UUID
 * @param {Object} expenseData - Updated expense data
 * @param {Array} lineItems - Updated line items
 * @param {File} file - Optional new file
 * @returns {Object} { data, error }
 */
export const updateExpense = async (expenseId, expenseData, lineItems, file = null) => {
    try {
        // Check if expense is pending
        const { data: existingExpense, error: checkError } = await supabase
            .from('expenses')
            .select('status, file_path')
            .eq('id', expenseId)
            .single();

        if (checkError) {
            return { data: null, error: checkError.message };
        }

        if (existingExpense.status !== 'Pending') {
            return { data: null, error: 'Only Pending expenses can be edited' };
        }

        let fileUrl = expenseData.file_url;
        let filePath = existingExpense.file_path;
        let fileName = expenseData.file_name;
        let fileType = expenseData.file_type;
        let fileSize = expenseData.file_size;

        // Upload new file if provided
        if (file) {
            // Delete old file if exists
            if (existingExpense.file_path) {
                await supabase.storage.from('expense-documents').remove([existingExpense.file_path]);
            }

            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            filePath = `expenses/${expenseData.institution_id}/${expenseData.teacher_id}/${timestamp}_${sanitizedFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('expense-documents')
                .upload(filePath, file);

            if (uploadError) {
                return { data: null, error: 'Failed to upload document: ' + uploadError.message };
            }

            const { data: { publicUrl } } = supabase.storage
                .from('expense-documents')
                .getPublicUrl(filePath);

            fileUrl = publicUrl;
            fileName = file.name;
            fileType = file.type;
            fileSize = file.size;
        }

        // Update expense record
        const { data: updatedExpense, error: updateError } = await supabase
            .from('expenses')
            .update({
                expense_date: expenseData.expense_date,
                payment_mode: expenseData.payment_mode,
                total_amount: expenseData.total_amount,
                description: expenseData.description,
                file_url: fileUrl,
                file_path: filePath,
                file_name: fileName,
                file_type: fileType,
                file_size: fileSize,
                updated_at: new Date().toISOString()
            })
            .eq('id', expenseId)
            .select()
            .single();

        if (updateError) {
            return { data: null, error: updateError.message };
        }

        // Delete existing line items
        await supabase
            .from('expense_line_items')
            .delete()
            .eq('expense_id', expenseId);

        // Insert new line items
        if (lineItems && lineItems.length > 0) {
            const lineItemsData = lineItems.map(item => ({
                expense_id: expenseId,
                expense_type: item.expense_type || item.type,
                purpose: item.purpose,
                start_date: item.start_date,
                end_date: item.end_date,
                amount: parseFloat(item.amount)
            }));

            const { error: lineItemsError } = await supabase
                .from('expense_line_items')
                .insert(lineItemsData);

            if (lineItemsError) {
                return { data: null, error: 'Failed to update line items: ' + lineItemsError.message };
            }
        }

        return { data: updatedExpense, error: null };
    } catch (error) {
        console.error('Update expense error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Delete expense (only Pending status)
 * @param {string} expenseId - Expense UUID
 * @returns {Object} { data, error }
 */
export const deleteExpense = async (expenseId) => {
    try {
        // Get expense details
        const { data: expense, error: fetchError } = await supabase
            .from('expenses')
            .select('status, file_path')
            .eq('id', expenseId)
            .single();

        if (fetchError) {
            return { data: null, error: fetchError.message };
        }

        if (expense.status !== 'Pending') {
            return { data: null, error: 'Only Pending expenses can be deleted' };
        }

        // Delete file from storage
        if (expense.file_path) {
            await supabase.storage
                .from('expense-documents')
                .remove([expense.file_path]);
        }

        // Delete expense (cascade will delete line items)
        const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expenseId);

        if (deleteError) {
            return { data: null, error: deleteError.message };
        }

        return { data: { message: 'Expense deleted successfully' }, error: null };
    } catch (error) {
        console.error('Delete expense error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Download expense document
 * @param {string} filePath - File path in storage
 * @param {string} fileName - Original file name
 * @returns {Object} { data, error }
 */
export const downloadExpenseDocument = async (filePath, fileName) => {
    try {
        const { data, error } = await supabase.storage
            .from('expense-documents')
            .download(filePath);

        if (error) {
            console.error('Download error:', error);
            return { data: null, error: error.message };
        }

        // Create download link
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { data: { message: 'Download started' }, error: null };
    } catch (error) {
        console.error('Download error:', error);
        return { data: null, error: error.message };
    }
};

/**
 * Get expense statistics for dashboard
 * @param {Object} filters - Optional filters (teacher_id, institution_id)
 * @returns {Object} { data, error }
 */
export const getExpenseStatistics = async (filters = {}) => {
    try {
        const { data: expenses, error } = await getAllExpenses(filters);

        if (error) {
            return { data: null, error };
        }

        const stats = {
            totalRequests: expenses.length,
            pendingCount: expenses.filter(e => e.status === 'Pending').length,
            approvedCount: expenses.filter(e => e.status === 'Approved').length,
            rejectedCount: expenses.filter(e => e.status === 'Rejected').length,
            onHoldCount: expenses.filter(e => e.status === 'OnHold').length,
            totalApprovedAmount: expenses
                .filter(e => e.status === 'Approved')
                .reduce((sum, e) => sum + parseFloat(e.total_amount || 0), 0),
            totalPendingAmount: expenses
                .filter(e => e.status === 'Pending')
                .reduce((sum, e) => sum + parseFloat(e.total_amount || 0), 0)
        };

        return { data: stats, error: null };
    } catch (error) {
        console.error('Get statistics error:', error);
        return { data: null, error: error.message };
    }
};
