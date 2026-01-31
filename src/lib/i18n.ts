

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
    label: "Label",
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
    manageLabels: "Manage Labels",
    manageColumns: "Manage Columns",
    exportData: "Export Data (JSON)",
    importData: "Import Data (JSON)",
    results: "results",
    deleteXDocuments: "Delete {count} Documents",
    areYouSureDelete: "Are you sure you want to delete {count} selected documents? This will also remove all associated logs. This action cannot be undone.",
    documentsDeleted: "{count} documents have been deleted.",
    bulkAdvance: "Bulk Advance",

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
    docLink1: "Open Link 1",
    docLink2: "Open Link 2",
    docLink3: "Open Link 3",
    docLink4: "Open Link 4",
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
    docName: "Document Name",
    docIdPrimary: "Document ID (Primary)",
    selectDocType: "Select a document type...",
    searchDocType: "Search types...",
    noDocTypeFound: "No matching type found.",
    secondaryId: "Secondary ID",
    tertiaryId: "Tertiary ID",
    quaternaryId: "Quaternary ID",
    selectAssignedDept: "Select a department...",
    searchAssignedDept: "Search or create...",
    noAssignedDeptFound: "No matching department found.",
    selectLabel: "Select a label...",
    searchLabel: "Search or create...",
    noLabelFound: "No matching label found.",
    initialReceiver: "Initial Receiver",
    selectReceiver: "Select receiver...",
    searchReceiver: "Search receivers...",
    noReceiverFound: "No receiver found.",
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
    addUser: "Add User",
    cancelEdit: "Cancel Edit & Add New",
    Admin: "Admin",
    User: "User",

    // Permissions
    canViewMetrics: 'View Metrics Cards',
    canViewWorkflowChart: 'View Workflow Chart',
    canAddDocument: 'Add New Document',
    canCombineDocuments: 'Combine Documents',
    canManageColumns: 'Manage Columns',
    canExportData: 'Export Data',
    canViewLog: 'View Log',
    canViewCompleted: 'View Completed Docs',
    canSplitDocument: 'Split Document',
    canEditCurrentNote: 'Edit Current Note',
    canMoveDocument: 'Move Document (Advance/Back)',
    canDelayDocument: 'Delay Document',
    canReleaseDocument: 'Release Document from Delay',
    canCompleteDocument: 'Complete Document',
    canDeleteDocument: 'Delete Document',
    canOpenDocumentLink1: 'Open Document (Link 1)',
    canOpenDocumentLink2: 'Open Document (Link 2)',
    canOpenDocumentLink3: 'Open Document (Link 3)',
    canOpenDocumentLink4: 'Open Document (Link 4)',
    canEditDocumentId: 'Edit Document ID (Primary)',
    canEditDocumentName: 'Edit Document Name',
    canEditDocumentType: 'Edit Document Type',
    canEditLabel: 'Edit Label',
    canEditAssignedDepartment: 'Edit Assigned Department',
    canEditSecondaryId: 'Edit Secondary ID',
    canEditTertiaryId: 'Edit Tertiary ID',
    canEditQuaternaryId: 'Edit Quaternary ID',
    canEditDocumentLink1: 'Edit Document Link 1',
    canEditDocumentLink2: 'Edit Document Link 2',
    canEditDocumentLink3: 'Edit Document Link 3',
    canEditDocumentLink4: 'Edit Document Link 4',
    canEditKeywords: 'Edit Keywords',
    canEditTags: 'Edit Tags',
    canEditInitialNote: 'Edit Initial Note',
    canManageAdmins: 'Can Manage Admins',
    canViewGlobalActivity: 'Can View Global Activity',
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
      name: "ឈ្មោះ",
      label: "ស្លាក",
      lastUpdate: "ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ",
      clear: "សម្អាត",
      user: "អ្នកប្រើប្រាស់",
      unsuccess: "មិនជោគជ័យ",

      // Sidebar
      dashboard: "ផ្ទាំងគ្រប់គ្រង",
      myActivity: "សកម្មភាពរបស់ខ្ញុំ",
      reporting: "ការរាយការណ៍",
      userManagement: "ការគ្រប់គ្រងអ្នកប្រើប្រាស់",
      logout: "ចាកចេញ",
      loggedInAs: "បានចូលក្នុងនាមជា",
      globalActivity: "សកម្មភាពសកល",

      // Header
      overview: "ទិដ្ឋភាពទូទៅ",

      // Document Management
      documentManagement: "ការគ្រប់គ្រងឯកសារ",
      addDocument: "បន្ថែមឯកសារថ្មី",
      combineSelected: "បូកបញ្ចូលឯកសារដែលបានជ្រើសរើស",
      deleteSelected: "លុបឯកសារដែលបានជ្រើសរើស",
      manageWorkflowDepts: "គ្រប់គ្រងនាយកដ្ឋានលំហូរការងារ",
      manageDocTypes: "គ្រប់គ្រងប្រភេទឯកសារ",
      manageAssignedDepts: "គ្រប់គ្រងនាយកដ្ឋានដែលបានចាត់តាំង",
      manageLabels: "គ្រប់គ្រងស្លាក",
      manageColumns: "គ្រប់គ្រងជួរឈរ",
      exportData: "នាំចេញទិន្នន័យ (JSON)",
      importData: "នាំចូលទិន្នន័យ (JSON)",
      results: "លទ្ធផល",
      deleteXDocuments: "លុប {count} ឯកសារ",
      areYouSureDelete: "តើអ្នកប្រាកដទេថាចង់លុបឯកសារដែលបានជ្រើសរើស {count} នេះ? វានឹងលុបកំណត់ហេតុដែលពាក់ព័ន្ធទាំងអស់ផងដែរ។ សកម្មភាពនេះមិនអាចមិនធ្វើវិញបានទេ។",
      documentsDeleted: "ឯកសារ {count} ត្រូវបានលុប។",
      bulkAdvance: "បញ្ជូនឯកសារច្រើន",

      // Document Table
      documentId: "លេខសម្គាល់ឯកសារ",
      documentType: "ប្រភេទឯកសារ",
      assignedDepartment: "នាយកដ្ឋានដែលបានចាត់តាំង",
      currentStatus: "ស្ថានភាពបច្ចុប្បន្ន",
      noDocumentsFound: "រកមិនឃើញឯកសារទេ",
      clearAllFilters: "សម្អាតតម្រងទាំងអស់",
      filterDidNotMatch: "ការកំណត់តម្រងរបស់អ្នកមិនត្រូវគ្នានឹងឯកសារណាមួយទេ។",
      xOfYRowSelected: "{selected} នៃ {total} ជួរដេកត្រូវបានជ្រើសរើស។",
      rowsPerPage: "ជួរដេកក្នុងមួយទំព័រ",
      pageXOfY: "ទំព័រ {current} នៃ {total}",

      // Workflow Chart
      workflowStatus: "ស្ថានភាពលំហូរការងារឯកសារ",

      // Login Form
      docuFlowLogin: "ប្រព័ន្ធលំហូរការងារឯកសារ",
      pleaseSignIn: "សូមចូលដើម្បីបន្ត",
      username: "ឈ្មោះ​អ្នកប្រើប្រាស់",
      password: "ពាក្យសម្ងាត់",
      rememberMe: "ចងចាំខ្ញុំ",
      loginFailed: "ការចូលបរាជ័យ",
      invalidCredentials: "ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។",
      loggingIn: "កំពុងចូល...",
      login: "ចូល",
      welcome: "សូមស្វាគមន៍, {username}!",
      loggedInSuccess: "អ្នកបានចូលដោយជោគជ័យ។",

      // Metrics
      totalDocuments: "ឯកសារសរុប",
      inProgress: "កំពុងដំណើរការ",
      delayed: "ពន្យាពេល",
      releaseDateReached: "បានដល់កាលបរិច្ឆេទចេញផ្សាយ",
      completed: "បានបញ្ចប់",
      completedSuccess: "បានបញ្ចប់ (ជោគជ័យ)",
      completedUnsuccess: "បានបញ្ចប់ (មិនជោគជ័យ)",
      exceedingPeriod: "លើសរយៈពេល",
      
      // Search & Filter
      searchByDocIdLabel: "ស្វែងរកឯកសារ",
      historyFrom: "ប្រវត្តិចាប់ពី:",
      historyTo: "ប្រវត្តិដល់:",
      filterByDate: "តម្រងតាមកាលបរិច្ឆេទ",
      docsExceeding: "ឯកសារលើសពី:",
      days: "ថ្ងៃ",
      hours: "ម៉ោង",
      minutes: "នាទី",
      in: "ក្នុង",
      allDepartments: "នាយកដ្ឋានទាំងអស់",
      calculate: "គណនា",

      // Action Menu
      viewLog: "មើលកំណត់ហេតុ",
      docLink1: "ឯកសារទី១",
      docLink2: "ឯកសារទី២",
      docLink3: "ឯកសារទី៣",
      docLink4: "ឯកសារទី៤",
      editDetails: "កែសម្រួលព័ត៌មានលម្អិត",
      splitDocument: "បំបែកឯកសារ",
      delay: "ពន្យាពេល",
      releaseNow: "ចេញផ្សាយឥឡូវនេះ",
      addNote: "បន្ថែមចំណាំ",
      moveBack: "ផ្លាស់ទីទៅក្រោយ",
      advance: "ទៅមុខ",
      complete: "បញ្ចប់",
      reopen: "បើកឡើងវិញ",
      deleteDocument: "លុបឯកសារ",

      // Modals
      addNewDocument: "បន្ថែមឯកសារថ្មី",
      docName: "កម្មវត្ថុ",
      docIdPrimary: "លេខឯកសារដើម",
      selectDocType: "ជ្រើសរើសប្រភេទឯកសារ...",
      searchDocType: "ស្វែងរកប្រភេទ...",
      noDocTypeFound: "រកមិនឃើញប្រភេទដែលត្រូវគ្នាទេ។",
      secondaryId: "លេខសម្គាល់ទីពីរ",
      tertiaryId: "លេខសម្គាល់ទីបី",
      quaternaryId: "លេខសម្គាល់ទីបួន",
      selectAssignedDept: "ជ្រើសរើសនាយកដ្ឋាន...",
      searchAssignedDept: "ស្វែងរក ឬបង្កើត...",
      noAssignedDeptFound: "រកមិនឃើញនាយកដ្ឋានដែលត្រូវគ្នាទេ។",
      selectLabel: "ជ្រើសរើសស្លាក...",
      searchLabel: "ស្វែងរក ឬបង្កើតស្លាក...",
      noLabelFound: "រកមិនឃើញស្លាកដែលត្រូវគ្នាទេ។",
      initialReceiver: "ឈ្មោះអ្នកទទួល",
      selectReceiver: "ជ្រើសរើសអ្នកទទួល...",
      searchReceiver: "ស្វែងរកអ្នកទទួល...",
      noReceiverFound: "រកមិនឃើញអ្នកទទួលទេ។",
      keywords: "ពាក្យគន្លឹះ",
      keywordsPlaceholder: "ដើម្បីលទ្ធផលស្វែងរកកាន់តែប្រសើរ...",
      tagsLabel: "ស្លាក (បំបែកដោយក្បៀស)",
      suggest: "ស្នើ",
      suggesting: "កំពុងស្នើ...",
      initialNote: "កំណត់ចំណាំដំបូង",
      editDocument: "កែសម្រួលឯកសារ",
      saveChanges: "រក្សាទុកការផ្លាស់ប្តូរ",
      documentHistory: "ប្រវត្តិសម្រាប់",
      reviewJourney: "ពិនិត្យមើលដំណើរពេញលេញ និងការផ្លាស់ប្តូរទាំងអស់ដែលបានធ្វើឡើងចំពោះឯកសារនេះ។",
      sourceDocuments: "ឯកសារប្រភព",
      department: "នាយកដ្ឋាន",
      departmentTimestamps: "ត្រាពេលវេលា និងព័ត៌មានលម្អិតរបស់នាយកដ្ឋាន",
      statusChangeLog: "កំណត់ហេតុការផ្លាស់ប្តូរស្ថានភាព",
      start: "ចាប់ផ្តើម",
      end: "បញ្ចប់",
      period: "រយៈពេល",
      receiverName: "ឈ្មោះអ្នកទទួល",
      noStatusChanges: "គ្មានការផ្លាស់ប្តូរស្ថានភាពត្រូវបានកត់ត្រាទេ។",
      from: "ពី",
      to: "ទៅ",
      reason: "ហេតុផល",
      myActivityLog: "កំណត់ហេតុសកម្មភាពរបស់ខ្ញុំ",
      myActivityLogDesc: "ពិនិត្យមើលសកម្មភាពរបស់អ្នក ឬបង្កើតរបាយការណ៍អំពីឯកសារដែលអ្នកបានដោះស្រាយ។",
      searchLog: "ស្វែងរកកំណត់ហេតុ",
      generateReport: "បង្កើតរបាយការណ៍",
      searchByDocId: "ស្វែងរកតាមលេខសម្គាល់ឯកសារ...",
      pickStartDate: "ជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម",
      pickEndDate: "ជ្រើសរើសកាលបរិច្ឆេទបញ្ចប់",
      today: "ថ្ងៃនេះ",
      thisWeek: "សប្តាហ៍នេះ",
      thisMonth: "ខែ​នេះ",
      reportResult: "អ្នកបានដោះស្រាយឯកសារ {count} ផ្សេងៗគ្នា",
      noActivityFound: "រកមិនឃើញសកម្មភាពទេ។",
      timestamp: "ត្រាពេលវេលា",
      action: "សកម្មភាព",
      details: "ព័ត៌មានលម្អិត",
      documentReports: "របាយការណ៍ឯកសារ",
      documentReportsDesc: "បង្កើតរបាយការណ៍អំពីប្រភេទឯកសារ និងការចែកចាយតាមនាយកដ្ឋាន។",
      totalDocs: "ឯកសារសរុប",
      types: "ប្រភេទ",
      count: "ចំនួន",
      pleaseSelectDateRange: "សូមជ្រើសរើសចន្លោះកាលបរិច្ឆេទ ហើយបង្កើតរបាយការណ៍។",
      areYouSureDeleteDoc: "តើអ្នកប្រាកដទេថាចង់លុបឯកសារ {docId}? វានឹងលុបកំណត់ហេតុដែលពាក់ព័ន្ធទាំងអស់ផងដែរ។ សកម្មភាពនេះមិនអាចមិនធ្វើវិញបានទេ។",
      delayedUntil: "បានពន្យាពេលរហូតដល់ {date}",
      completionStatus: "ស្ថានភាព​នៃ​ការ​បញ្ចប់",
      finalNote: "កំណត់ចំណាំចុងក្រោយ (ស្រេចចិត្ត)",
      customDate: "កាលបរិច្ឆេទផ្ទាល់ខ្លួន (ស្រេចចិត្ត)",
      pickDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
      markAsComplete: "សម្គាល់ថាបានបញ្ចប់",
      grandTotal: "សរុបរួម",
      totalUniqueDocTypes: "ប្រភេទឯកសារពិសេសសរុប",
      totalCombinedDocs: "ឯកសាររួមបញ្ចូលគ្នាសរុប",
      totalSplitDocs: "បំបែកឯកសារតាមប្រភេទ",
      none: "គ្មាន",

      // User Management
      userManagementDesc: "បន្ថែម កែសម្រួល ឬលុបអ្នកប្រើប្រាស់ និងគ្រប់គ្រងតួនាទី និងការអនុញ្ញាតរបស់ពួកគេ។",
      existingUsers: "អ្នកប្រើប្រាស់ដែលមានស្រាប់",
      editUser: "កែសម្រួលអ្នកប្រើប្រាស់: {username}",
      addNewUser: "បន្ថែមអ្នកប្រើប្រាស់ថ្មី",
      role: "តួនាទី",
      leaveBlankPassword: "ទុកចន្លោះដើម្បីរក្សាពាក្យសម្ងាត់បច្ចុប្បន្ន",
      passwordRequired: "ពាក្យសម្ងាត់គឺចាំបាច់សម្រាប់អ្នកប្រើប្រាស់ថ្មី។",
      dashboardPermissions: "ការអនុញ្ញាតផ្ទាំងគ្រប់គ្រង",
      generalDocPermissions: "ការអនុញ្ញាតឯកសារទូទៅ",
      docActionPermissions: "ការអនុញ្ញាតសកម្មភាពឯកសារ",
      docFieldEditPermissions: "ការអនុញ្ញាតកែសម្រួលវាលឯកសារ",
      docLinkPermissions: "ការអនុញ្ញាតតំណឯកសារ",
      adminPermissions: "ការអនុញ្ញាតអ្នកគ្រប់គ្រង",
      deptAccessPermissions: "ការអនុញ្ញាតការចូលប្រើនាយកដ្ឋាន",
      deptAccessDesc: "ប្រសិនបើគ្មាននាយកដ្ឋានណាមួយត្រូវបានជ្រើសរើសទេ អ្នកប្រើប្រាស់នឹងមានសិទ្ធិចូលប្រើគ្រប់នាយកដ្ឋានទាំងអស់។",
      allHaveAccess: "s មានការអនុញ្ញាតទាំងអស់តាមលំនាំដើម។",
      clearForm: "សម្អាតទម្រង់",
      addUser: "បន្ថែម​អ្នក​ប្រើ",
      cancelEdit: "បោះបង់ការកែសម្រួល និងបន្ថែមថ្មី",
      Admin: "អ្នកគ្រប់គ្រង",
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
      canEditLabel: 'កែសម្រួលស្លាក',
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
}


export const useTranslation = () => {
    const { state } = useAppContext();
    const { language } = state;

    const t = (key: keyof typeof translations['en'], params?: { [key: string]: string | number | undefined }) => {
        let translationKey = key as keyof typeof translations['km'];
        // @ts-ignore
        let translation = translations[language]?.[translationKey] || translations.en[key] || key;
        
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

    





    

    











    







