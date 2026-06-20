
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    Account, Transaction, Budget, Goal, Asset, Liability, AppSettings, User, Role, ChartOfAccount,
    Currency, TransactionType, AccountType, GoalStatus, GoalPriority,
    UserStatus, ExchangeRateRecord, DepreciationMethod, Attachment, AssetType, LiabilityType,
    AppModuleName, PermissionAction, ModulePermissions, BudgetTemplate, AccountStatus
} from './types';
import { convertToDefault, getPhnomPenhNowISO } from './utils';

const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
        dashboard: 'Dashboard',
        transactions: 'Transactions',
        accounts: 'Accounts',
        goals: 'Goals',
        budget: 'Budget',
        analytics: 'Analytics',
        assets: 'Assets',
        liabilities: 'Liabilities',
        reports: 'Reports',
        settings: 'Settings',
        add: 'Add',
        edit: 'Edit',
        update: 'Update',
        delete: 'Delete',
        view: 'View',
        view_details: 'Details',
        export: 'Export',
        import: 'Import',
        save: 'Save',
        cancel: 'Cancel',
        confirm: 'Confirm',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        optional: 'Optional',
        total_balance: 'Total Balance',
        total_balance_tooltip: 'The total money of all accounts converted into base currency (excluding your net worth)',
        total_income: 'Total Income',
        total_income_tooltip: 'Total incoming fund to your accounts during the selected period, converted into base currency (excluding transfers from any of your accounts)',
        total_expenses: 'Total Expenses',
        total_expenses_tooltip: 'Total spendings fund to your accounts during the selected period, converted into base currency (excluding transfers from any of your accounts)',
        total_savings: 'Total Savings',
        net_worth: 'Net Worth',
        net_worth_tooltip: 'Net worth (excluding total money of all accounts)',
        recent_activity: 'Recent Activity',
        your_accounts: 'Your Accounts',
        income: 'Income',
        expense: 'Expense',
        search: 'Search...',
        no_data: 'No data available',
        confirm_delete: 'Confirm Delete',
        new_record: 'New Record',
        savings_rate: 'Savings Rate',
        net_savings: 'Net Income',
        comparison: 'Comparison',
        breakdown: 'Breakdown',
        statistics: 'Statistics',
        priority: 'Priority',
        total_assets: 'Total Assets',
        total_liabilities: 'Total Liabilities',
        asset_name: 'Asset Name',
        liability_name: 'Liability Name',
        asset_type: 'Asset Type',
        liability_type: 'Liability Type',
        fixed_assets: 'Fixed Assets',
        current_assets: 'Current Assets',
        current_liabilities: 'Current Liabilities',
        non_current_liabilities: 'Non-Current Liabilities',
        purchase_date: 'Purchase Date',
        purchase_cost: 'Purchase Cost',
        current_value: 'Current Value',
        interest_rate: 'Interest Rate (%)',
        original_amount: 'Original Amount',
        current_balance: 'Current Balance',
        notes: 'Note',
        status: 'Status',
        active: 'Active',
        sold: 'Sold',
        paid_off: 'Paid Off',
        dispose: 'Dispose',
        disposed: 'Disposed',
        cleared: 'Cleared',
        documents: 'Documents',
        history: 'History',
        category: 'Chart of Accounts',
        revenue_category: 'Revenue Category',
        expenses_category: 'Expenses Category',
        currency: 'Currency',
        total: 'Total',
        actions: 'Actions',
        chart_of_accounts: 'Chart of Accounts',
        user_role: 'User & Role',
        setup_system: 'Setup System',
        currency_mgmt: 'Currency',
        profile_name: 'Profile Name',
        upload_photo: 'Upload Photo',
        language: 'Language',
        theme: 'Theme',
        date_format: 'Date Format',
        timezone: 'Timezone',
        save_changes: 'Save Changes',
        add_user: 'Add User',
        add_role: 'Add Role',
        user_id: 'User ID',
        name: 'Account Name',
        phone: 'Phone',
        address: 'Address',
        last_login: 'Last Login',
        role_name: 'Role Name',
        description: 'Description',
        permissions: 'Permissions',
        account_code: 'Account Code',
        gl_code: 'Code',
        local_name: 'Local Name',
        parent_account: 'Parent Account',
        system_default_currency: 'System Default Currency',
        add_currency: 'Add Currency',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        welcome_back: 'Welcome Back, {{name}}',
        dashboard_subtitle: "Here's what's happening with your finances today.",
        income_vs_expense: 'Income Vs Expense',
        net_income_label: 'Net Income',
        daily: 'Daily',
        this_month: 'This Month',
        last_month: 'Last Month',
        today: 'Today',
        yesterday: 'Yesterday',
        this_week: 'This Week',
        last_week: 'Last Week',
        this_year: 'This Year',
        last_year: 'Last Year',
        no_history: 'You do not have history',
        estimated_valuation: 'Estimated Valuation',
        payment_source: 'Payment Source',
        classification: 'Category',
        authoring_agent: 'Authoring Agent',
        no_internal_docs: 'No internal documentation.',
        income_label: 'Income',
        expense_label: 'Expense',
        transfer_label: 'Transfer',
        quick_action: 'Quick Action',
        home: 'Home',
        account: 'Account',
        sign_out: 'Sign Out',
        protected_by: 'Protected By My Heart Identity',
        all_rights_reserved: 'All rights reserved.',
        switch_language: 'Language',
        english: 'English',
        khmer: 'Khmer',
        theme_light: 'Light',
        theme_dark: 'Dark',
        theme_system: 'System',
        search_placeholder: 'Search type, category, account, note...',
        import_ledger: 'Import Ledger',
        download_template: 'Download Template',
        click_to_upload: 'Click here to choose a file',
        upload_instruction: 'Upload your transaction spreadsheet to batch record your finances.',
        file_support: 'Supports .xlsx, .xls formats (Max 10MB)',
        import_warning: 'Ensure Category names and Account names exactly match your current system settings for a successful import.',
        discard: 'Discard',
        export_transactions: 'Export Transactions',
        import_transactions: 'Import Transactions',
        imported: 'Imported',
        selected: 'Selected',
        delete_selected: 'Delete Selected',
        export_selected: 'Export Selected',
        export_failed: 'Export failed',
        confirm_removal: 'Confirm Removal',
        confirm_rate_change: 'Confirm Rate Change',
        rate_change_warning: 'Changing the exchange rate will affect all historical data and financial reports. Are you sure you want to proceed?',
        proceed: 'Proceed',
        batch_deletion: 'Batch Deletion',
        delete_multiple_confirm: 'Delete {{count}} transactions?',
        batch_delete_desc: 'You have selected multiple ledger entries for removal. This process is irreversible and will affect account balances instantly.',
        confirm_batch_delete: 'Confirm Batch Delete',
        add_income: 'Add Income',
        add_expense: 'Add Expense',
        new_income: 'New Income',
        new_expense: 'New Expense',
        update_transaction: 'Update Transaction',
        date: 'Date',
        time: 'Time',
        type: 'Type',
        amount: 'Amount',
        note: 'Note',
        recorded_by: 'Recorded By',
        view_all: 'View all',
        new: 'New',
        transfer: 'Transfer',
        adjust_balance: 'Adjust Balance',
        source_account: 'From Account',
        target_account: 'Destination Account',
        destination_account: 'To Account',
        execution_date: 'Execution Date',
        new_balance: 'New Balance',
        adjust: 'Adjust',
        complete: 'Complete',
        delete_account_confirm: 'Delete Account?',
        delete_account_desc: 'Are you sure you want to delete this account? This action cannot be undone.',
        delete_account_impact_warning: 'Warning: Deleting this account will impact your historical data and financial reports. This action is irreversible.',
        currency_change_warning: 'Warning: Changing the account currency will impact your historical data and financial reports. Please ensure all balances are adjusted accordingly.',
        balance_adjustment_warning: 'Warning: This adjustment will create a transaction to correct the balance, which will be reflected in your financial reports.',
        currency_required: 'Currency is required',
        gl_code_placeholder_asset: '10xxx',
        gl_code_placeholder_liability: '20xxx',
        name_placeholder_asset: 'e.g., Toyota Hilux 2022',
        name_placeholder_liability: 'e.g., Home Loan - ABA Bank',
        local_name_placeholder_asset: 'e.g., Toyota Hilux 2022',
        local_name_placeholder_liability: 'e.g., Home Loan - ABA Bank',
        interest_rate_placeholder: '0.00',
        amount_placeholder: '0.00',

        milestone_subtitle: 'Track your progress toward big purchases',
        total_saved: 'Total Saved',
        goal_remaining: 'Needs Saving',
        new_goal: 'New Goal',
        amend_goal: 'Update Goal',
        establish_goal: 'Create Goal',
        goal_form_name: 'Goal Name',
        goal_form_target: 'Amount',
        goal_save_action: 'Save Goal',
        contribute_funds: 'Contribute Funds',
        contribution_amount: 'Contribution Amount',
        record_as_transaction: 'Record as Transaction',
        payment_source_required: 'Payment Source',
        contribution_info: 'This will create an Expense transaction. If currencies differ, the amount will be automatically converted.',
        progress: 'Progress',
        no_contributions: 'No contributions yet.',
        close_details: 'Close Details',
        budgets: 'Budgets',
        manage_spending: 'Manage your spending limits',
        budget_planned: 'Planned',
        budget_used: 'Spent',
        planned: 'Planned',
        spent: 'Spent',
        variance: 'Variance',
        budget_left: 'Remaining',
        budget_status_tooltip: 'Progress statuses are defined by thresholds: Over Budget (≥101, red), Perfect (≥100, emerald), Critical (≥90, orange), and Warning (≥70, yellow).',
        clear_filters: 'Clear Filters',
        budget_limit: 'Planned',
        usage: 'Usage',
        edit_template: 'Edit Template',
        placeholder_template_name: 'e.g. Standard Monthly',
        placeholder_budget_name: 'e.g. Monthly Grocery',
        month: 'Month',
        repeat: 'Repeat',
        none: 'None',
        monthly: 'Monthly',
        yearly: 'Yearly',
        save_as_template: 'Save as Template',
        template_name: 'Template Name',
        default_amount: 'Amount',
        delete_template: 'Delete Template',
        no_templates: 'No templates saved yet.',
        initial_loan: 'Initial Loan',
        remaining_balance: 'Remaining Balance',
        value_changed: 'Value Changed',
        market_value: 'Market Value',
        outstanding_balance: 'Outstanding Balance',
        registry_log: 'Registry Log',
        no_attachments: 'No attachments.',
        revalue_asset: 'Revalue Asset',
        adjusting_record: 'Adjusting Record',
        adjustment_note: 'Adjustment Note',
        apply: 'Apply',
        identity: 'Identity',
        registry_type: 'Registry Type',
        financial_statement: 'Beat strong, live smart',
        generated: 'Generated',
        save_account: 'Save Account',
        edit_account: 'Edit Account',
        new_account: 'New Account',
        member_status: 'Member Status',
        update_password: 'Update Password',
        role_identifier: 'Role Identifier',
        functional_permissions: 'Functional Permissions',
        commit_role: 'Commit Role',
        base_conversion: 'Base Conversion',
        exchange_rate: 'Exchange Rate',
        modify_exchange_rate: 'Modify Exchange Rate',
        rate_update_warning: 'Changing this rate affects all summaries and reports instantly.',
        old_rate: 'Old Rate',
        new_rate: 'New Rate',
        continue_update: 'Continue Update',
        rate_recalculate_warning: 'This will update how your balances are estimated in other currencies.',
        login_welcome: 'Welcome Back!',
        login_subtitle: 'គ្រប់គ្រងលុយ គឺការគ្រប់គ្រងវាសនារបស់អ្នក',
        password: 'Password',
        authenticating: 'Authenticating...',
        sign_in: 'Sign In',
        evidence: 'Evidence',
        files: 'files',
        monthly_payment: 'Monthly Payment',
        you_need_to_save: 'You need to save',
        per_month: 'per month in order to achieve this goal.',
        savings_end: 'Your savings will be ended on',
        achieved: 'Achieved',
        ended: 'Ended',
        overdue: 'Overdue',
        days_left: 'Days left',
        tutorial_title: 'System Guide',
        tutorial_welcome_title: 'Welcome to My Heart',
        tutorial_welcome_desc: 'Your journey to financial stability starts here. Let us take a quick tour of the core features.',
        tutorial_accounts_title: 'Manage Your Accounts',
        tutorial_accounts_desc: 'Start by adding your bank accounts, cash, or wallets. You can track multiple currencies and view real-time balances.',
        tutorial_transactions_title: 'Record Transactions',
        tutorial_transactions_desc: 'Keep track of every cent. Add income, expenses, or transfers between accounts with just a few taps.',
        tutorial_budgets_title: 'Plan Your Budgets',
        tutorial_budgets_desc: 'Set monthly spending limits for different categories. We will help you stay on track with visual progress bars.',
        tutorial_goals_title: 'Achieve Your Goals',
        tutorial_goals_desc: 'Saving for a new car or a house? Create financial goals and watch your progress grow as you save.',
        tutorial_finish_title: 'You are All Set!',
        tutorial_finish_desc: 'Explore analytics and reports to get deep insights into your financial health. Happy tracking!',
        start_tutorial: 'Start Tour',
        skip_tutorial: 'Skip',
        finish_tutorial: 'Finish',
        done: 'Done',
        transaction_amount: 'Transaction Amount',
        action_cannot_be_undone: 'Action cannot be undone',
        report_revenue_label: 'Total Revenue',
        report_expense_label: 'Total Expenses',
        report_net_earnings: 'Net Earnings',
        report_income_statement: 'Income Statement',
        report_balance_sheet: 'Balance Sheet',
        report_cash_flow: 'Cash Flow',
        report_account_summary: 'Account Summary',
        report_money_in: 'Money In',
        report_money_out: 'Money Out',
        report_net_movement: 'Net Cash Flow',
        cash_and_savings: 'Cash and Bank',
        possessions_and_assets: 'Possessions and Assets',
        outstanding_liabilities: 'Outstanding Liabilities',
        account_name: 'Account Name',
        update_budget: 'Update Budget',
        set_budget: 'Set Budget',
        transaction_details: 'Transaction Details',
        add_asset: 'Add Asset',
        add_liability: 'Add Liability',
        add_account: 'Add Account',
        transfer_money: 'Transfer Money',
        savings_rate_tooltip: 'Percentage of income saved.',
        net_savings_tooltip: 'Difference between Income and Expenses.',
        account_type: 'Account Type',
        bank: 'Bank',
        cash: 'Cash',
        wallet: 'Wallet',
        page_size: 'Page Size',
        showing_range: 'Showing {{start}} - {{end}} of {{total}}',
        manual_registry: 'Manual Registry',
        agent: 'Agent',
        no_transaction_history: 'You do not have any transaction history.',
        internal_note: 'Internal Note',
        add_details_placeholder: 'Add transactions details...',
        available_balance: 'Balance: {{amount}}',
        select_category: 'Choose Category',
        select_account: 'Choose Account',
        log_time: 'Date',
        delete_entry: 'Delete',
        delete_confirm_single: 'Are you sure you want to permanently delete this record?',
        error_select_category: 'Please select a category.',
        error_payment_source: 'A payment source is required.',
        error_date: 'The date and time of recording is mandatory.',
        error_amount_invalid: 'Amount is invalid.',
        error_insufficient_funds: 'This amount exceeds the available account balance.',
        error_save_failed: 'Unable to save transaction. Please check your data and try again.',
        valuation: 'Valuation',
        update_income: 'Update Income',
        update_expense: 'Update Expense',
        search_accounts: 'Search accounts...',
        beginning_balance: 'Initial Balance',
        add_details: 'Add details...',
        error_source_account: 'Source account required.',
        error_destination_account: 'Destination account required.',
        error_same_account: 'Cannot transfer to same account.',
        error_invalid_amount: 'Invalid amount.',
        select_source: 'Select Account',
        select_destination: 'Select Account',
        select_type: 'Select type.',
        select_currency: 'Select a currency.',
        select_date: 'Select a date.',
        date_time: 'Date',
        transfer_details: 'Transfer details...',
        adjust_reason_placeholder: 'Why is the balance changing?',
        est_valuation: 'Est. Valuation',
        available: 'Balance',
        account_not_found: 'Account not found',
        account_not_found_desc: 'The registry you are looking for might have been moved or deleted.',
        back_to_accounts: 'Back to Accounts',
        available_balance_label: 'Balance',
        no_registries: 'No registries available',
        gl_classification: 'Category',
        automated_system: 'Automated System',
        dismiss: 'Dismiss',
        account_book: 'Account book',
        transfer_out: 'Transfer Out',
        transfer_in: 'Transfer In',
        balance_adjustment: 'Balance Adjustment',
        transactions_for: "Transactions for {{month}}",
        manual_adjustment: "Manual adjustment.",
        transfer_to: "Transfer to {{name}}.",
        transfer_from: "Transfer from {{name}}.",
        error_goal_name: "Goal name is required.",
        error_target_amount: "Invalid target amount.",
        error_current_amount: "Invalid current amount.",
        error_end_date: "Target date is required.",
        error_end_date_invalid: "End date cannot be before start date.",
        completed: "Completed",
        paused: "Paused",
        cancelled: "Cancelled",
        templates: "Templates",
        budget_name: "Budget Name",
        new_template: "New Template",
        new_budget: "New Budget",
        delete_budget_confirm: "Are you sure you want to permanently delete this budget record?",
        safe: "Safe",
        warning: "Warning",
        critical: "Critical",
        perfect: "Perfect",
        over_budget: "Over Budget",
        financial_insights: "Financial insights & trends",
        financial_overview: "Financial Overview",
        income_vs_expense_sub: "Income vs Expenses over 12 months",
        budget_performance: "Budget Performance",
        planned_vs_actual: "Planned Limits vs Actual Spending",
        monthly_average: "Monthly Average",
        highest_month: "Highest Month",
        top_category: "Top Category",
        income_breakdown: "Income Breakdown",
        expense_breakdown: "Expense Breakdown",
        top_accounts: "Top Accounts",
        account_distribution: "Account Distribution",
        top_transactions: "Top Transactions",
        income_sources: "Income Sources",
        spending_by_category: "Spending by Category",
        unknown_account: "Unknown Account",
        category_distribution: "Category Distribution",
        spending_breakdown: "Spending breakdown by category",
        custom_range: "CUSTOM RANGE",
        apply_filter: "Apply",
        reset_filter: "Reset",
        from_date: "From",
        to_date: "To",
        no_goals_found: "No goals found.",
        goal_details: "Goal details...",
        search_assets: "Search assets...",
        search_liabilities: "Search liabilities...",
        delete_record_confirm: "Are you sure you want to permanently delete this record from your financial database?",
        delete_selected_records_confirm: "Are you sure you want to delete {{count}} selected records?",
        file_type_error: "File type .{{ext}} is not supported.",
        file_size_error: "File \"{{name}}\" exceeds the 10MB limit.",
        file_read_error: "Error reading file \"{{name}}\".",
        gl_code_required: "G/L Code is required.",
        gl_code_format: "G/L Code must be exactly 5 digits.",
        gl_code_asset_range: "Asset G/L Code must be between 10000 and 19999.",
        gl_code_liability_range: "Liability G/L Code must be between 20000 and 29999.",
        gl_code_duplicate: "This G/L code is already in use by another record.",
        name_required: "Name is required.",
        local_name_required: "Local Name is required.",
        type_required: "Type is required.",
        cost_invalid: "Please enter a valid purchase cost.",
        value_invalid: "Please enter a valid current value.",
        initial_amount_invalid: "Please enter a valid initial amount.",
        remaining_invalid: "Please enter a valid remaining balance.",
        amount_invalid: "Please enter a valid amount.",
        save_error: "An unexpected error occurred. Please try again.",
        assets_total: "Assets Total",
        liabilities_total: "Liabilities Total",
        equity_net_worth: "Equity & Net Worth",
        asset_category: "Asset Category",
        liability_class: "Liability Class",
        outstanding: "Outstanding",
        total_label: "Total",
        total_balance_est: "Total Balance EST.",
        copyright: "© 2026 My Heart • MR.KHENG Kimsan. All rights reserved.",
        system_configuration: "System Configuration",
        none_top_level: "None (Top Level)",
        purpose_placeholder: "Purpose of this account...",
        leave_blank_password: "Leave blank to keep same",
        auto_sync_rates: "Auto Sync Rates",
        auto_sync_desc: "Automatically update exchange rates from the internet",
        sync_now: "Sync Now",
        last_synced: "Last Synced",
        exchange_back: "Exchange Back",
        choose_role: "Choose role",
        base_currency_desc: "Base currency for all reports & summaries",
        inactive: "Inactive",
        files_count: "{{count}} files",
        no_activity_log: "No activity log.",
        delete_template_confirm: "Are you sure you want to delete this template? You can recreate it later from any active budget.",
        create_template_hint: "Create a budget and save it as a template to reuse it later.",
        calendar_month: "Month",
        registry_review: "Registry Review",
        choose_type: "Choose Type",
        choose_type_label: "Type",
        audit_details: "Audit Details...",
        document_preview: "Document Preview",
        download_document: "Download Document",
        verified_audit_link: "Verified Audit Link",
        secure_storage: "Secure Storage",
        edit_member: "Edit Member",
        new_member: "New Member",
        edit_role: "Edit Role",
        role_placeholder: "e.g. Accountant",
        role_desc_placeholder: "e.g. Basic ledger entry tasks",
        users_tab: "Users",
        roles_tab: "Roles",
        module: "Module",
        all: "All",
        user_id_error_required: "User identifier is required.",
        user_id_error_duplicate: "This ID is already assigned to another member.",
        password_error_new: "A secure password must be set for new members.",
        role_error_required: "Please assign a functional role.",
        address_placeholder: "Commune, district, province...",
        name_placeholder: "e.g. Kheng Kimsan",
        phone_placeholder: "071 5665289",
        error_userid_required: 'Please enter your login ID.',
        error_password_required: 'Please enter your password.',
        error_access_denied: 'Access denied. Please check your credentials.',
        error_file_too_large: 'File size exceeds 10MB limit.',
        hide_password: 'Hide password',
        show_password: 'Show password',
        switch_to_light: 'Switch to Light Mode',
        switch_to_dark: 'Switch to Dark Mode',
        switch_to_system: 'Switch to System Mode',
        edit_basic_info: 'Edit Basic Info',
        update_value: 'Update Value',
        pause_goal: 'Pause Goal',
        resume_goal: 'Resume Goal',
        cancel_goal: 'Cancel Goal',
        delete_goal: 'Delete Goal',
        delete_budget: 'Delete Budget',
        delete_account: 'Delete Account',
        delete_asset: 'Delete Asset',
        delete_liability: 'Delete Liability',
        delete_transaction: 'Delete Transaction',
        adjust_balance_action: 'Adjust Balance',
        set_as_default: 'Set as Default',
        use_template: 'Use Template',
        save_as_template_action: 'Save as Template',
        contribute: 'Contribute',
        view_details_action: 'Details',
        start_date: 'Start Date',
        goal_target_date: 'End Date',
        mark_as_sold: 'Mark as Sold',
        mark_as_paid_off: 'Mark as Paid Off',
        sale_date: 'Sale Date',
        sale_price: 'Sale Price',
        payoff_date: 'Payoff Date',
        gain_loss: 'Gain/Loss',
        sold_status: 'Sold',
        paid_off_status: 'Paid Off',
    },
    km: {
        dashboard: 'ផ្ទាំងគ្រប់គ្រង',
        transactions: 'ប្រតិបត្តិការ',
        accounts: 'គណនី',
        goals: 'គោលដៅ',
        budget: 'ថវិកា',
        analytics: 'ការវិភាគ',
        assets: 'ទ្រព្យសម្បត្តិ',
        liabilities: 'បំណុល',
        reports: 'របាយការណ៍',
        settings: 'ការកំណត់',
        add: 'បន្ថែម',
        edit: 'កែសម្រួល',
        update: 'ធ្វើបច្ចុប្បន្នភាព',
        delete: 'លុប',
        view: 'មើល',
        view_details: 'ព័ត៌មានលម្អិត',
        export: 'នាំចេញ',
        import: 'នាំចូល',
        save: 'រក្សាទុក',
        cancel: 'បោះបង់',
        confirm: 'បញ្ជាក់',
        close: 'បិទ',
        back: 'ត្រឡប់',
        next: 'បន្ទាប់',
        optional: 'ស្រេចចិត្ត',
        total_balance: 'សមតុល្យសរុប',
        total_balance_tooltip: 'សមតុល្យសរុបនៃគណនីទាំងអស់បានបំប្លែងជារូបិយប័ណ្ណគោល (មិនរាប់បញ្ចូលទ្រព្យសម្បត្តិសុទ្ធ របស់អ្នក)',
        total_income: 'ចំណូលសរុប',
        total_income_tooltip: 'ប្រាក់ចូលសរុបទៅកាន់គណនីរបស់អ្នកក្នុងអំឡុងពេលដែលបានជ្រើសរើស បំប្លែងជារូបិយប័ណ្ណគោល (មិនរាប់បញ្ចូលការផ្ទេរប្រាក់ពីគណនី ណាមួយរបស់អ្នក)',
        total_expenses: 'ចំណាយសរុប',
        total_expenses_tooltip: 'ការចំណាយសរុបពីគណនីរបស់អ្នកក្នុងអំឡុងពេលដែលបានជ្រើសរើស បំប្លែងជារូបិយប័ណ្ណគោល (មិនរាប់បញ្ចូលការផ្ទេរប្រាក់ពីគណនី ណាមួយរបស់អ្នក)',
        total_savings: 'ប្រាក់សន្សំសរុប',
        net_worth: 'ទ្រព្យសម្បត្តិសុទ្ធ',
        net_worth_tooltip: 'ទ្រព្យសម្បត្តិសុទ្ធ (មិនរាប់បញ្ចូលសមតុល្យសរុបនៃគណនី)',
        recent_activity: 'សកម្មភាពថ្មីៗ',
        your_accounts: 'គណនីរបស់អ្នក',
        income: 'ចំណូល',
        expense: 'ចំណាយ',
        search: 'ស្វែងរក...',
        no_data: 'មិនទាន់មានទិន្នន័យ',
        confirm_delete: 'បញ្ជាក់ការលុប',
        new_record: 'កំណត់ត្រាថ្មី',
        savings_rate: 'អត្រាសន្សំ',
        net_savings: 'ចំណូលសុទ្ធ',
        comparison: 'ការប្រៀបធៀប',
        breakdown: 'ការបែងចែក',
        statistics: 'ស្ថិតិ',
        priority: 'អាទិភាព',
        total_assets: 'ទ្រព្យសម្បត្តិសរុប',
        total_liabilities: 'បំណុលសរុប',
        asset_name: 'ឈ្មោះទ្រព្យសម្បត្តិ',
        liability_name: 'ឈ្មោះបំណុល',
        asset_type: 'ប្រភេទទ្រព្យសម្បត្តិ',
        liability_type: 'ប្រភេទបំណុល',
        fixed_assets: 'ទ្រព្យសកម្មថេរ',
        current_assets: 'ទ្រព្យសកម្មចរន្ត',
        current_liabilities: 'បំណុលចរន្ត',
        non_current_liabilities: 'បំណុលមិនមែនចរន្ត',
        purchase_date: 'កាលបរិច្ឆេទទិញ',
        purchase_cost: 'តម្លៃទិញ',
        current_value: 'តម្លៃបច្ចុប្បន្ន',
        interest_rate: 'អត្រាការប្រាក់ (%)',
        original_amount: 'ចំនួនទឹកប្រាក់ដើម',
        current_balance: 'សមតុល្យបច្ចុប្បន្ន',
        notes: 'កំណត់សម្គាល់',
        status: 'ស្ថានភាព',
        active: 'សកម្ម',
        sold: 'បានលក់',
        paid_off: 'បានបង់ផ្តាច់',
        dispose: 'បោះចោល',
        disposed: 'បានបោះចោល',
        cleared: 'បានទូទាត់',
        documents: 'ឯកសារ',
        history: 'ប្រវត្តិ',
        category: 'ប្រភេទ',
        revenue_category: 'ប្រភេទចំណូល',
        expenses_category: 'ប្រភេទចំណាយ',
        currency: 'រូបិយប័ណ្ណ',
        total: 'សរុប',
        actions: 'សកម្មភាព',
        chart_of_accounts: 'ប្លង់គណនី',
        user_role: 'អ្នកប្រើប្រាស់ & តួនាទី',
        setup_system: 'កំណត់ប្រព័ន្ធ',
        currency_mgmt: 'រូបិយប័ណ្ណ',
        profile_name: 'ឈ្មោះប្រវត្តិរូប',
        upload_photo: 'បង្ហោះរូបភាព',
        language: 'ភាសា',
        theme: 'រចនាប័ទ្ម',
        date_format: 'ទម្រង់កាលបរិច្ឆេទ',
        timezone: 'តំបន់ពេលវេលា',
        save_changes: 'រក្សាទុកការផ្លាស់ប្តូរ',
        add_user: 'បន្ថែមអ្នកប្រើប្រាស់',
        add_role: 'បន្ថែមតួនាទី',
        user_id: 'អត្តសញ្ញាណអ្នកប្រើប្រាស់',
        name: 'ឈ្មោះគណនី',
        phone: 'ទូរស័ព្ទ',
        address: 'អាសយដ្ឋាន',
        last_login: 'ចូលចុងក្រោយ',
        role_name: 'ឈ្មោះតួនាទី',
        description: 'ការពិពណ៌នា',
        permissions: 'សិទ្ធិ',
        account_code: 'លេខកូដគណនី',
        gl_code: 'លេខកូដ',
        local_name: 'ឈ្មោះតាមតំបន់',
        parent_account: 'គណនីមេ',
        system_default_currency: 'រូបិយប័ណ្ណលំនាំដើមប្រព័ន្ធ',
        add_currency: 'បន្ថែមរូបិយប័ណ្ណ',
        light: 'ភ្លឺ',
        dark: 'ងងឹត',
        system: 'ប្រព័ន្ធ',
        welcome_back: 'សូមស្វាគមន៍, {{name}}',
        dashboard_subtitle: "នេះគឺជាស្ថានភាពហិរញ្ញវត្ថុរបស់អ្នកនៅថ្ងៃនេះ",
        income_vs_expense: 'ចំណូល ធៀបនឹង ចំណាយ',
        net_income_label: 'ចំណូលសុទ្ធ',
        daily: 'ប្រចាំថ្ងៃ',
        this_month: 'ខែនេះ',
        last_month: 'ខែមុន',
        today: 'ថ្ងៃនេះ',
        yesterday: 'ម្សិលមិញ',
        this_week: 'សប្តាហ៍នេះ',
        last_week: 'សប្តាហ៍មុន',
        this_year: 'ឆ្នាំនេះ',
        last_year: 'ឆ្នាំមុន',
        no_history: 'អ្នកមិនមានប្រវត្តិទេ',
        estimated_valuation: 'ការវាយតម្លៃប៉ាន់ស្មាន',
        payment_source: 'ប្រភពបង់ប្រាក់',
        classification: 'ប្លង់គណនី',
        authoring_agent: 'អ្នកកត់ត្រា',
        no_internal_docs: 'គ្មានឯកសារផ្ទៃក្នុង',
        income_label: 'បញ្ចូលចំណូល',
        expense_label: 'បញ្ចូលចំណាយ',
        transfer_label: 'ផ្ទេរប្រាក់',
        quick_action: 'សកម្មភាពរហ័ស',
        home: 'ទំព័រដើម',
        account: 'គណនី',
        sign_out: 'ចាកចេញ',
        protected_by: 'ការពារដោយ My Heart Identity',
        all_rights_reserved: 'រក្សាសិទ្ធិគ្រប់យ៉ាង',
        switch_language: 'ភាសា',
        english: 'អង់គ្លេស',
        khmer: 'ខ្មែរ',
        theme_light: 'ភ្លឺ',
        theme_dark: 'ងងឹត',
        theme_system: 'ប្រព័ន្ធ',
        search_placeholder: 'ស្វែងរកប្រភេទ, គណនី, កំណត់សម្គាល់...',
        import_ledger: 'នាំចូលបញ្ជី',
        download_template: 'ទាញយកគំរូ',
        click_to_upload: 'ចុចទីនេះដើម្បីជ្រើសរើសឯកសារ',
        upload_instruction: 'បង្ហោះសៀវភៅបញ្ជីប្រតិបត្តិការរបស់អ្នកដើម្បីកត់ត្រាហិរញ្ញវត្ថុរបស់អ្នកជាបាច់',
        file_support: 'គាំទ្រទម្រង់ .xlsx, .xls (អតិបរមា 10MB)',
        import_warning: 'សូមប្រាកដថាឈ្មោះប្រភេទ និងឈ្មោះគណនីត្រូវគ្នានឹងការកំណត់បច្ចុប្បន្នរបស់អ្នក',
        discard: 'បោះបង់',
        export_transactions: 'នាំចេញប្រតិបត្តិការ',
        import_transactions: 'នាំចូលប្រតិបត្តិការ',
        imported: 'បាននាំចូល',
        selected: 'បានជ្រើសរើស',
        delete_selected: 'លុបដែលបានជ្រើសរើស',
        export_selected: 'នាំចេញដែលបានជ្រើសរើស',
        export_failed: 'ការនាំចេញបានបរាជ័យ',
        confirm_removal: 'បញ្ជាក់ការលុប',
        confirm_rate_change: 'បញ្ជាក់ការផ្លាស់ប្តូរអត្រា',
        rate_change_warning: 'ការផ្លាស់ប្តូរអត្រាប្តូរប្រាក់នឹងប៉ះពាល់ដល់ទិន្នន័យប្រវត្តិសាស្រ្ត និងរបាយការណ៍ហិរញ្ញវត្ថុទាំងអស់។ តើអ្នកប្រាកដថាចង់បន្តឬទេ?',
        proceed: 'បន្ត',
        batch_deletion: 'ការលុបជាបាច់',
        delete_multiple_confirm: 'លុបប្រតិបត្តិការចំនួន {{count}}?',
        batch_delete_desc: 'អ្នកបានជ្រើសរើសធាតុបញ្ជីជាច្រើនសម្រាប់ការលុប ដំណើរការនេះមិនអាចត្រឡប់វិញបានទេ ហើយនឹងប៉ះពាល់ដល់សមតុល្យគណនីភ្លាមៗ',
        confirm_batch_delete: 'បញ្ជាក់ការលុបជាបាច់',
        add_income: 'បញ្ចូលចំណូល',
        add_expense: 'បញ្ចូលចំណាយ',
        new_income: 'ចំណូលថ្មី',
        new_expense: 'ចំណាយថ្មី',
        update_transaction: 'ធ្វើបច្ចុប្បន្នភាពប្រតិបត្តិការ',
        date: 'កាលបរិច្ឆេទ',
        time: 'ម៉ោង',
        type: 'ប្រភេទ',
        amount: 'ចំនួនទឹកប្រាក់',
        note: 'ចំណាំ',
        recorded_by: 'កត់ត្រាដោយ',
        view_all: 'ប្រភេទគណនី',
        new: 'ថ្មី',
        transfer: 'ផ្ទេរប្រាក់',
        adjust_balance: 'កែតម្រូវសមតុល្យ',
        source_account: 'ពីគណនី',
        target_account: 'គណនីគោលដៅ',
        destination_account: 'ទៅគណនី',
        execution_date: 'កាលបរិច្ឆេទអនុវត្ត',
        new_balance: 'សមតុល្យថ្មី',
        adjust: 'កែតម្រូវ',
        complete: 'បញ្ចប់',
        delete_account_confirm: 'លុបគណនី?',
        delete_account_desc: 'តើអ្នកប្រាកដថាចង់លុបគណនីនេះទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ',
        delete_account_impact_warning: 'ការព្រមាន៖ ការលុបគណនីនេះនឹងប៉ះពាល់ដល់ទិន្នន័យប្រវត្តិសាស្ត្រ និងរបាយការណ៍ហិរញ្ញវត្ថុរបស់អ្នក។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
        currency_change_warning: 'ការព្រមាន៖ ការផ្លាស់ប្តូររូបិយប័ណ្ណគណនីនឹងប៉ះពាល់ដល់ទិន្នន័យប្រវត្តិសាស្ត្រ និងរបាយការណ៍ហិរញ្ញវត្ថុរបស់អ្នក។ សូមប្រាកដថាសមតុល្យទាំងអស់ត្រូវបានកែតម្រូវតាមនោះ។',
        balance_adjustment_warning: 'ការព្រមាន៖ ការកែតម្រូវនេះនឹងបង្កើតប្រតិបត្តិការដើម្បីកែតម្រូវសមតុល្យ ដែលនឹងត្រូវបានឆ្លុះបញ្ចាំងនៅក្នុងរបាយការណ៍ហិរញ្ញវត្ថុរបស់អ្នក។',
        currency_required: 'សូមជ្រើសរើសរូបិយប័ណ្ណ',
        gl_code_placeholder_asset: '10xxx',
        gl_code_placeholder_liability: '20xxx',
        name_placeholder_asset: 'រថយន្តតូយ៉ូតាហ៊ីឡាក់​ ២០២២',
        name_placeholder_liability: 'កម្ចីទិញផ្ទះ - ធនាគារ ABA',
        local_name_placeholder_asset: 'រថយន្តតូយ៉ូតាហ៊ីឡាក់ ២០២២',
        local_name_placeholder_liability: 'កម្ចីទិញផ្ទះ - ធនាគារ ABA',
        interest_rate_placeholder: '0.00',
        amount_placeholder: '0.00',
        milestone_subtitle: 'តាមដានវឌ្ឍនភាពរបស់អ្នកឆ្ពោះទៅរកការទិញធំៗ',
        total_saved: 'បានសន្សំសរុប',
        goal_remaining: 'ត្រូវការសន្សំ',
        new_goal: 'គោលដៅថ្មី',
        amend_goal: 'ធ្វើបច្ចុប្បន្នភាពគោលដៅ',
        establish_goal: 'បង្កើតគោលដៅ',
        goal_form_name: 'ឈ្មោះគោលដៅ',
        goal_form_target: 'ចំនួនទឹកប្រាក់',
        goal_save_action: 'រក្សាទុកគោលដៅ',
        start_date: 'ថ្ងៃចាប់ផ្តើម',
        goal_target_date: 'ថ្ងៃបញ្ចប់',
        contribute_funds: 'ប្រាក់បង់វិភាគទាន',
        contribution_amount: 'ចំនួនទឹកប្រាក់',
        record_as_transaction: 'កត់ត្រាជាប្រតិបត្តិការ',
        payment_source_required: 'ប្រភពទូទាត់',
        contribution_info: 'វានឹងបង្កើតប្រតិបត្តិការចំណាយ ប្រសិនបើរូបិយប័ណ្ណខុសគ្នា ចំនួនទឹកប្រាក់នឹងត្រូវបានបំប្លែងដោយស្វ័យប្រវត្តិ',
        progress: 'វឌ្ឍនភាព',
        no_contributions: 'មិនទាន់មានការបញ្ចូលបង់វិភាគទាន',
        close_details: 'បិទព័ត៌មានលម្អិត',
        budgets: 'ថវិកា',
        manage_spending: 'គ្រប់គ្រងដែនកំណត់ចំណាយរបស់អ្នក',
        budget_planned: 'បានគ្រោងទុក',
        budget_used: 'បានចំណាយ',
        planned: 'បានគ្រោងទុក',
        spent: 'បានចំណាយ',
        variance: 'ភាពលម្អៀង',
        budget_left: 'ថវិកានៅសល់',
        budget_status_tooltip: 'ស្ថានភាពវឌ្ឍនភាពត្រូវបានកំណត់ដោយកម្រិត៖ លើសថវិកា (≥101, ក្រហម), ល្អឥតខ្ចោះ (≥100, បៃតង), ធ្ងន់ធ្ងរ (≥90, ទឹកក្រូច), និង ព្រមាន (≥70, លឿង)។',
        clear_filters: 'សម្អាតតម្រង',
        budget_limit: 'បានគ្រោងទុក',
        usage: 'ការប្រើប្រាស់',
        edit_template: 'កែសម្រួលគំរូ',
        placeholder_template_name: 'ឧ. កញ្ចប់ថវិកាប្រចាំខែ',
        placeholder_budget_name: 'ឧ. ថវិកាទិញម្ហូបប្រចាំខែ',
        month: 'ខែ',
        repeat: 'ធ្វើម្តងទៀត',
        none: 'គ្មាន',
        monthly: 'ប្រចាំខែ',
        yearly: 'ប្រចាំឆ្នាំ',
        save_as_template: 'រក្សាទុកជាគំរូ',
        template_name: 'ឈ្មោះគំរូ',
        default_amount: 'ចំនួនទឹកប្រាក់',
        use_template: 'ប្រើគំរូ',
        delete_template: 'លុបគំរូ',
        no_templates: 'គ្មានគំរូរក្សាទុកទេ',
        initial_loan: 'ប្រាក់កម្ចីដំបូង',
        remaining_balance: 'សមតុល្យនៅសល់',
        value_changed: 'តម្លៃបានផ្លាស់ប្តូរ',
        market_value: 'តម្លៃទីផ្សារ',
        outstanding_balance: 'សមតុល្យជំពាក់',
        registry_log: 'កំណត់ហេតុបញ្ជី',
        no_attachments: 'គ្មានឯកសារភ្ជាប់',
        revalue_asset: 'វាយតម្លៃទ្រព្យសម្បត្តិឡើងវិញ',
        adjusting_record: 'កែតម្រូវកំណត់ត្រា',
        adjustment_note: 'កំណត់សម្គាល់ការកែតម្រូវ',
        apply: 'អនុវត្ត',
        identity: 'អត្តសញ្ញាណ',
        registry_type: 'ប្រភេទបញ្ជី',
        financial_statement: 'បេះដូងរឹងមាំ ជីវិតឆ្លាតវៃ',
        generated: 'បានបង្កើត',
        save_account: 'រក្សាទុកគណនី',
        edit_account: 'កែសម្រួលគណនី',
        new_account: 'គណនីថ្មី',
        member_status: 'ស្ថានភាពសមាជិក',
        update_password: 'ធ្វើបច្ចុប្បន្នភាពពាក្យសម្ងាត់',
        role_identifier: 'អត្តសញ្ញាណតួនាទី',
        functional_permissions: 'សិទ្ធិមុខងារ',
        commit_role: 'បញ្ជាក់តួនាទី',
        base_conversion: 'ការបំប្លែងមូលដ្ឋាន',
        exchange_rate: 'អត្រាប្តូរប្រាក់',
        modify_exchange_rate: 'កែប្រែអត្រាប្តូរប្រាក់',
        rate_update_warning: 'ការផ្លាស់ប្តូរអត្រានេះប៉ះពាល់ដល់សេចក្តីសង្ខេប និងរបាយការណ៍ទាំងអស់ភ្លាមៗ',
        old_rate: 'អត្រាចាស់',
        new_rate: 'អត្រាថ្មី',
        continue_update: 'បន្តការធ្វើបច្ចុប្បន្នភាព',
        rate_recalculate_warning: 'វានឹងធ្វើបច្ចុប្បន្នភាពរបៀបដែលសមតុល្យរបស់អ្នកត្រូវបានប៉ាន់ស្មាននៅក្នុងរូបិយប័ណ្ណផ្សេងទៀត',
        login_welcome: 'សូមស្វាគមន៍!',
        login_subtitle: 'ចូលដើម្បីគ្រប់គ្រងហិរញ្ញវត្ថុរបស់អ្នក',
        password: 'ពាក្យសម្ងាត់',
        authenticating: 'កំពុងផ្ទៀងផ្ទាត់...',
        sign_in: 'ចូល',
        evidence: 'ភស្តុតាង',
        files: 'ឯកសារ',
        monthly_payment: 'ការទូទាត់ប្រចាំខែ',
        you_need_to_save: 'អ្នកត្រូវសន្សំ',
        per_month: 'ក្នុងមួយខែ ដើម្បីសម្រេចគោលដៅនេះ',
        savings_end: 'ការសន្សំរបស់អ្នកនឹងបញ្ចប់នៅ',
        achieved: 'សម្រេចបាន',
        ended: 'បានបញ្ចប់',
        overdue: 'ហួសកំណត់',
        days_left: 'ថ្ងៃនៅសល់',
        tutorial_title: 'មគ្គុទ្ទេសក៍ប្រព័ន្ធ',
        tutorial_welcome_title: 'សូមស្វាគមន៍មកកាន់ My Heart',
        tutorial_welcome_desc: 'ដំណើរឆ្ពោះទៅរកស្ថិរភាពហិរញ្ញវត្ថុរបស់អ្នកចាប់ផ្តើមនៅទីនេះ។ អនុញ្ញាតឱ្យយើងនាំអ្នកទៅទស្សនាចំណុចសំខាន់ៗ។',
        tutorial_accounts_title: 'គ្រប់គ្រងគណនីរបស់អ្នក',
        tutorial_accounts_desc: 'ចាប់ផ្តើមដោយបន្ថែមគណនីធនាគារ សាច់ប្រាក់ ឬកាបូបលុយរបស់អ្នក។ អ្នកអាចតាមដានរូបិយប័ណ្ណច្រើន និងមើលសមតុល្យភ្លាមៗ។',
        tutorial_transactions_title: 'កត់ត្រាប្រតិបត្តិការ',
        tutorial_transactions_desc: 'តាមដានរាល់ការចំណាយ។ បន្ថែមចំណូល ចំណាយ ឬការផ្ទេរប្រាក់រវាងគណនីដោយគ្រាន់តែចុចពីរបីដង។',
        tutorial_budgets_title: 'រៀបចំកញ្ចប់ថវិកា',
        tutorial_budgets_desc: 'កំណត់ដែនកំណត់ចំណាយប្រចាំខែសម្រាប់ប្រភេទផ្សេងៗគ្នា។ យើងនឹងជួយអ្នកឱ្យដើរតាមផែនការជាមួយនឹងរបារវឌ្ឍនភាព។',
        tutorial_goals_title: 'សម្រេចគោលដៅរបស់អ្នក',
        tutorial_goals_desc: 'សន្សំសម្រាប់ឡានថ្មី ឬផ្ទះ? បង្កើតគោលដៅហិរញ្ញវត្ថុ និងមើលវឌ្ឍនភាពរបស់អ្នកកើនឡើងនៅពេលអ្នកសន្សំ។',
        tutorial_finish_title: 'អ្នករួចរាល់ហើយ!',
        tutorial_finish_desc: 'ស្វែងរកការវិភាគ និងរបាយការណ៍ដើម្បីទទួលបានការយល់ដឹងស៊ីជម្រៅអំពីសុខភាពហិរញ្ញវត្ថុរបស់អ្នក។ រីករាយនឹងការតាមដាន!',
        start_tutorial: 'ចាប់ផ្តើមទស្សនកិច្ច',
        skip_tutorial: 'រំលង',
        finish_tutorial: 'បញ្ចប់',
        done: 'រួចរាល់',
        transaction_amount: 'ចំនួនទឹកប្រាក់ផ្ទេរ',
        action_cannot_be_undone: 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ',
        report_revenue_label: 'ចំណូលសរុប',
        report_expense_label: 'ចំណាយសរុប',
        report_net_earnings: 'ប្រាក់ចំណេញសុទ្ធ',
        report_income_statement: 'របាយការណ៍លទ្ធផល',
        report_balance_sheet: 'តារាងតុល្យការ',
        report_cash_flow: 'លំហូរសាច់ប្រាក់',
        report_account_summary: 'សង្ខេបគណនី',
        report_money_in: 'លុយចូល',
        report_money_out: 'លុយចេញ',
        report_net_movement: 'លំហូរសាច់ប្រាក់សុទ្ធ',
        cash_and_savings: 'សាច់ប្រាក់ និងធនាគារ',
        possessions_and_assets: 'កម្មសិទ្ធិ និងទ្រព្យសម្បត្តិ',
        outstanding_liabilities: 'បំណុលដែលមិនទាន់សង',
        account_name: 'ឈ្មោះគណនី',
        update_budget: 'ធ្វើបច្ចុប្បន្នភាពថវិកា',
        set_budget: 'កំណត់ថវិកា',
        transaction_details: 'ព័ត៌មានលម្អិតប្រតិបត្តិការ',
        add_asset: 'បញ្ចូលទ្រព្យសម្បត្តិ',
        add_liability: 'បញ្ចូលបំណុល',
        add_account: 'បន្ថែមគណនី',
        transfer_money: 'ផ្ទេរប្រាក់',
        savings_rate_tooltip: 'ភាគរយនៃចំណូលដែលបានដកការចំណាយរួច',
        net_savings_tooltip: 'ភាពខុសគ្នារវាងចំណូល និងចំណាយ',
        account_type: 'ប្រភេទគណនី',
        bank: 'ធនាគារ',
        cash: 'សាច់ប្រាក់',
        wallet: 'កាបូប',
        page_size: 'ទំហំទំព័រ',
        showing_range: 'បង្ហាញ {{start}} - {{end}} នៃ {{total}}',
        manual_registry: 'ចុះឈ្មោះដោយដៃ',
        agent: 'ភ្នាក់ងារ',
        no_transaction_history: 'អ្នកមិនមានប្រវត្តិប្រតិបត្តិការទេ',
        internal_note: 'កំណត់សម្គាល់ផ្ទៃក្នុង',
        add_details_placeholder: 'បន្ថែមព័ត៌មានលម្អិតប្រតិបត្តិការ...',
        available_balance: 'សមតុល្យ: {{amount}}',
        select_category: 'ជ្រើសរើសប្រភេទ',
        select_account: 'ជ្រើសរើសគណនី',
        log_time: 'កាលបរិច្ឆេទ',
        delete_entry: 'លុប',
        delete_confirm_single: 'តើអ្នកប្រាកដថាចង់លុបកំណត់ត្រានេះជាអចិន្ត្រៃយ៍ទេ?',
        error_select_category: 'សូមជ្រើសរើសប្រភេទ',
        error_payment_source: 'ប្រភពទូទាត់ត្រូវបានទាមទារ',
        error_date: 'កាលបរិច្ឆេទ នៃការកត់ត្រាគឺចាំបាច់',
        error_amount_invalid: 'ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ',
        error_insufficient_funds: 'ទឹកប្រាក់លើសសមតុល្យមានក្នុងគណនី',
        error_save_failed: 'មិនអាចរក្សាទុកប្រតិបត្តិការបានទេ សូមពិនិត្យមើលទិន្នន័យរបស់អ្នក ហើយព្យាយាមម្តងទៀត',
        valuation: 'ការវាយតម្លៃ',
        update_income: 'ធ្វើបច្ចុប្បន្នភាពចំណូល',
        update_expense: 'ធ្វើបច្ចុប្បន្នភាពចំណាយ',
        search_accounts: 'ស្វែងរកគណនី...',
        beginning_balance: 'សមតុល្យដំបូង',
        add_details: 'បន្ថែមព័ត៌មានលម្អិត...',
        error_source_account: 'ត្រូវការគណនីផ្ទេរចេញ',
        error_destination_account: 'ត្រូវការគណនីផ្ទេរចូល',
        error_same_account: 'មិនអាចផ្ទេរទៅគណនីតែមួយបានទេ',
        error_invalid_amount: 'ចំនួនទឹកប្រាក់មិនត្រឹមត្រូវ',
        select_source: 'ជ្រើសរើសគណនី',
        select_destination: 'ជ្រើសរើសគណនី',
        select_type: 'ជ្រើសរើសប្រភេទ',
        select_currency: 'ជ្រើសរើសរូបិយប័ណ្ណ',
        select_date: 'ជ្រើសរើសកាលបរិច្ឆេទ',
        date_time: 'កាលបរិច្ឆេទ',
        transfer_details: 'ព័ត៌មានលម្អិតនៃការផ្ទេរ...',
        adjust_reason_placeholder: 'ហេតុអ្វីបានជាសមតុល្យផ្លាស់ប្តូរ?',
        est_valuation: 'ការវាយតម្លៃប៉ាន់ស្មាន',
        available: 'សមតុល្យ',
        account_not_found: 'រកមិនឃើញគណនី',
        account_not_found_desc: 'បញ្ជីដែលអ្នកកំពុងស្វែងរកប្រហែលជាត្រូវបានផ្លាស់ទី ឬលុប។',
        back_to_accounts: 'ត្រឡប់ទៅគណនី',
        available_balance_label: 'សមតុល្យ',
        no_registries: 'មិនមានបញ្ជីទេ',
        gl_classification: 'ប្រភេទ',
        automated_system: 'ប្រព័ន្ធស្វ័យប្រវត្តិ',
        dismiss: 'បិទ',
        account_book: 'សៀវភៅគណនី',
        transfer_out: 'ការផ្ទេរចេញ',
        transfer_in: 'ការផ្ទេរចូល',
        balance_adjustment: 'ការកែតម្រូវសមតុល្យ',
        transactions_for: "ប្រតិបត្តិការខែ {{month}}",
        manual_adjustment: "ការកែតម្រូវដោយដៃ",
        transfer_to: "ផ្ទេរទៅ {{name}}",
        transfer_from: "ផ្ទេរពី {{name}}",
        error_goal_name: "ឈ្មោះគោលដៅត្រូវបានទាមទារ",
        error_target_amount: "ចំនួនគោលដៅមិនត្រឹមត្រូវ",
        error_current_amount: "ចំនួនបច្ចុប្បន្នមិនត្រឹមត្រូវ",
        error_end_date: "កាលបរិច្ឆេទគោលដៅត្រូវបានទាមទារ",
        error_end_date_invalid: "កាលបរិច្ឆេទបញ្ចប់មិនអាចមុនកាលបរិច្ឆេទចាប់ផ្តើមបានទេ",
        completed: "បានបញ្ចប់",
        paused: "បានផ្អាក",
        cancelled: "បានបោះបង់",
        templates: "គំរូ",
        budget_name: "ឈ្មោះថវិកា",
        new_template: "គំរូថ្មី",
        new_budget: "ថវិកាថ្មី",
        delete_budget_confirm: "តើអ្នកប្រាកដថាចង់លុបកំណត់ត្រាថវិកានេះជាអចិន្ត្រៃយ៍ទេ?",
        safe: "សុវត្ថិភាព",
        warning: "ការព្រមាន",
        critical: "ធ្ងន់ធ្ងរ",
        perfect: "ល្អឥតខ្ចោះ",
        over_budget: "លើសថវិកា",
        financial_insights: "ការយល់ដឹងហិរញ្ញវត្ថុ និង និន្នាការ",
        financial_overview: "ទិដ្ឋភាពហិរញ្ញវត្ថុ",
        income_vs_expense_sub: "ចំណូល ធៀបនឹង ចំណាយ ក្នុងរយៈពេល 12 ខែ",
        budget_performance: "ការអនុវត្តថវិកា",
        planned_vs_actual: "ដែនកំណត់ដែលបានគ្រោងទុក ធៀបនឹង ការចំណាយជាក់ស្តែង",
        monthly_average: "មធ្យមភាគប្រចាំខែ",
        highest_month: "ចំណាយប្រចាំខែខ្ពស់បំផុត",
        top_category: "ប្រភេទចំណាយខ្លាំងបំផុត",
        income_breakdown: 'ការបែងចែកចំណូល',
        expense_breakdown: 'ការបែងចែកចំណាយ',
        top_accounts: 'គណនីប្រើប្រាស់ច្រើនបំផុត',
        account_distribution: 'ការចែកចាយតាមគណនី',
        top_transactions: 'ប្រតិបត្តិការធំៗ',
        income_sources: 'ប្រភពចំណូល',
        spending_by_category: 'ការចំណាយតាមប្លង់គណនី',
        unknown_account: 'គណនីមិនស្គាល់',
        category_distribution: "ការចែកចាយប្រភេទ",
        spending_breakdown: "ការបែងចែកការចំណាយតាមប្រភេទ",
        custom_range: "ជួរផ្ទាល់ខ្លួន",
        apply_filter: "អនុវត្ត",
        reset_filter: "កំណត់ឡើងវិញ",
        from_date: "ពី",
        to_date: "ដល់",
        no_goals_found: "រកមិនឃើញគោលដៅ",
        goal_details: "ព័ត៌មានលម្អិតគោលដៅ...",
        search_assets: "ស្វែងរកទ្រព្យសម្បត្តិ...",
        search_liabilities: "ស្វែងរកបំណុល...",
        delete_record_confirm: "តើអ្នកប្រាកដថាចង់លុបកំណត់ត្រានេះជាអចិន្ត្រៃយ៍ពីមូលដ្ឋានទិន្នន័យហិរញ្ញវត្ថុរបស់អ្នកទេ?",
        delete_selected_records_confirm: "តើអ្នកប្រាកដថាចង់លុបកំណត់ត្រាដែលបានជ្រើសរើសចំនួន {{count}} ទេ?",
        file_type_error: "ប្រភេទឯកសារ .{{ext}} មិនត្រូវបានគាំទ្រទេ",
        file_size_error: "ឯកសារ \"{{name}}\" លើសពីដែនកំណត់ 10MB",
        file_read_error: "កំហុសក្នុងការអានឯកសារ \"{{name}}\"។",
        gl_code_required: "លេខកូដ G/L ត្រូវបានទាមទារ",
        gl_code_format: "លេខកូដ G/L ត្រូវតែមានលេខ 5 ខ្ទង់",
        gl_code_asset_range: "លេខកូដ G/L ទ្រព្យសម្បត្តិត្រូវតែស្ថិតនៅចន្លោះ 10000 និង 19999",
        gl_code_liability_range: "លេខកូដ G/L បំណុលត្រូវតែស្ថិតនៅចន្លោះ 20000 និង 29999",
        gl_code_duplicate: "លេខកូដ G/L នេះកំពុងប្រើរួចហើយដោយកំណត់ត្រាផ្សេងទៀត។",
        name_required: "ឈ្មោះត្រូវបានទាមទារ",
        local_name_required: "ឈ្មោះតាមតំបន់ត្រូវបានទាមទារ",
        type_required: "ប្រភេទត្រូវបានទាមទារ",
        cost_invalid: "សូមបញ្ចូលតម្លៃទិញត្រឹមត្រូវ",
        value_invalid: "សូមបញ្ចូលតម្លៃបច្ចុប្បន្នត្រឹមត្រូវ",
        initial_amount_invalid: "សូមបញ្ចូលចំនួនដើមត្រឹមត្រូវ",
        remaining_invalid: "សូមបញ្ចូលសមតុល្យនៅសល់ត្រឹមត្រូវ",
        amount_invalid: "សូមបញ្ចូលចំនួនទឹកប្រាក់ត្រឹមត្រូវ",
        save_error: "មានកំហុសដែលមិនរំពឹងទុកបានកើតឡើង សូមព្យាយាមម្តងទៀត",
        assets_total: "ទ្រព្យសម្បត្តិសរុប",
        liabilities_total: "បំណុលសរុប",
        equity_net_worth: "ទ្រព្យសម្បត្តិសុទ្ធ",
        asset_category: "ប្រភេទទ្រព្យសម្បត្តិ",
        liability_class: "ប្រភេទបំណុល",
        outstanding: "ជំពាក់",
        total_label: "សរុប",
        total_balance_est: "សមតុល្យសរុបប៉ាន់ស្មាន",
        copyright: "© 2026 My Heart • MR.KHENG Kimsan. រក្សាសិទ្ធិគ្រប់យ៉ាង",
        system_configuration: "ការកំណត់ប្រព័ន្ធ",
        none_top_level: "គ្មាន (គណនីមេ)",
        purpose_placeholder: "គោលបំណងនៃគណនីនេះ...",
        leave_blank_password: "ទុកឱ្យនៅទទេដើម្បីរក្សាទុកដូចដើម",
        auto_sync_rates: "ធ្វើបច្ចុប្បន្នភាពអត្រាប្តូរប្រាក់ស្វ័យប្រវត្តិ",
        auto_sync_desc: "ធ្វើបច្ចុប្បន្នភាពអត្រាប្តូរប្រាក់ដោយស្វ័យប្រវត្តិពីអ៊ីនធឺណិត",
        sync_now: "ធ្វើបច្ចុប្បន្នភាពឥឡូវនេះ",
        last_synced: "បានធ្វើបច្ចុប្បន្នភាពចុងក្រោយ",
        exchange_back: "អត្រាប្តូរត្រឡប់",
        choose_role: "ជ្រើសរើសតួនាទី",
        base_currency_desc: "រូបិយប័ណ្ណចគោលសម្រាប់របាយការណ៍ និងសេចក្តីសង្ខេបទាំងអស់",
        inactive: "អសកម្ម",
        files_count: "{{count}} ឯកសារ",
        no_activity_log: "គ្មានកំណត់ហេតុសកម្មភាព",
        delete_template_confirm: "តើអ្នកប្រាកដថាចង់លុបគំរូនេះទេ? អ្នកអាចបង្កើតវាឡើងវិញនៅពេលក្រោយពីថវិកាសកម្មណាមួយ",
        create_template_hint: "បង្កើតថវិកា ហើយរក្សាទុកវាជាគំរូដើម្បីប្រើឡើងវិញនៅពេលក្រោយ",
        calendar_month: "ប្រចាំខែ",
        registry_review: "ការត្រួតពិនិត្យបញ្ជី",
        choose_type: "ជ្រើសរើសប្រភេទ",
        choose_type_label: "ប្រភេទ",
        audit_details: "ព័ត៌មានលម្អិតសវនកម្ម...",
        document_preview: "ការមើលឯកសារជាមុន",
        download_document: "ទាញយកឯកសារ",
        verified_audit_link: "តំណភ្ជាប់សវនកម្មដែលបានផ្ទៀងផ្ទាត់",
        secure_storage: "ការផ្ទុកសុវត្ថិភាព",
        edit_member: "កែសម្រួលសមាជិក",
        new_member: "សមាជិកថ្មី",
        edit_role: "កែសម្រួលតួនាទី",
        role_placeholder: "ឧ. គណនេយ្យករ",
        role_desc_placeholder: "ឧ. កិច្ចការបញ្ចូលបញ្ជីមូលដ្ឋាន",
        users_tab: "អ្នកប្រើប្រាស់",
        roles_tab: "តួនាទី",
        module: "ម៉ូឌុល",
        all: "ទាំងអស់",
        user_id_error_required: "អត្តសញ្ញាណអ្នកប្រើប្រាស់ត្រូវបានទាមទារ",
        user_id_error_duplicate: "អត្តសញ្ញាណនេះត្រូវបានចាត់តាំងរួចហើយ",
        password_error_new: "ពាក្យសម្ងាត់ត្រូវបានទាមទារសម្រាប់សមាជិកថ្មី",
        role_error_required: "សូមជ្រើសរើសតួនាទី",
        address_placeholder: "ឃុំ, ស្រុក, ខេត្ត...",
        name_placeholder: "ឧ. ខេង គឹមសាន",
        phone_placeholder: "071 5665289",
        error_userid_required: 'សូមបញ្ចូលអត្តសញ្ញាណអ្នកប្រើប្រាស់',
        error_password_required: 'សូមបញ្ចូលពាក្យសម្ងាត់',
        error_access_denied: 'ការចូលប្រើត្រូវបានបដិសេធ សូមពិនិត្យមើលព័ត៌មានសម្ងាត់របស់អ្នក',
        error_file_too_large: 'ទំហំឯកសារលើសពីដែនកំណត់ 10MB។',
        hide_password: 'លាក់ពាក្យសម្ងាត់',
        show_password: 'បង្ហាញពាក្យសម្ងាត់',
        switch_to_light: 'ប្តូរទៅភ្លឺ',
        switch_to_dark: 'ប្តូរទៅងងឹត',
        switch_to_system: 'ប្តូរទៅប្រព័ន្ធ',
        edit_basic_info: 'កែសម្រួលព័ត៌មានមូលដ្ឋាន',
        update_value: 'ធ្វើបច្ចុប្បន្នភាពតម្លៃ',
        pause_goal: 'ផ្អាកគោលដៅ',
        resume_goal: 'បន្តគោលដៅ',
        cancel_goal: 'បោះបង់គោលដៅ',
        delete_goal: 'លុបគោលដៅ',
        delete_budget: 'លុបថវិកា',
        delete_account: 'លុបគណនី',
        delete_asset: 'លុបទ្រព្យសម្បត្តិ',
        delete_liability: 'លុបបំណុល',
        delete_transaction: 'លុបប្រតិបត្តិការ',
        adjust_balance_action: 'កែតម្រូវសមតុល្យ',
        set_as_default: 'កំណត់ជាគណនីចម្បង',
        save_as_template_action: 'រក្សាទុកជាគំរូ',
        contribute: 'ចូលរួម',
        view_details_action: 'ព័ត៌មានលម្អិត',
        mark_as_sold: 'កត់ត្រាការលក់',
        mark_as_paid_off: 'កត់ត្រាការទូទាត់រួច',
        sale_date: 'កាលបរិច្ឆេទលក់',
        sale_price: 'តម្លៃលក់',
        payoff_date: 'កាលបរិច្ឆេទបង់ផ្តាច់',
        gain_loss: 'ចំណេញ/ខាត',
        sold_status: 'បានលក់',
        paid_off_status: 'បានបង់ផ្តាច់',
    }
};

interface AppContextType {
    currentUser: User | null;
    settings: AppSettings;
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    goals: Goal[];
    assets: Asset[];
    liabilities: Liability[];
    chartOfAccounts: ChartOfAccount[];
    budgetTemplates: BudgetTemplate[];
    users: User[];
    roles: Role[];
    login: (id: string, pass: string) => Promise<void>;
    logout: () => void;
    t: (key: string, params?: any) => string;
    updateSettings: (s: Partial<AppSettings>) => void;
    addAccount: (a: any) => void;
    updateAccount: (a: any) => void;
    setDefaultAccount: (id: string) => void;
    deleteAccount: (id: string) => void;
    addTransaction: (t: any) => void;
    addTransactions: (txs: any[]) => void;
    updateTransaction: (t: any) => void;
    deleteTransaction: (id: string) => void;
    deleteTransactions: (ids: string[]) => void;
    addBudget: (b: any) => void;
    updateBudget: (b: any) => void;
    deleteBudget: (id: string) => void;
    addBudgetTemplate: (t: any) => void;
    updateBudgetTemplate: (t: any) => void;
    deleteBudgetTemplate: (id: string) => void;
    addGoal: (g: any) => void;
    updateGoal: (g: any) => void;
    deleteGoal: (id: string) => void;
    addAsset: (a: any) => void;
    updateAssetValuation: (id: string, value: number, date: string, note?: string) => void;
    deleteAsset: (id: string) => void;
    addLiability: (l: any) => void;
    updateLiabilityBalance: (id: string, amount: number, date: string, note?: string) => void;
    deleteLiability: (id: string) => void;
    markAssetAsSold: (id: string, saleDate: string, salePrice: number) => void;
    markLiabilityAsPaidOff: (id: string, payoffDate: string) => void;
    addChartOfAccount: (c: any) => void;
    addChartOfAccounts: (coas: any[]) => void;
    updateChartOfAccount: (c: any) => void;
    deleteChartOfAccount: (id: string) => void;
    deleteChartOfAccounts: (ids: string[]) => void;
    addUser: (u: any) => void;
    updateUser: (u: any) => void;
    deleteUser: (id: string) => void;
    addRole: (r: any) => void;
    updateRole: (r: any) => void;
    deleteRole: (id: string) => void;
    updateCurrencyRate: (c: string, r: number) => void;
    toggleCurrencyActive: (c: string, a: boolean) => void;
    syncRates: () => Promise<void>;
    can: (module: AppModuleName, action: PermissionAction) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    profileName: 'User',
    defaultCurrency: Currency.USD,
    exchangeRates: { [Currency.USD]: 1, [Currency.KHR]: 4100, [Currency.THB]: 35 },
    activeCurrencies: [Currency.USD, Currency.KHR, Currency.THB],
    language: 'km',
    theme: 'system',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Asia/Phnom_Penh',
    autoSyncRates: false
};

const defaultUser: User = {
    id: 'ADMIN',
    name: 'Admin User',
    password: '123',
    role: 'Administrator',
    status: UserStatus.ACTIVE,
    failedLoginAttempts: 0
};

// Dummy Data removed
const initialAccounts: Account[] = [];

const initialCoAs: ChartOfAccount[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const cached = localStorage.getItem('my_heart_user');
        return cached ? JSON.parse(cached) : null;
    });
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>(initialCoAs);
    const [users, setUsers] = useState<User[]>([defaultUser]);
    const [roles, setRoles] = useState<Role[]>([
        {
            id: '1', name: 'Administrator', description: 'Full access', permissions: {
                Transactions: { view: true, add: true, edit: true, delete: true },
                Accounts: { view: true, add: true, edit: true, delete: true },
                Budgets: { view: true, add: true, edit: true, delete: true },
                Goals: { view: true, add: true, edit: true, delete: true },
                Assets: { view: true, add: true, edit: true, delete: true },
                Reports: { view: true, add: true, edit: true, delete: true },
                Analytics: { view: true, add: true, edit: true, delete: true },
                Settings: { view: true, add: true, edit: true, delete: true }
            }
        }
    ]);

    // Background sync helper
    const syncWithCloudflare = async (entity: string, action: 'create' | 'update' | 'delete', data: any) => {
        const user = currentUser || JSON.parse(localStorage.getItem('my_heart_user') || 'null');
        if (!user) return;
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user.id
                },
                body: JSON.stringify({ entity, action, data })
            });
            if (!res.ok) {
                if (res.status === 401) {
                    setCurrentUser(null);
                    localStorage.removeItem('my_heart_user');
                }
                const errData = await res.json().catch(() => ({}));
                console.error(`Failed to sync ${entity} (${action}):`, errData.error);
            }
        } catch (e) {
            console.error(`Failed to sync ${entity} (${action}):`, e);
        }
    };

    // Bulk data load helper
    const loadAllData = async (userId: string) => {
        try {
            const res = await fetch('/api/data', {
                headers: { 'Authorization': userId }
            });
            if (res.ok) {
                const data = await res.json();
                
                let loadedAccounts = data.accounts || [];
                const loadedTransactions = data.transactions || [];

                // Self-healing balances recalculation
                const calculatedBalances: Record<string, number> = {};
                loadedTransactions.forEach((tx: any) => {
                    if (!calculatedBalances[tx.accountId]) calculatedBalances[tx.accountId] = 0;
                    calculatedBalances[tx.accountId] += tx.type === 'Income' ? tx.amount : -tx.amount;
                });

                loadedAccounts = loadedAccounts.map((acc: any) => {
                    const correctBalance = calculatedBalances[acc.id] || 0;
                    if (Math.abs(acc.balance - correctBalance) > 0.001) {
                        const updatedAcc = { ...acc, balance: correctBalance };
                        // Sync corrected balance to database automatically
                        setTimeout(() => syncWithCloudflare('accounts', 'update', updatedAcc), 500);
                        return updatedAcc;
                    }
                    return acc;
                });

                if (data.accounts) setAccounts(loadedAccounts);
                if (data.transactions) setTransactions(loadedTransactions);
                if (data.budgets) setBudgets(data.budgets);
                if (data.budgetTemplates) setBudgetTemplates(data.budgetTemplates);
                if (data.goals) setGoals(data.goals);
                if (data.assets) setAssets(data.assets);
                if (data.liabilities) setLiabilities(data.liabilities);
                if (data.chartOfAccounts) setChartOfAccounts(data.chartOfAccounts);
                if (data.settings) setSettings(data.settings);
                if (data.users) setUsers(data.users);
                if (data.roles) setRoles(data.roles);
            } else if (res.status === 401) {
                setCurrentUser(null);
                localStorage.removeItem('my_heart_user');
            }
        } catch (e) {
            console.error("Error loading data from Cloudflare D1:", e);
        }
    };

    // Load data when user logins or app initializes with stored credentials
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('my_heart_user', JSON.stringify(currentUser));
            loadAllData(currentUser.id);
        } else {
            localStorage.removeItem('my_heart_user');
        }
    }, [currentUser]);

    // Auto logout if current user's status is changed to denied or locked
    useEffect(() => {
        if (currentUser) {
            const currentUserInDb = users.find(u => u.id === currentUser.id);
            if (currentUserInDb && (currentUserInDb.status === UserStatus.DENIED || currentUserInDb.status === UserStatus.LOCKED)) {
                logout();
            }
        }
    }, [users, currentUser]);

    // Auto sync settings whenever they change
    useEffect(() => {
        if (currentUser) {
            syncWithCloudflare('settings', 'update', settings);
        }
    }, [settings, currentUser]);

    const login = async (id: string, pass: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, password: pass })
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || "Access denied. Please check your credentials.");
        }

        const data = await response.json();
        setCurrentUser(data.user);
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('my_heart_user');
    };

    const t = useCallback((key: string, params?: any) => {
        let text = TRANSLATIONS[settings.language]?.[key] || TRANSLATIONS['en'][key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{{${k}}}`, String(v));
            });
        }
        return text;
    }, [settings.language]);

    const can = (module: AppModuleName, action: PermissionAction) => {
        if (!currentUser) return false;
        const role = roles.find(r => r.name === currentUser.role);
        return role ? role.permissions[module]?.[action] : false;
    };

    const updateSettings = (s: Partial<AppSettings>) => setSettings(prev => ({ ...prev, ...s }));

    // Helper functions implementation
    const addAccount = (a: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newAcc = { ...a, id };
        setAccounts(prev => [...prev, newAcc]);
        syncWithCloudflare('accounts', 'create', newAcc);
    };

    const updateAccount = (a: any) => {
        setAccounts(prev => prev.map(item => item.id === a.id ? a : item));
        syncWithCloudflare('accounts', 'update', a);
    };

    const setDefaultAccount = (id: string) => {
        setAccounts(prev => {
            return prev.map(acc => {
                if (acc.id === id) {
                    const updated = { ...acc, status: AccountStatus.DEFAULT };
                    syncWithCloudflare('accounts', 'update', updated);
                    return updated;
                }
                if (acc.status === AccountStatus.DEFAULT) {
                    const updated = { ...acc, status: AccountStatus.ACTIVE };
                    syncWithCloudflare('accounts', 'update', updated);
                    return updated;
                }
                return acc;
            });
        });
    };

    const deleteAccount = (id: string) => {
        setTransactions(prev => prev.filter(t => t.accountId !== id));
        setAccounts(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('accounts', 'delete', id);
    };

    const addTransaction = (t: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newTx = { ...t, id, createdBy: currentUser?.name };
        setTransactions(prev => [...prev, newTx]);

        // Auto update balance
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) {
            let amount = t.amount;
            const updatedAcc = {
                ...acc,
                balance: t.type === TransactionType.INCOME ? acc.balance + amount : acc.balance - amount
            };
            updateAccount(updatedAcc);
        }
        syncWithCloudflare('transactions', 'create', newTx);
    };

    const addTransactions = (txs: any[]) => {
        const newTxs = txs.map(t => ({ ...t, id: Math.random().toString(36).substr(2, 9), createdBy: currentUser?.name || t.createdBy }));
        setTransactions(prev => [...prev, ...newTxs]);

        const balanceChanges = new Map<string, number>();
        newTxs.forEach(tx => {
            const change = tx.type === TransactionType.INCOME ? tx.amount : -tx.amount;
            balanceChanges.set(tx.accountId, (balanceChanges.get(tx.accountId) || 0) + change);
        });

        setAccounts(prev => {
            const nextAccounts = [...prev];
            balanceChanges.forEach((change, accountId) => {
                const accIndex = nextAccounts.findIndex(a => a.id === accountId);
                if (accIndex !== -1) {
                    nextAccounts[accIndex] = { ...nextAccounts[accIndex], balance: nextAccounts[accIndex].balance + change };
                }
            });
            return nextAccounts;
        });

        balanceChanges.forEach((change, accountId) => {
             const acc = accounts.find(a => a.id === accountId);
             if (acc) {
                 syncWithCloudflare('accounts', 'update', { ...acc, balance: acc.balance + change });
             }
        });

        // Sync new transactions to Cloudflare as a batch array
        if (newTxs.length > 0) {
            syncWithCloudflare('transactions', 'create', newTxs);
        }
    };

    const updateTransaction = (t: any) => {
        const oldTx = transactions.find(tx => tx.id === t.id);
        if (!oldTx) return;

        if (oldTx.amount !== t.amount || oldTx.type !== t.type || oldTx.accountId !== t.accountId) {
            setAccounts(prev => {
                let nextAccounts = [...prev];

                // Revert old transaction
                const oldAccIndex = nextAccounts.findIndex(a => a.id === oldTx.accountId);
                if (oldAccIndex !== -1) {
                    const oldAcc = nextAccounts[oldAccIndex];
                    const revertBalance = oldTx.type === TransactionType.INCOME
                        ? oldAcc.balance - oldTx.amount
                        : oldAcc.balance + oldTx.amount;
                    const updatedOldAcc = { ...oldAcc, balance: revertBalance };
                    nextAccounts[oldAccIndex] = updatedOldAcc;
                    syncWithCloudflare('accounts', 'update', updatedOldAcc);
                }

                // Apply new transaction
                const newAccIndex = nextAccounts.findIndex(a => a.id === t.accountId);
                if (newAccIndex !== -1) {
                    const newAcc = nextAccounts[newAccIndex];
                    const applyBalance = t.type === TransactionType.INCOME
                        ? newAcc.balance + t.amount
                        : newAcc.balance - t.amount;
                    const updatedNewAcc = { ...newAcc, balance: applyBalance };
                    nextAccounts[newAccIndex] = updatedNewAcc;
                    syncWithCloudflare('accounts', 'update', updatedNewAcc);
                }

                return nextAccounts;
            });
        }

        setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
        syncWithCloudflare('transactions', 'update', t);
    };

    const deleteTransaction = (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (tx) {
            setAccounts(prev => prev.map(acc => {
                if (acc.id === tx.accountId) {
                    let newBalance = acc.balance;
                    if (tx.type === TransactionType.INCOME) {
                        newBalance -= tx.amount;
                    } else {
                        newBalance += tx.amount;
                    }
                    const updatedAcc = { ...acc, balance: newBalance };
                    syncWithCloudflare('accounts', 'update', updatedAcc);
                    return updatedAcc;
                }
                return acc;
            }));
        }
        setTransactions(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('transactions', 'delete', id);
    };

    const deleteTransactions = (ids: string[]) => {
        const txsToDelete = transactions.filter(t => ids.includes(t.id));
        const accountChanges: Record<string, number> = {};

        txsToDelete.forEach(tx => {
            if (!accountChanges[tx.accountId]) accountChanges[tx.accountId] = 0;
            if (tx.type === TransactionType.INCOME) {
                accountChanges[tx.accountId] -= tx.amount;
            } else {
                accountChanges[tx.accountId] += tx.amount;
            }
        });

        setAccounts(prev => prev.map(acc => {
            if (accountChanges[acc.id] !== undefined) {
                const updatedAcc = { ...acc, balance: acc.balance + accountChanges[acc.id] };
                syncWithCloudflare('accounts', 'update', updatedAcc);
                return updatedAcc;
            }
            return acc;
        }));

        setTransactions(prev => prev.filter(item => !ids.includes(item.id)));
        syncWithCloudflare('transactions', 'delete', ids);
    };

    const addBudget = (b: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newBudget = { ...b, id };
        setBudgets(prev => [...prev, newBudget]);
        syncWithCloudflare('budgets', 'create', newBudget);
    };
    const updateBudget = (b: any) => {
        setBudgets(prev => prev.map(item => item.id === b.id ? b : item));
        syncWithCloudflare('budgets', 'update', b);
    };
    const deleteBudget = (id: string) => {
        setBudgets(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('budgets', 'delete', id);
    };

    const addBudgetTemplate = (b: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newTpl = { ...b, id };
        setBudgetTemplates(prev => [...prev, newTpl]);
        syncWithCloudflare('budgetTemplates', 'create', newTpl);
    };
    const updateBudgetTemplate = (b: any) => {
        setBudgetTemplates(prev => prev.map(item => item.id === b.id ? b : item));
        syncWithCloudflare('budgetTemplates', 'update', b);
    };
    const deleteBudgetTemplate = (id: string) => {
        setBudgetTemplates(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('budgetTemplates', 'delete', id);
    };

    const addGoal = (g: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newGoal = { ...g, id };
        setGoals(prev => [...prev, newGoal]);
        syncWithCloudflare('goals', 'create', newGoal);
    };
    const updateGoal = (g: any) => {
        setGoals(prev => prev.map(item => item.id === g.id ? g : item));
        syncWithCloudflare('goals', 'update', g);
    };
    const deleteGoal = (id: string) => {
        setGoals(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('goals', 'delete', id);
    };

    const addAsset = (a: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newAsset = { ...a, id };
        setAssets(prev => [...prev, newAsset]);
        syncWithCloudflare('assets', 'create', newAsset);
    };
    const updateAssetValuation = (id: string, value: number, date: string, note?: string) => {
        setAssets(prev => prev.map(a => {
            if (a.id === id) {
                const updated = {
                    ...a,
                    currentValue: value,
                    valuationHistory: [...(a.valuationHistory || []), { id: Math.random().toString(), date, value, note }]
                };
                syncWithCloudflare('assets', 'update', updated);
                return updated;
            }
            return a;
        }));
    };
    const deleteAsset = (id: string) => {
        setAssets(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('assets', 'delete', id);
    };

    const addLiability = (l: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newLiability = { ...l, id };
        setLiabilities(prev => [...prev, newLiability]);
        syncWithCloudflare('liabilities', 'create', newLiability);
    };
    const updateLiabilityBalance = (id: string, amount: number, date: string, note?: string) => {
        setLiabilities(prev => prev.map(l => {
            if (l.id === id) {
                const updated = {
                    ...l,
                    remaining: amount,
                    balanceHistory: [...(l.balanceHistory || []), { id: Math.random().toString(), date, balance: amount, note }]
                };
                syncWithCloudflare('liabilities', 'update', updated);
                return updated;
            }
            return l;
        }));
    };
    const deleteLiability = (id: string) => {
        setLiabilities(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('liabilities', 'delete', id);
    };

    const markAssetAsSold = (id: string, saleDate: string, salePrice: number) => {
        setAssets(prev => prev.map(a => {
            if (a.id === id) {
                const updated = {
                    ...a,
                    status: 'Sold' as const,
                    saleDate,
                    salePrice
                };
                syncWithCloudflare('assets', 'update', updated);
                return updated;
            }
            return a;
        }));
    };

    const markLiabilityAsPaidOff = (id: string, payoffDate: string) => {
        setLiabilities(prev => prev.map(l => {
            if (l.id === id) {
                const updated = {
                    ...l,
                    status: 'Paid Off' as const,
                    payoffDate,
                    remaining: 0
                };
                syncWithCloudflare('liabilities', 'update', updated);
                return updated;
            }
            return l;
        }));
    };

    const addChartOfAccount = (c: any) => {
        const id = c.id || Math.random().toString(36).substr(2, 9);
        const newCoA = { ...c, id };
        setChartOfAccounts(prev => [...prev, newCoA]);
        syncWithCloudflare('chartOfAccounts', 'create', newCoA);
    };
    const addChartOfAccounts = (newCoAs: any[]) => {
        setChartOfAccounts(prev => [...prev, ...newCoAs]);
        syncWithCloudflare('chartOfAccounts', 'create', newCoAs);
    };
    const updateChartOfAccount = (c: any) => {
        setChartOfAccounts(prev => prev.map(item => item.id === c.id ? c : item));
        syncWithCloudflare('chartOfAccounts', 'update', c);
    };
    const deleteChartOfAccount = (id: string) => {
        const getDescendants = (parentId: string, currentCoAs: any[]): string[] => {
            const children = currentCoAs.filter(c => c.isSubOf === parentId).map(c => c.id);
            let descendants = [...children];
            for (const childId of children) {
                descendants = [...descendants, ...getDescendants(childId, currentCoAs)];
            }
            return descendants;
        };
        const idsToDelete = [id, ...getDescendants(id, chartOfAccounts)];

        setChartOfAccounts(prev => prev.filter(item => !idsToDelete.includes(item.id)));

        // Use bulk delete logic for sync to ensure all are deleted in database
        if (idsToDelete.length === 1) {
            syncWithCloudflare('chartOfAccounts', 'delete', id);
        } else {
            syncWithCloudflare('chartOfAccounts', 'delete', idsToDelete);
        }
    };
    const deleteChartOfAccounts = (ids: string[]) => {
        const getDescendants = (parentId: string, currentCoAs: any[]): string[] => {
            const children = currentCoAs.filter(c => c.isSubOf === parentId).map(c => c.id);
            let descendants = [...children];
            for (const childId of children) {
                descendants = [...descendants, ...getDescendants(childId, currentCoAs)];
            }
            return descendants;
        };
        let idsToDelete = [...ids];
        for (const id of ids) {
            const descendants = getDescendants(id, chartOfAccounts);
            for (const d of descendants) {
                if (!idsToDelete.includes(d)) idsToDelete.push(d);
            }
        }

        setChartOfAccounts(prev => prev.filter(item => !idsToDelete.includes(item.id)));
        syncWithCloudflare('chartOfAccounts', 'delete', idsToDelete);
    };

    const addUser = (u: any) => {
        setUsers(prev => [...prev, u]);
        syncWithCloudflare('users', 'create', u);
    };
    const updateUser = (u: any) => {
        setUsers(prev => prev.map(item => item.id === u.id ? u : item));
        syncWithCloudflare('users', 'update', u);
    };
    const deleteUser = (id: string) => {
        setUsers(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('users', 'delete', id);
    };

    const addRole = (r: any) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newRole = { ...r, id };
        setRoles(prev => [...prev, newRole]);
        syncWithCloudflare('roles', 'create', newRole);
    };
    const updateRole = (r: any) => {
        setRoles(prev => prev.map(item => item.id === r.id ? r : item));
        syncWithCloudflare('roles', 'update', r);
    };
    const deleteRole = (id: string) => {
        setRoles(prev => prev.filter(item => item.id !== id));
        syncWithCloudflare('roles', 'delete', id);
    };

    const updateCurrencyRate = (currency: string, rate: number) => {
        setSettings(prev => ({
            ...prev,
            exchangeRates: { ...prev.exchangeRates, [currency]: rate }
        }));
    };

    const toggleCurrencyActive = (currency: string, isActive: boolean) => {
        setSettings(prev => {
            const active = new Set(prev.activeCurrencies);
            if (isActive) active.add(currency);
            else active.delete(currency);
            return { ...prev, activeCurrencies: Array.from(active) };
        });
    };

    const syncRates = async () => {
        try {
            const base = settings.defaultCurrency;
            const currencies = settings.activeCurrencies.filter(c => c !== base);
            if (currencies.length === 0) return;

            const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
            if (!response.ok) throw new Error("Failed to fetch rates");

            const data = await response.json();

            const filteredRates: Record<string, number> = {};
            currencies.forEach(c => {
                if (data.rates[c]) {
                    filteredRates[c] = data.rates[c];
                }
            });

            const newRates = { ...settings.exchangeRates, [base]: 1, ...filteredRates };

            setSettings(prev => ({
                ...prev,
                exchangeRates: newRates,
                lastRatesSync: new Date().toISOString()
            }));
        } catch (error) {
            console.error("Sync error:", error);
            throw error;
        }
    };

    useEffect(() => {
        if (settings.autoSyncRates) {
            syncRates();
            // Optional: Set up interval for periodic sync
            const interval = setInterval(syncRates, 1000 * 60 * 60); // Every hour
            return () => clearInterval(interval);
        }
    }, [settings.autoSyncRates, settings.defaultCurrency]);

    const value = {
        currentUser, settings, accounts, transactions, budgets, goals, assets, liabilities, chartOfAccounts, budgetTemplates, users, roles,
        login, logout, t, updateSettings, can,
        addAccount, updateAccount, setDefaultAccount, deleteAccount,
        addTransaction, addTransactions, updateTransaction, deleteTransaction, deleteTransactions,
        addBudget, updateBudget, deleteBudget,
        addBudgetTemplate, updateBudgetTemplate, deleteBudgetTemplate,
        addGoal, updateGoal, deleteGoal,
        addAsset, updateAssetValuation, deleteAsset, markAssetAsSold,
        addLiability, updateLiabilityBalance, deleteLiability, markLiabilityAsPaidOff,
        addChartOfAccount, addChartOfAccounts, updateChartOfAccount, deleteChartOfAccount, deleteChartOfAccounts,
        addUser, updateUser, deleteUser,
        addRole, updateRole, deleteRole,
        updateCurrencyRate, toggleCurrencyActive, syncRates
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
};
