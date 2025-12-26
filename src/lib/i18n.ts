

'use client'

import { useAppContext } from "@/hooks/use-app-context";

const translations = {
    en: {
        // General
        all: "All",
        cancel: "Cancel",
        save: "Save",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        success: "Success",
        error: "Error",
        search: "Search...",
        note: "Note",
        status: "Status",
        actions: "Actions",
        name: "Name",
        office: "Office",
        lastUpdate: "Last Update",
        clear: "Clear",
        user: "User",
        unsuccess: "Unsuccess",

        // Sidebar
        dashboard: "Dashboard",
        myActivity: "My Activity",
        reporting: "Reporting",
        userManagement: "User Management",
        logout: "Logout",
        loggedInAs: "Logged in as",
        globalActivity: "Global Activity",

        // Header
        overview: "Overview",

        // Document Management
        documentManagement: "Document Management",
        addDocument: "Add New Document",
        combineSelected: "Combine Selected",
        deleteSelected: "Delete Selected",
        manageWorkflowDepts: "Manage Workflow Depts",
        manageDocTypes: "Manage Document Types",
        manageAssignedDepts: "Manage Assigned Depts",
        manageColumns: "Manage Columns",
        exportData: "Export Data (JSON)",
        importData: "Import Data (JSON)",
        results: "results",
        deleteXDocuments: "Delete {count} Documents",
        areYouSureDelete: "Are you sure you want to delete {count} selected documents? This will also remove all associated logs. This action cannot be undone.",
        documentsDeleted: "{count} documents have been deleted.",

        // Document Table
        documentId: "Document ID",
        documentType: "Document Type",
        assignedDepartment: "Assigned Dept.",
        currentStatus: "Current Status",
        noDocumentsFound: "No Documents Found",
        clearAllFilters: "Clear All Filters",
        filterDidNotMatch: "Your filter settings did not match any documents.",
        xOfYRowSelected: "{selected} of {total} row(s) selected.",
        rowsPerPage: "Rows per page",
        pageXOfY: "Page {current} of {total}",

        // Workflow Chart
        workflowStatus: "Document Workflow Status",

        // Login Form
        docuFlowLogin: "Document Workflow System",
        pleaseSignIn: "Please sign in to continue",
        username: "Username",
        password: "Password",
        rememberMe: "Remember me",
        loginFailed: "Login Failed",
        invalidCredentials: "Invalid username or password.",
        loggingIn: "Logging in...",
        login: "Login",
        welcome: "Welcome, {username}!",
        loggedInSuccess: "You have successfully logged in.",

        // Metrics
        totalDocuments: "Total Documents",
        inProgress: "In Progress",
        delayed: "Delayed",
        releaseDateReached: "Release Date Reached",
        completed: "Completed",
        completedSuccess: "Completed (Success)",
        completedUnsuccess: "Completed (Unsuccess)",
        exceedingPeriod: "Exceeding Period",
        
        // Search & Filter
        searchByDocIdLabel: "Search Document",
        historyFrom: "History From:",
        historyTo: "History To:",
        filterByDate: "Filter by Date",
        docsExceeding: "Documents exceeding:",
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        in: "in",
        allDepartments: "All Departments",
        calculate: "Calculate",

        // Action Menu
        viewLog: "View Log",
        docLink1: "ឯកសារទី១",
        docLink2: "ឯកសារទី២",
        docLink3: "ឯកសារទី៣",
        docLink4: "ឯកសារទី៤",
        editDetails: "Edit Details",
        splitDocument: "Split Document",
        delay: "Delay",
        releaseNow: "Release Now",
        addNote: "Add Note",
        moveBack: "Move Back",
        advance: "Advance",
        complete: "Complete",
        reopen: "Re-open",
        deleteDocument: "Delete Document",

        // Modals
        addNewDocument: "Add New Document",
        docName: "កម្មវត្ថុ",
        docIdPrimary: "លេខឯកសារដើម",
        selectDocType: "Select a document type...",
        searchDocType: "Search types...",
        noDocTypeFound: "No matching type found.",
        secondaryId: "Secondary ID",
        tertiaryId: "Tertiary ID",
        quaternaryId: "Quaternary ID",
        selectAssignedDept: "Select a department...",
        searchAssignedDept: "Search or create...",
        noAssignedDeptFound: "No matching department found.",
        initialReceiver: "ឈ្មោះអ្នកទទួល",
        keywords: "Keywords",
        keywordsPlaceholder: "For better search results...",
        tagsLabel: "Tags (comma-separated)",
        suggest: "Suggest",
        suggesting: "Suggesting...",
        initialNote: "Initial Note",
        editDocument: "Edit Document",
        saveChanges: "Save Changes",
        documentHistory: "History for",
        reviewJourney: "Review the complete journey and all changes made to this document.",
        sourceDocuments: "Source Documents",
        department: "Department",
        departmentTimestamps: "Department Timestamps & Details",
        statusChangeLog: "Status Change Log",
        start: "Start",
        end: "End",
        period: "Period",
        receiverName: "Receiver Name",
        noStatusChanges: "No status changes logged.",
        from: "From",
        to: "To",
        reason: "Reason",
        myActivityLog: "My Activity Log",
        myActivityLogDesc: "Review your actions or generate a report on documents you've handled.",
        searchLog: "Search Log",
        generateReport: "Generate Report",
        searchByDocId: "Search by Document ID...",
        pickStartDate: "Pick a start date",
        pickEndDate: "Pick an end date",
        today: "Today",
        thisWeek: "This Week",
        thisMonth: "This Month",
        reportResult: "You handled {count} unique documents",
        noActivityFound: "No activity found.",
        timestamp: "Timestamp",
        action: "Action",
        details: "Details",
        documentReports: "Document Reports",
        documentReportsDesc: "Generate reports on document types and departmental distribution.",
        totalDocs: "Total Docs",
        types: "Types",
        count: "Count",
        pleaseSelectDateRange: "Please select a date range and generate a report.",
        areYouSureDeleteDoc: "Are you sure you want to delete document {docId}? This will also remove associated logs. This action cannot be undone.",
        delayedUntil: "Delayed until {date}",
        completionStatus: "Completion Status",
        finalNote: "Final Note (Optional)",
        customDate: "Custom Date (Optional)",
        pickDate: "Pick a date",
        markAsComplete: "Mark as Complete",
        grandTotal: "Grand Total",
        totalUniqueDocTypes: "Total Unique Document Types",
        totalCombinedDocs: "Total Combined Documents",
        totalSplitDocs: "Split Docs by Type",
        none: "None",

        // User Management
        userManagementDesc: "Add, edit, or remove users and manage their roles and permissions.",
        existingUsers: "Existing Users",
        editUser: "Edit User: {username}",
        addNewUser: "Add New User",
        role: "Role",
        leaveBlankPassword: "Leave blank to keep current password",
        passwordRequired: "Password is required for new users.",
        dashboardPermissions: "Dashboard Permissions",
        generalDocPermissions: "General Document Permissions",
        docActionPermissions: "Document Action Permissions",
        docFieldEditPermissions: "Document Field Edit Permissions",
        docLinkPermissions: "Document Link Permissions",
        adminPermissions: "Admin Permissions",
        deptAccessPermissions: "Department Access Permissions",
        deptAccessDesc: "If no departments are selected, the user will have access to all departments.",
        allHaveAccess: "s have all permissions by default.",
        clearForm: "Clear Form",
        saveChanges: "រក្សាទុកការផ្លាស់ប្តូរ",
        addUser: "Add User",
        cancelEdit: "Cancel Edit & Add New",
        Admin: "Admin",
        User: "អ្នកប្រើប្រាស់",

        // Permissions
        canViewMetrics: 'មើលកាតម៉ែត្រ',
        canViewWorkflowChart: 'មើលតារាងលំហូរការងារ',
        canAddDocument: 'បន្ថែមឯកសារថ្មី',
        canCombineDocuments: 'បូកបញ្ចូលឯកសារ',
        canManageColumns: 'គ្រប់គ្រងជួរឈរ',
        canExportData: 'នាំចេញទិន្នន័យ',
        canViewLog: 'មើលកំណត់ហេតុ',
        canViewCompleted: 'មើលឯកសារដែលបានបញ្ចប់',
        canSplitDocument: 'បំបែកឯកសារ',
        canEditCurrentNote: 'កែសម្រួលកំណត់ចំណាំបច្ចុប្បន្ន',
        canMoveDocument: 'ផ្លាស់ទីឯកសារ (ទៅមុខ/ថយក្រោយ)',
        canDelayDocument: 'ពន្យាពេលឯកសារ',
        canReleaseDocument: 'ចេញផ្សាយឯកសារពីការពន្យាពេល',
        canCompleteDocument: 'បញ្ចប់ឯកសារ',
        canDeleteDocument: 'លុបឯកសារ',
        canOpenDocumentLink1: 'បើកឯកសារ (តំណទី 1)',
        canOpenDocumentLink2: 'បើកឯកសារ (តំណទី 2)',
        canOpenDocumentLink3: 'បើកឯកសារ (តំណទី 3)',
        canOpenDocumentLink4: 'បើកឯកសារ (តំណទី 4)',
        canEditDocumentId: 'កែសម្រួលលេខសម្គាល់ឯកសារ (ចម្បង)',
        canEditDocumentName: 'កែសម្រួលខ្លឹមសារ',
        canEditDocumentType: 'កែសម្រួលប្រភេទឯកសារ',
        canEditOffice: 'កែសម្រួលការិយាល័យ',
        canEditAssignedDepartment: 'កែសម្រួលនាយកដ្ឋានដែលបានចាត់តាំង',
        canEditSecondaryId: 'កែសម្រួលលេខសម្គាល់បន្ទាប់បន្សំ',
        canEditTertiaryId: 'កែសម្រួលលេខសម្គាល់ទីបី',
        canEditQuaternaryId: 'កែសម្រួលលេខសម្គាល់ទីបួន',
        canEditDocumentLink1: 'កែសម្រួលតំណឯកសារទី ១',
        canEditDocumentLink2: 'កែសម្រួលតំណឯកសារទី ២',
        canEditDocumentLink3: 'កែសម្រួលតំណឯកសារទី ៣',
        canEditDocumentLink4: 'កែសម្រួលតំណឯកសារទី ៤',
        canEditKeywords: 'កែសម្រួលពាក្យគន្លឹះ',
        canEditTags: 'កែសម្រួលស្លាក',
        canEditInitialNote: 'កែសម្រួលកំណត់ចំណាំដំបូង',
        canManageAdmins: 'អាចគ្រប់គ្រងអ្នកគ្រប់គ្រងបាន',
        canViewGlobalActivity: 'អាចមើលសកម្មភាពសកលបាន',
    }
};

export const useTranslation = () => {
    const { state } = useAppContext();
    const { language } = state;

    const t = (key: keyof typeof translations['en'], params?: { [key: string]: string | number | undefined }) => {
        let translation = translations[language]?.[key] || translations.en[key] || key;
        
        if (typeof translation !== 'string') {
            translation = key; // Fallback to key if translation not found
        }
        
        if (params) {
            Object.keys(params).forEach(pKey => {
                const value = params[pKey] !== undefined ? String(params[pKey]) : `{${pKey}}`;
                translation = translation.replace(`{${pKey}}`, value);
            });
        }
        return translation;
    };

    return t;
};

export const languages = [
    { code: 'en', name: 'English' },
    { code: 'km', name: 'ភាសាខ្មែរ' }
];

    





    

    











    
