
'use client'

import { useAppContext } from "@/hooks/use-app-context";

const translations = {
    en: {
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
        // Workflow Chart
        workflowStatus: "Document Workflow Status",
    },
    km: {
        // Sidebar
        dashboard: "แดชบอร์ด",
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
        // Workflow Chart
        workflowStatus: "ស្ថានភាពលំហូរឯកសារ",
    }
};

export const useTranslation = () => {
    const { state } = useAppContext();
    const { language } = state;

    const t = (key: keyof typeof translations.en) => {
        return translations[language][key] || translations.en[key];
    };

    return t;
};

export const languages = [
    { code: 'en', name: 'English' },
    { code: 'km', name: 'ភាសាខ្មែរ' }
];
