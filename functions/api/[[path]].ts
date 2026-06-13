interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Response helpers
  const json = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  };

  const error = (message: string, status = 400) => {
    return json({ error: message }, status);
  };

  try {
    // ----------------------------------------------------
    // AUTHENTICATION: POST /api/auth/login
    // ----------------------------------------------------
    if (path === '/api/auth/login' && request.method === 'POST') {
      const { userId, password } = await request.json() as any;

      if (!userId || !password) {
        return error('UserId and password are required', 400);
      }

      // Query user
      const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(userId.trim().toUpperCase())
        .first<any>();

      if (!user) {
        return error('User not found. Please check your User ID.', 404);
      }

      if (user.status === 'Denied') {
        return error('Access denied. Your account has been disabled.', 403);
      }

      // Check lockout status
      if (user.status === 'Locked' || (user.lockoutUntil && new Date(user.lockoutUntil) > new Date())) {
        if (user.status === 'Locked' && user.lockoutUntil && new Date(user.lockoutUntil) <= new Date()) {
          // Auto-unlock
          await env.DB.prepare('UPDATE users SET status = "Active", failedLoginAttempts = 0, lockoutUntil = NULL WHERE id = ?')
            .bind(user.id)
            .run();
          user.status = 'Active';
          user.failedLoginAttempts = 0;
          user.lockoutUntil = null;
        } else {
          const lockoutTime = user.lockoutUntil ? new Date(user.lockoutUntil).toLocaleTimeString() : 'indefinitely';
          return error(`Account is locked. Try again after ${lockoutTime}.`, 403);
        }
      }

      if (user.password !== password) {
        const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
        const maxAttempts = 5;

        if (newFailedAttempts >= maxAttempts) {
          const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins
          await env.DB.prepare('UPDATE users SET status = "Locked", failedLoginAttempts = ?, lockoutUntil = ? WHERE id = ?')
            .bind(newFailedAttempts, lockoutUntil, user.id)
            .run();
          return error('Account locked due to too many failed attempts. Please try again in 15 minutes.', 401);
        } else {
          await env.DB.prepare('UPDATE users SET failedLoginAttempts = ? WHERE id = ?')
            .bind(newFailedAttempts, user.id)
            .run();
          return error(`Incorrect password. You have ${maxAttempts - newFailedAttempts} attempts remaining.`, 401);
        }
      }

      // Login success: Reset failed attempts, update last login
      const lastLogin = new Date().toISOString();
      await env.DB.prepare('UPDATE users SET failedLoginAttempts = 0, lockoutUntil = NULL, lastLogin = ?, status = "Active" WHERE id = ?')
        .bind(lastLogin, user.id)
        .run();

      const updatedUser = {
        id: user.id,
        name: user.name,
        role: user.role,
        status: 'Active',
        lastLogin,
        phone: user.phone,
        address: user.address,
      };

      return json({ user: updatedUser });
    }

    // ----------------------------------------------------
    // MIDDLWARE: Check session via Authorization header
    // ----------------------------------------------------
    const sessionUserId = request.headers.get('Authorization');
    if (!sessionUserId) {
      return error('Unauthorized. Session missing.', 401);
    }

    const sessionUser = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(sessionUserId)
      .first<any>();

    if (!sessionUser || sessionUser.status === 'Denied' || sessionUser.status === 'Locked') {
      return error('Unauthorized. Session invalid or account disabled/locked.', 401);
    }

    // ----------------------------------------------------
    // GET ALL DATA: GET /api/data
    // ----------------------------------------------------
    if (path === '/api/data' && request.method === 'GET') {
      // 1. Settings
      let settingsRow = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<any>();
      if (!settingsRow) {
        // Fallback seed just in case
        await env.DB.prepare(
          'INSERT INTO settings (id, profileName, defaultCurrency, exchangeRates, activeCurrencies, language, theme, dateFormat, timezone, autoSyncRates) VALUES (1, "User", "USD", "{\\"USD\\":1,\\"KHR\\":4100,\\"THB\\":35}", "[\\"USD\\",\\"KHR\\",\\"THB\\"]", "km", "system", "dd/MM/yyyy", "Asia/Phnom_Penh", 0)'
        ).run();
        settingsRow = await env.DB.prepare('SELECT * FROM settings WHERE id = 1').first<any>();
      }

      const settings = {
        profileName: settingsRow.profileName,
        profilePhoto: settingsRow.profilePhoto || undefined,
        defaultCurrency: settingsRow.defaultCurrency,
        exchangeRates: JSON.parse(settingsRow.exchangeRates),
        activeCurrencies: JSON.parse(settingsRow.activeCurrencies),
        language: settingsRow.language,
        theme: settingsRow.theme,
        dateFormat: settingsRow.dateFormat,
        timezone: settingsRow.timezone,
        autoSyncRates: settingsRow.autoSyncRates === 1,
        lastRatesSync: settingsRow.lastRatesSync || undefined,
      };

      // Helper to fetch and map table results
      const fetchAll = async (tableName: string) => {
        const { results } = await env.DB.prepare(`SELECT * FROM ${tableName}`).all<any>();
        return results;
      };

      // 2. Roles
      const rawRoles = await fetchAll('roles');
      const roles = rawRoles.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: JSON.parse(r.permissions),
      }));

      // 3. Users
      const rawUsers = await fetchAll('users');
      const users = rawUsers.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        status: u.status,
        failedLoginAttempts: u.failedLoginAttempts,
        lockoutUntil: u.lockoutUntil || undefined,
        lastLogin: u.lastLogin || undefined,
        phone: u.phone || undefined,
        address: u.address || undefined,
        createdBy: u.createdBy || undefined,
        createdDate: u.createdDate || undefined,
      }));

      // 4. Accounts
      const rawAccounts = await fetchAll('accounts');
      const accounts = rawAccounts.map(a => ({
        ...a,
        owner: a.owner || undefined
      }));

      // 5. Chart of Accounts
      const chartOfAccounts = await fetchAll('chart_of_accounts');

      // 6. Budgets
      const rawBudgets = await fetchAll('budgets');
      const budgets = rawBudgets.map(b => ({
        id: b.id,
        category: b.category,
        amount: b.amount,
        currency: b.currency,
        month: b.month,
        spent: b.spent,
        status: b.status,
        rollover: b.rollover === 1,
        alertThreshold: b.alertThreshold || undefined,
      }));

      // 7. Budget Templates
      const rawTemplates = await fetchAll('budget_templates');
      const budgetTemplates = rawTemplates.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        amount: t.amount,
        currency: t.currency,
        rollover: t.rollover === 1,
      }));

      // 8. Goals
      const rawGoals = await fetchAll('goals');
      const goals = rawGoals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        currency: g.currency,
        startDate: g.startDate,
        endDate: g.endDate,
        status: g.status,
        priority: g.priority,
        note: g.note || undefined,
        progressHistory: JSON.parse(g.progressHistory),
      }));

      // 9. Assets
      const rawAssets = await fetchAll('assets');
      const assets = rawAssets.map(a => ({
        id: a.id,
        glCode: a.glCode,
        name: a.name,
        localName: a.localName || undefined,
        type: a.type,
        purchaseDate: a.purchaseDate,
        cost: a.cost,
        currentValue: a.currentValue,
        currency: a.currency,
        status: a.status,
        note: a.note || undefined,
        depreciationMethod: a.depreciationMethod,
        valuationHistory: JSON.parse(a.valuationHistory),
        documents: JSON.parse(a.documents),
        saleDate: a.saleDate || undefined,
        salePrice: a.salePrice || undefined,
      }));

      // 10. Liabilities
      const rawLiabilities = await fetchAll('liabilities');
      const liabilities = rawLiabilities.map(l => ({
        id: l.id,
        glCode: l.glCode,
        name: l.name,
        localName: l.localName || undefined,
        type: l.type,
        amount: l.amount,
        remaining: l.remaining,
        interestRate: l.interestRate,
        monthlyPayment: l.monthlyPayment || undefined,
        currency: l.currency,
        startDate: l.startDate,
        endDate: l.endDate || undefined,
        status: l.status,
        note: l.note || undefined,
        balanceHistory: JSON.parse(l.balanceHistory),
        documents: JSON.parse(l.documents),
        payoffDate: l.payoffDate || undefined,
      }));

      // 11. Transactions
      const rawTransactions = await fetchAll('transactions');
      const transactions = rawTransactions.map(t => ({
        id: t.id,
        date: t.date,
        type: t.type,
        category: t.category,
        accountId: t.accountId,
        amount: t.amount,
        currency: t.currency,
        note: t.note || undefined,
        defaultAmount: t.defaultAmount || undefined,
        goalId: t.goalId || undefined,
        createdBy: t.createdBy || undefined,
        isInternalTransfer: t.isInternalTransfer === 1,
      }));

      return json({
        settings,
        roles,
        users,
        accounts,
        chartOfAccounts,
        budgets,
        budgetTemplates,
        goals,
        assets,
        liabilities,
        transactions,
      });
    }

    // ----------------------------------------------------
    // SYNC DATA: POST /api/sync
    // ----------------------------------------------------
    if (path === '/api/sync' && request.method === 'POST') {
      const { entity, action, data } = await request.json() as any;

      if (!entity || !action || !data) {
        return error('entity, action and data parameters are required', 400);
      }

      // SYNC: settings
      if (entity === 'settings') {
        await env.DB.prepare(
          `UPDATE settings SET 
            profileName = ?, 
            profilePhoto = ?, 
            defaultCurrency = ?, 
            exchangeRates = ?, 
            activeCurrencies = ?, 
            language = ?, 
            theme = ?, 
            dateFormat = ?, 
            timezone = ?, 
            autoSyncRates = ?, 
            lastRatesSync = ? 
           WHERE id = 1`
        ).bind(
          data.profileName,
          data.profilePhoto || null,
          data.defaultCurrency,
          JSON.stringify(data.exchangeRates),
          JSON.stringify(data.activeCurrencies),
          data.language,
          data.theme,
          data.dateFormat,
          data.timezone,
          data.autoSyncRates ? 1 : 0,
          data.lastRatesSync || null
        ).run();

        return json({ success: true });
      }

      // SYNC: accounts
      if (entity === 'accounts') {
        if (action === 'create') {
          await env.DB.prepare(
            'INSERT INTO accounts (id, name, type, balance, currency, note, status, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(data.id, data.name, data.type, data.balance, data.currency, data.note || null, data.status || 'Active', data.owner || null).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            'UPDATE accounts SET name = ?, type = ?, balance = ?, currency = ?, note = ?, status = ?, owner = ? WHERE id = ?'
          ).bind(data.name, data.type, data.balance, data.currency, data.note || null, data.status || 'Active', data.owner || null, data.id).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM accounts WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: transactions
      if (entity === 'transactions') {
        if (action === 'create') {
          await env.DB.prepare(
            `INSERT INTO transactions (
              id, date, type, category, accountId, amount, currency, note, defaultAmount, goalId, createdBy, isInternalTransfer
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.id,
            data.date,
            data.type,
            data.category,
            data.accountId,
            data.amount,
            data.currency,
            data.note || null,
            data.defaultAmount || null,
            data.goalId || null,
            data.createdBy || null,
            data.isInternalTransfer ? 1 : 0
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            `UPDATE transactions SET 
              date = ?, type = ?, category = ?, accountId = ?, amount = ?, currency = ?, note = ?, defaultAmount = ?, goalId = ?, createdBy = ?, isInternalTransfer = ?
             WHERE id = ?`
          ).bind(
            data.date,
            data.type,
            data.category,
            data.accountId,
            data.amount,
            data.currency,
            data.note || null,
            data.defaultAmount || null,
            data.goalId || null,
            data.createdBy || null,
            data.isInternalTransfer ? 1 : 0,
            data.id
          ).run();
        } else if (action === 'delete') {
          if (Array.isArray(data)) {
            // Delete multiple transactions
            const placeholders = data.map(() => '?').join(',');
            await env.DB.prepare(`DELETE FROM transactions WHERE id IN (${placeholders})`)
              .bind(...data)
              .run();
          } else {
            // Delete single transaction
            await env.DB.prepare('DELETE FROM transactions WHERE id = ?').bind(data).run();
          }
        }
        return json({ success: true });
      }

      // SYNC: budgets
      if (entity === 'budgets') {
        if (action === 'create') {
          await env.DB.prepare(
            'INSERT INTO budgets (id, category, amount, currency, month, spent, status, rollover, alertThreshold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          ).bind(
            data.id,
            data.category,
            data.amount,
            data.currency,
            data.month,
            data.spent,
            data.status,
            data.rollover ? 1 : 0,
            data.alertThreshold || 90
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            'UPDATE budgets SET category = ?, amount = ?, currency = ?, month = ?, spent = ?, status = ?, rollover = ?, alertThreshold = ? WHERE id = ?'
          ).bind(
            data.category,
            data.amount,
            data.currency,
            data.month,
            data.spent,
            data.status,
            data.rollover ? 1 : 0,
            data.alertThreshold || 90,
            data.id
          ).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM budgets WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: budgetTemplates
      if (entity === 'budgetTemplates') {
        if (action === 'create') {
          await env.DB.prepare(
            'INSERT INTO budget_templates (id, name, category, amount, currency, rollover) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(data.id, data.name, data.category, data.amount, data.currency, data.rollover ? 1 : 0).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            'UPDATE budget_templates SET name = ?, category = ?, amount = ?, currency = ?, rollover = ? WHERE id = ?'
          ).bind(data.name, data.category, data.amount, data.currency, data.rollover ? 1 : 0, data.id).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM budget_templates WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: goals
      if (entity === 'goals') {
        if (action === 'create') {
          await env.DB.prepare(
            `INSERT INTO goals (
              id, name, targetAmount, currentAmount, currency, startDate, endDate, status, priority, note, progressHistory
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.id,
            data.name,
            data.targetAmount,
            data.currentAmount,
            data.currency,
            data.startDate,
            data.endDate,
            data.status,
            data.priority,
            data.note || null,
            JSON.stringify(data.progressHistory || [])
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            `UPDATE goals SET 
              name = ?, targetAmount = ?, currentAmount = ?, currency = ?, startDate = ?, endDate = ?, status = ?, priority = ?, note = ?, progressHistory = ?
             WHERE id = ?`
          ).bind(
            data.name,
            data.targetAmount,
            data.currentAmount,
            data.currency,
            data.startDate,
            data.endDate,
            data.status,
            data.priority,
            data.note || null,
            JSON.stringify(data.progressHistory || []),
            data.id
          ).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM goals WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: assets
      if (entity === 'assets') {
        if (action === 'create') {
          await env.DB.prepare(
            `INSERT INTO assets (
              id, glCode, name, localName, type, purchaseDate, cost, currentValue, currency, status, note, depreciationMethod, valuationHistory, documents, saleDate, salePrice
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.id,
            data.glCode,
            data.name,
            data.localName || null,
            data.type,
            data.purchaseDate,
            data.cost,
            data.currentValue,
            data.currency,
            data.status,
            data.note || null,
            data.depreciationMethod,
            JSON.stringify(data.valuationHistory || []),
            JSON.stringify(data.documents || []),
            data.saleDate || null,
            data.salePrice || null
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            `UPDATE assets SET 
              glCode = ?, name = ?, localName = ?, type = ?, purchaseDate = ?, cost = ?, currentValue = ?, currency = ?, status = ?, note = ?, depreciationMethod = ?, valuationHistory = ?, documents = ?, saleDate = ?, salePrice = ?
             WHERE id = ?`
          ).bind(
            data.glCode,
            data.name,
            data.localName || null,
            data.type,
            data.purchaseDate,
            data.cost,
            data.currentValue,
            data.currency,
            data.status,
            data.note || null,
            data.depreciationMethod,
            JSON.stringify(data.valuationHistory || []),
            JSON.stringify(data.documents || []),
            data.saleDate || null,
            data.salePrice || null,
            data.id
          ).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM assets WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: liabilities
      if (entity === 'liabilities') {
        if (action === 'create') {
          await env.DB.prepare(
            `INSERT INTO liabilities (
              id, glCode, name, localName, type, amount, remaining, interestRate, monthlyPayment, currency, startDate, endDate, status, note, balanceHistory, documents, payoffDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.id,
            data.glCode,
            data.name,
            data.localName || null,
            data.type,
            data.amount,
            data.remaining,
            data.interestRate,
            data.monthlyPayment || null,
            data.currency,
            data.startDate,
            data.endDate || null,
            data.status,
            data.note || null,
            JSON.stringify(data.balanceHistory || []),
            JSON.stringify(data.documents || []),
            data.payoffDate || null
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            `UPDATE liabilities SET 
              glCode = ?, name = ?, localName = ?, type = ?, amount = ?, remaining = ?, interestRate = ?, monthlyPayment = ?, currency = ?, startDate = ?, endDate = ?, status = ?, note = ?, balanceHistory = ?, documents = ?, payoffDate = ?
             WHERE id = ?`
          ).bind(
            data.glCode,
            data.name,
            data.localName || null,
            data.type,
            data.amount,
            data.remaining,
            data.interestRate,
            data.monthlyPayment || null,
            data.currency,
            data.startDate,
            data.endDate || null,
            data.status,
            data.note || null,
            JSON.stringify(data.balanceHistory || []),
            JSON.stringify(data.documents || []),
            data.payoffDate || null,
            data.id
          ).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM liabilities WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: chartOfAccounts
      if (entity === 'chartOfAccounts') {
        if (action === 'create') {
          if (Array.isArray(data)) {
            const stmts = data.map((item: any) => 
              env.DB.prepare(
                'INSERT INTO chart_of_accounts (id, code, name, localName, type, description, isSubOf) VALUES (?, ?, ?, ?, ?, ?, ?)'
              ).bind(item.id, item.code, item.name, item.localName, item.type, item.description || null, item.isSubOf || null)
            );
            await env.DB.batch(stmts);
          } else {
            await env.DB.prepare(
              'INSERT INTO chart_of_accounts (id, code, name, localName, type, description, isSubOf) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(data.id, data.code, data.name, data.localName, data.type, data.description || null, data.isSubOf || null).run();
          }
        } else if (action === 'update') {
          await env.DB.prepare(
            'UPDATE chart_of_accounts SET code = ?, name = ?, localName = ?, type = ?, description = ?, isSubOf = ? WHERE id = ?'
          ).bind(data.code, data.name, data.localName, data.type, data.description || null, data.isSubOf || null, data.id).run();
        } else if (action === 'delete') {
          if (Array.isArray(data)) {
            const placeholders = data.map(() => '?').join(',');
            await env.DB.prepare(`DELETE FROM chart_of_accounts WHERE id IN (${placeholders})`)
              .bind(...data)
              .run();
          } else {
            await env.DB.prepare('DELETE FROM chart_of_accounts WHERE id = ?').bind(data).run();
          }
        }
        return json({ success: true });
      }

      // SYNC: users
      if (entity === 'users') {
        if (action === 'create') {
          await env.DB.prepare(
            `INSERT INTO users (
              id, name, password, role, status, failedLoginAttempts, lockoutUntil, lastLogin, phone, address, createdBy, createdDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            data.id,
            data.name,
            data.password,
            data.role,
            data.status,
            data.failedLoginAttempts || 0,
            data.lockoutUntil || null,
            data.lastLogin || null,
            data.phone || null,
            data.address || null,
            data.createdBy || null,
            data.createdDate || null
          ).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            `UPDATE users SET 
              name = ?, password = ?, role = ?, status = ?, failedLoginAttempts = ?, lockoutUntil = ?, lastLogin = ?, phone = ?, address = ?, createdBy = ?, createdDate = ?
             WHERE id = ?`
          ).bind(
            data.name,
            data.password,
            data.role,
            data.status,
            data.failedLoginAttempts || 0,
            data.lockoutUntil || null,
            data.lastLogin || null,
            data.phone || null,
            data.address || null,
            data.createdBy || null,
            data.createdDate || null,
            data.id
          ).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      // SYNC: roles
      if (entity === 'roles') {
        if (action === 'create') {
          await env.DB.prepare(
            'INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)'
          ).bind(data.id, data.name, data.description, JSON.stringify(data.permissions)).run();
        } else if (action === 'update') {
          await env.DB.prepare(
            'UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?'
          ).bind(data.name, data.description, JSON.stringify(data.permissions), data.id).run();
        } else if (action === 'delete') {
          await env.DB.prepare('DELETE FROM roles WHERE id = ?').bind(data).run();
        }
        return json({ success: true });
      }

      return error(`Unknown entity type: ${entity}`);
    }

    return error('Not Found', 404);
  } catch (err: any) {
    console.error('API Error:', err);
    return error(err.message || 'Internal Server Error', 500);
  }
};
