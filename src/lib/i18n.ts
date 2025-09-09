
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

        // Sidebar
        dashboard: "Dashboard",
        myActivity: "My Activity",
        reporting: "Reporting",
        userManagement: "User Management",
        logout: "Logout",
        loggedInAs: "Logged in as",

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

        // Modals
        addNewDocument: "Add New Document",
        editDocument: "Edit Document",
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
    },
    km: {
        // General
        all: "ទាំងអស់",
        cancel: "បោះបង់",
        save: "រក្សាទុក",
        add: "បន្ថែម",
        edit: "កែសម្រួល",
        delete: "លុប",
        confirm: "បញ្ជាក់",
        success: "ជោគជ័យ",
        error: "កំហុស",
        search: "ស្វែងរក...",
        note: "កំណត់ចំណាំ",
        status: "ស្ថានភាព",
        actions: "សកម្មភាព",
        name: "ឈ្មោះឯកសារ",
        office: "ការិយាល័យ",
        lastUpdate: "កែចុងក្រោយ",

        // Sidebar
        dashboard: "ទំព័រដើម",
        myActivity: "កំណត់ហេតុសកម្មភាពរបស់ខ្ញុំ",
        reporting: "ការរាយការណ៍",
        userManagement: "ការគ្រប់គ្រង​អ្នកប្រើប្រាស់",
        logout: "ចាកចេញ",
        loggedInAs: "បានចូលជា",

        // Header
        overview: "ទិដ្ឋភាពរួម",

        // Document Management
        documentManagement: "ការគ្រប់គ្រងឯកសារ",
        addDocument: "បន្ថែមឯកសារ​ថ្មី",
        combineSelected: "បូកបញ្ចូលការជ្រើសរើស",
        deleteSelected: "លុបការជ្រើសរើស",
        manageWorkflowDepts: "គ្រប់គ្រងនាយកដ្ឋានលំហូរការងារ",
        manageDocTypes: "គ្រប់គ្រងប្រភេទឯកសារ",
        manageAssignedDepts: "គ្រប់គ្រងនាយកដ្ឋានដែលបានចាត់តាំង",
        manageColumns: "គ្រប់គ្រងជួរឈរ",
        exportData: "នាំចេញទិន្នន័យ (JSON)",
        importData: "នាំចូលទិន្នន័យ (JSON)",
        results: "លទ្ធផល",
        deleteXDocuments: "លុប {count} ឯកសារ",
        areYouSureDelete: "តើអ្នកប្រាកដទេថាចង់លុបឯកសារដែលបានជ្រើសរើសចំនួន {count} ចេញ? វានឹងលុកំណត់ហេតុដែលពាក់ព័ន្ធទាំងអស់ចេញដែរ។ សកម្មភាពនេះមិនអាចមិនធ្វើវិញបានទេ។",
        documentsDeleted: "ឯកសារចំនួន {count} ត្រូវបានលុប។",

        // Document Table
        documentId: "លេខឯកសារ",
        documentType: "ប្រភេទឯកសារ",
        assignedDepartment: "នាយកដ្ឋាន",
        currentStatus: "ស្ថានភាពបច្ចុប្បន្ន",
        noDocumentsFound: "រកមិនឃើញឯកសារទេ",
        clearAllFilters: "ជម្រះតម្រងទាំងអស់",
        filterDidNotMatch: "ការកំណត់តម្រងរបស់អ្នកមិនត្រូវគ្នានឹងឯកសារណាមួយទេ។",
        xOfYRowSelected: "{selected} នៃ {total} ជួរបានជ្រើសរើស។",
        rowsPerPage: "ជួរដេកក្នុងមួយទំព័រ",
        pageXOfY: "ទំព័រ {current} នៃ {total}",

        // Workflow Chart
        workflowStatus: "ស្ថានភាពលំហូរឯកសារ",

        // Login Form
        docuFlowLogin: "ប្រព័ន្ធគ្រប់គ្រងឯកសារ",
        pleaseSignIn: "សូមចូលដើម្បីបន្ត",
        username: "ឈ្មោះ​អ្នកប្រើប្រាស់",
        password: "ពាក្យសម្ងាត់",
        rememberMe: "ចងចាំខ្ញុំ",
        loginFailed: "ការចូលล้มเหลว",
        invalidCredentials: "ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។",
        loggingIn: "កំពុងចូល...",
        login: "ចូល",
        welcome: "សូមស្វាគមន៍, {username}!",
        loggedInSuccess: "អ្នកបានចូលដោយជោគជ័យ។",

        // Metrics
        totalDocuments: "ឯកសារ​សរុប",
        inProgress: "កំពុង​ដំណើរការ",
        delayed: "ពន្យាពេល",
        releaseDateReached: "ដល់កាលបរិច្ឆេទចេញផ្សាយ",
        completed: "បាន​បញ្ចប់",
        completedSuccess: "បានបញ្ចប់ (ជោគជ័យ)",
        completedUnsuccess: "បានបញ្ចប់ (មិនជោគជ័យ)",
        exceedingPeriod: "លើសពីរយៈពេល",

        // Modals
        addNewDocument: "បន្ថែមឯកសារថ្មី",
        editDocument: "កែសម្រួលឯកសារ",
        documentHistory: "ប្រវត្តិសម្រាប់",
        reviewJourney: "ពិនិត្យមើលការធ្វើដំណើរពេញលេញ និងរាល់ការផ្លាស់ប្តូរដែលបានធ្វើចំពោះឯកសារនេះ។",
        sourceDocuments: "ឯកសារប្រភព",
        department: "នាយកដ្ឋាន",
        departmentTimestamps: "ត្រាពេលវេលា និងព័ត៌មានលម្អិតរបស់នាយកដ្ឋាន",
        statusChangeLog: "កំណត់ហេតុការផ្លាស់ប្តូរស្ថានភាព",
        start: "ចាប់ផ្តើម",
        end: "បញ្ចប់",
        period: "រយៈពេល",
        receiverName: "ឈ្មោះអ្នកទទួល",
        noStatusChanges: "មិនមានការផ្លាស់ប្តូរស្ថានភាពដែលបានកត់ត្រាទុកទេ។",
        from: "ពី",
        to: "ទៅ",
        reason: "មូលហេតុ",
        myActivityLog: "កំណត់ហេតុសកម្មភាពរបស់ខ្ញុំ",
        myActivityLogDesc: "ពិនិត្យមើលសកម្មភាពរបស់អ្នក ឬបង្កើតរបាយការណ៍អំពីឯកសារដែលអ្នកបានដោះស្រាយ។",
        searchLog: "ស្វែងរកកំណត់ហេតុ",
        generateReport: "បង្កើតរបាយការណ៍",
        searchByDocId: "ស្វែងរកតាមលេខសម្គាល់ឯកសារ...",
        pickStartDate: "ជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម",
        pickEndDate: "ជ្រើសរើសកាលបរិច្ឆេទបញ្ចប់",
        today: "ថ្ងៃនេះ",
        thisWeek: "សប្តាហ៍​នេះ",
        thisMonth: "ខែ​នេះ",
        reportResult: "អ្នកបានដោះស្រាយឯកសារពិសេសចំនួន {count}",
        noActivityFound: "រកមិនឃើញសកម្មភាពទេ។",
        timestamp: "ត្រាពេលវេលា",
        action: "សកម្មភាព",
        details: "ព័ត៌មានលម្អិត",
        documentReports: "របាយការណ៍ឯកសារ",
        documentReportsDesc: "បង្កើតរបាយការណ៍អំពីប្រភេទឯកសារ និងការបែងចែកតាមនាយកដ្ឋាន។",
        totalDocs: "ឯកសារសរុប",
        types: "ប្រភេទ",
        count: "ចំនួន",
        pleaseSelectDateRange: "សូមជ្រើសរើសចន្លោះកាលបរិច្ឆេទ និងបង្កើតរបាយការណ៍។",
    }
};

export const useTranslation = () => {
    const { state } = useAppContext();
    const { language } = state;

    const t = (key: keyof typeof translations.en, params?: { [key: string]: string | number }) => {
        let translation = translations[language]?.[key] || translations.en[key];
        if (params) {
            Object.keys(params).forEach(pKey => {
                translation = translation.replace(`{${pKey}}`, String(params[pKey]));
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
