
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../store';
import { TransactionType, Currency, AccountType, Asset, Liability, Transaction, ChartOfAccount } from '../types';
import { convertToDefault, formatCurrency, formatDate, formatDateTime, cn, CLASSES, getPhnomPenhNowISO } from '../utils';
import { 
    Download, 
    Heart, Calendar, ChevronDown, Info,
    FileText, Scale, ArrowRightLeft, Wallet
} from 'lucide-react';
import { Typography } from './Typography';
import { CustomDatePicker } from './CustomDatePicker';
import * as XLSX from 'xlsx';

type ReportType = 'Income Statement' | 'Balance Sheet' | 'Cash Flow' | 'Account Summary';

// Standardized Premium Table classes
const premiumTh = cn(CLASSES.typography.tableHeader, "px-4 py-2.5 h-10 align-middle bg-[#f9fafb] dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-dark-border whitespace-nowrap");
const premiumTd = cn(CLASSES.typography.body, "px-4 py-2.5 align-middle border-b border-[#f3f4f6] dark:border-dark-border/50");

interface IncomeStatementNode {
    id: string;
    label: string;
    amount: number;
    originalAmounts: Record<string, number>;
    children: IncomeStatementNode[];
}

interface IncomeStatementData {
    income: IncomeStatementNode[];
    expenses: IncomeStatementNode[];
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
}

interface CashFlowEntry {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
}

interface BalanceSheetData {
    assets: { name: string; value: number }[];
    liabilities: { name: string; value: number }[];
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
}

interface AccountSummaryGroup {
    currency: string;
    accounts: any[];
    total: number;
}

const TooltipButton: React.FC<{ tooltip: string; variant?: 'default' | 'primary' }> = ({ tooltip, variant = 'default' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (ref.current && !ref.current.contains(event.target as Node)) {
              setIsOpen(false);
          }
      };
      if (isOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
      <div className="relative inline-flex items-center justify-center shrink-0 z-50" ref={ref}>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            className={cn(
                "cursor-pointer transition-colors p-0.5 rounded-full outline-none focus:ring-2 focus:ring-white/20", 
                variant === 'primary' 
                    ? "text-white/60 hover:text-white hover:bg-white/10" 
                    : "text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Info size={12} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-3 bg-gray-900/95 backdrop-blur-md text-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 z-[100] ring-1 ring-white/10 text-center">
                <Typography variant="caption" className="text-white/90 text-[10px] leading-relaxed font-medium block">
                    {tooltip}
                </Typography>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-gray-900/95" />
            </div>
          )}
      </div>
  );
};

const IncomeStatementRow: React.FC<{ node: IncomeStatementNode; level: number; settings: any; isEven: boolean }> = ({ node, level, settings, isEven }) => {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = node.children.length > 0;
    
    return (
        <>
            <tr className={cn("group hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors", isEven ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                <td className={premiumTd} style={{ paddingLeft: `${level * 1.5 + 1}rem` }}>
                    <div className="flex items-center">
                        {hasChildren ? (
                            <button onClick={() => setExpanded(!expanded)} className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <ChevronDown size={14} className={cn("transition-transform", expanded ? "" : "-rotate-90")} />
                            </button>
                        ) : (
                            <span className="w-5 mr-2 inline-block"></span>
                        )}
                        {node.label}
                    </div>
                </td>
                <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums")}>
                    {formatCurrency(node.amount, settings.defaultCurrency, settings.language)}
                </td>
            </tr>
            {expanded && node.children.map((child, i) => (
                <IncomeStatementRow key={child.id} node={child} level={level + 1} settings={settings} isEven={i % 2 === 0} />
            ))}
        </>
    );
};

export const Reports: React.FC = () => {
    const { transactions, accounts, assets, liabilities, settings, t, chartOfAccounts } = useApp();
    const [activeReport, setActiveReport] = useState<ReportType>('Income Statement');
    
    // Initial State: This Year (Phnom Penh Time)
    const [startDate, setStartDate] = useState(() => {
        const nowISO = getPhnomPenhNowISO();
        const year = parseInt(nowISO.split('-')[0]);
        return `${year}-01-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const nowISO = getPhnomPenhNowISO();
        const year = parseInt(nowISO.split('-')[0]);
        return `${year}-12-31`;
    });

    const [activePreset, setActivePreset] = useState('This Year');
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const dateFilterRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
                setIsDateFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const applyPreset = (preset: string) => {
        const nowISO = getPhnomPenhNowISO();
        const todayStr = nowISO.split('T')[0];
        const [yStr, mStr, dStr] = todayStr.split('-');
        const year = parseInt(yStr);
        const month = parseInt(mStr);
        const day = parseInt(dStr);

        const curr = new Date(year, month - 1, day, 12, 0, 0);
        
        const toISO = (d: Date) => {
            const yy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yy}-${mm}-${dd}`;
        };

        let start = '', end = '';

        switch(preset) {
            case 'Today':
                start = todayStr;
                end = todayStr;
                break;
            case 'Yesterday':
                const yest = new Date(curr);
                yest.setDate(curr.getDate() - 1);
                start = toISO(yest);
                end = toISO(yest);
                break;
            case 'This Week':
                const dayOfWeek = curr.getDay(); // 0 is Sun
                // Adjust to Monday start
                const dist = (dayOfWeek + 6) % 7;
                const monday = new Date(curr);
                monday.setDate(curr.getDate() - dist);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                start = toISO(monday);
                end = toISO(sunday);
                break;
            case 'Last Week':
                const dayOfWeekLast = curr.getDay();
                const distLast = (dayOfWeekLast + 6) % 7;
                const prevMonday = new Date(curr);
                prevMonday.setDate(curr.getDate() - distLast - 7);
                const prevSunday = new Date(prevMonday);
                prevSunday.setDate(prevMonday.getDate() + 6);
                start = toISO(prevMonday);
                end = toISO(prevSunday);
                break;
            case 'This Month':
                start = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDayThis = new Date(year, month, 0).getDate();
                end = `${year}-${String(month).padStart(2, '0')}-${lastDayThis}`;
                break;
            case 'Last Month':
                let m = month - 1;
                let y = year;
                if (m === 0) { m = 12; y--; }
                start = `${y}-${String(m).padStart(2, '0')}-01`;
                const lastDayLast = new Date(y, m, 0).getDate();
                end = `${y}-${String(m).padStart(2, '0')}-${lastDayLast}`;
                break;
            case 'This Year':
                start = `${year}-01-01`;
                end = `${year}-12-31`;
                break;
            case 'Last Year':
                start = `${year - 1}-01-01`;
                end = `${year - 1}-12-31`;
                break;
        }
        
        if (start && end) {
            setStartDate(start);
            setEndDate(end);
            setActivePreset(preset);
        }
    };

    const getFilterLabel = () => {
        if (activePreset !== 'Custom') return t(activePreset.toLowerCase().replace(' ', '_')) || activePreset;
        return `${formatDate(startDate, settings.language)} - ${formatDate(endDate, settings.language)}`;
    };

    const presets = [
        'Today', 'This Week', 'This Month', 'This Year',
        'Yesterday', 'Last Week', 'Last Month', 'Last Year'
    ];

    // --- Report Data Calculations ---

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const date = tx.date.split('T')[0];
            return date >= startDate && date <= endDate && !tx.isInternalTransfer;
        });
    }, [transactions, startDate, endDate]);

    const incomeStatementData = useMemo<IncomeStatementData>(() => {
        const incomeAmounts: Record<string, { default: number, original: Record<string, number> }> = {};
        const expenseAmounts: Record<string, { default: number, original: Record<string, number> }> = {};
        const coaMap = new Map<string, ChartOfAccount>(chartOfAccounts.map(c => [c.name, c]));
        const coaIdMap = new Map<string, ChartOfAccount>(chartOfAccounts.map(c => [c.id, c]));
        
        filteredTransactions.forEach(tx => {
            const amount = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
            const map = tx.type === TransactionType.INCOME ? incomeAmounts : expenseAmounts;
            if (!map[tx.category]) map[tx.category] = { default: 0, original: {} };
            map[tx.category].default += amount;
            map[tx.category].original[tx.currency] = (map[tx.category].original[tx.currency] || 0) + tx.amount;
        });

        const buildTree = (amounts: Record<string, { default: number, original: Record<string, number> }>) => {
            const nodes: Record<string, { id: string, label: string, amount: number, originalAmounts: Record<string, number>, children: string[], parentId?: string }> = {};
            
            const getOrCreateNode = (categoryName: string) => {
                if (nodes[categoryName]) return nodes[categoryName];
                
                const coa = coaMap.get(categoryName);
                let label = categoryName;
                let parentId: string | undefined;
                
                if (coa) {
                    const name = settings.language === 'km' && coa.localName ? coa.localName : coa.name;
                    label = `${coa.code} - ${name}`;
                    if (coa.isSubOf) {
                        const parentCoa = coaIdMap.get(coa.isSubOf);
                        if (parentCoa) {
                            parentId = parentCoa.name;
                        }
                    }
                }
                
                nodes[categoryName] = { id: categoryName, label, amount: 0, originalAmounts: {}, children: [], parentId };
                
                if (parentId) {
                    const parentNode = getOrCreateNode(parentId);
                    if (!parentNode.children.includes(categoryName)) {
                        parentNode.children.push(categoryName);
                    }
                }
                
                return nodes[categoryName];
            };

            Object.entries(amounts).forEach(([cat, data]) => {
                const node = getOrCreateNode(cat);
                node.amount += data.default;
                Object.entries(data.original).forEach(([curr, amt]) => {
                    node.originalAmounts[curr] = (node.originalAmounts[curr] || 0) + amt;
                });
                
                let currParent = node.parentId;
                while (currParent) {
                    const pNode = getOrCreateNode(currParent);
                    pNode.amount += data.default;
                    Object.entries(data.original).forEach(([curr, amt]) => {
                        pNode.originalAmounts[curr] = (pNode.originalAmounts[curr] || 0) + amt;
                    });
                    currParent = pNode.parentId;
                }
            });

            const buildHierarchy = (categoryName: string): IncomeStatementNode => {
                const node = nodes[categoryName];
                return {
                    id: node.id,
                    label: node.label,
                    amount: node.amount,
                    originalAmounts: node.originalAmounts,
                    children: node.children.map(buildHierarchy).sort((a, b) => b.amount - a.amount)
                };
            };

            const roots = Object.values(nodes).filter(n => !n.parentId);
            return roots.map(r => buildHierarchy(r.id)).sort((a, b) => b.amount - a.amount);
        };

        const incomeTree = buildTree(incomeAmounts);
        const expenseTree = buildTree(expenseAmounts);

        const totalIncome = incomeTree.reduce((sum, node) => sum + node.amount, 0);
        const totalExpense = expenseTree.reduce((sum, node) => sum + node.amount, 0);

        return {
            income: incomeTree,
            expenses: expenseTree,
            totalIncome,
            totalExpense,
            netIncome: totalIncome - totalExpense
        };
    }, [filteredTransactions, settings, chartOfAccounts]);

    const cashFlowData = useMemo<CashFlowEntry[]>(() => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const year = new Date(startDate).getFullYear();
        
        return months.map((m, idx) => {
            const monthPrefix = `${year}-${String(idx + 1).padStart(2, '0')}`;
            const monthTxs = transactions.filter(tx => tx.date.startsWith(monthPrefix) && !tx.isInternalTransfer);
            
            const inflow = monthTxs
                .filter(tx => tx.type === TransactionType.INCOME)
                .reduce((s, tx) => s + convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates), 0);
            
            const outflow = monthTxs
                .filter(tx => tx.type === TransactionType.EXPENSE)
                .reduce((s, tx) => s + convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates), 0);

            return { month: m, inflow, outflow, net: inflow - outflow };
        });
    }, [transactions, startDate, settings]);

    const totalNetCashFlow = useMemo(() => {
        return cashFlowData.reduce((acc, curr) => acc + curr.net, 0);
    }, [cashFlowData]);

    const balanceSheetData = useMemo<BalanceSheetData>(() => {
        const liquidAssets = accounts.reduce((s, acc) => s + convertToDefault(acc.balance, acc.currency, settings.defaultCurrency, settings.exchangeRates), 0);
        const fixedAssets = assets
            .filter(a => a.status === 'Active')
            .reduce((s, a) => s + convertToDefault(a.currentValue, a.currency, settings.defaultCurrency, settings.exchangeRates), 0);
        
        const activeLiabilities = liabilities
            .filter(l => l.status === 'Active')
            .reduce((s, l) => s + convertToDefault(l.remaining, l.currency, settings.defaultCurrency, settings.exchangeRates), 0);

        return {
            assets: [
                { name: t('cash_and_savings'), value: liquidAssets },
                { name: t('possessions_and_assets'), value: fixedAssets }
            ],
            liabilities: [
                { name: t('outstanding_liabilities'), value: activeLiabilities }
            ],
            totalAssets: liquidAssets + fixedAssets,
            totalLiabilities: activeLiabilities,
            netWorth: (liquidAssets + fixedAssets) - activeLiabilities
        };
    }, [accounts, assets, liabilities, settings, t]);

    const accountSummaryData = useMemo<AccountSummaryGroup[]>(() => {
        const currencies = Array.from(new Set(accounts.map(a => String(a.currency))));
        return currencies.map(curr => {
            const groupCurrency = curr as string;
            return {
                currency: groupCurrency,
                accounts: accounts.filter(a => String(a.currency) === groupCurrency),
                total: accounts.filter(a => String(a.currency) === groupCurrency).reduce((s, a) => s + a.balance, 0)
            };
        });
    }, [accounts]);

    const grandTotalEstimated = useMemo(() => {
        return accounts.reduce((sum, acc) => {
            return sum + convertToDefault(acc.balance, acc.currency as string, settings.defaultCurrency, settings.exchangeRates);
        }, 0);
    }, [accounts, settings]);

    const ownerSummaryData = useMemo(() => {
        const ownerMap: Record<string, number> = {};
        accounts.forEach(acc => {
            const owner = acc.owner || 'Unknown';
            const val = convertToDefault(acc.balance, acc.currency as string, settings.defaultCurrency, settings.exchangeRates);
            if (!ownerMap[owner]) ownerMap[owner] = 0;
            ownerMap[owner] += val;
        });
        return Object.entries(ownerMap)
            .map(([owner, total]) => ({ owner, total }))
            .sort((a,b) => b.total - a.total);
    }, [accounts, settings]);

    const getReportDisplayName = (r: ReportType) => {
        switch(r) {
            case 'Income Statement': return t('report_income_statement');
            case 'Balance Sheet': return t('report_balance_sheet');
            case 'Cash Flow': return t('report_cash_flow');
            case 'Account Summary': return t('report_account_summary');
            default: return r;
        }
    };

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const filterInfo = `${t('date_range')}: ${formatDate(startDate, settings.language)} - ${formatDate(endDate, settings.language)}`;

            if (activeReport === 'Income Statement') {
                const rows: any[] = [];
                rows.push([t('report_income_statement')]);
                rows.push([filterInfo]);
                rows.push([]);
                
                const currencies = Array.from(new Set(filteredTransactions.map(tx => tx.currency))) as string[];
                
                const headers = [t('category'), `${t('total')} (${settings.defaultCurrency})`, ...currencies.map(c => `${t('original_amount')} (${c})`)];
                rows.push(headers);
                
                const addNodesToRows = (nodes: IncomeStatementNode[], level: number) => {
                    nodes.forEach(node => {
                        const indent = " ".repeat(level * 4);
                        const row = [indent + node.label, node.amount];
                        currencies.forEach(c => row.push(node.originalAmounts[c] || 0));
                        rows.push(row);
                        if (node.children.length > 0) {
                            addNodesToRows(node.children, level + 1);
                        }
                    });
                };

                rows.push([t('income')]);
                addNodesToRows(incomeStatementData.income, 0);
                rows.push([t('total_income'), incomeStatementData.totalIncome]);
                rows.push([]);
                
                rows.push([t('expenses')]);
                addNodesToRows(incomeStatementData.expenses, 0);
                rows.push([t('total_expenses'), incomeStatementData.totalExpense]);
                rows.push([]);
                
                rows.push([t('net_income'), incomeStatementData.netIncome]);
                
                const ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, "Income Statement");
                XLSX.writeFile(wb, `Income_Statement_${new Date().toISOString().split('T')[0]}.xlsx`);
            } 
            else if (activeReport === 'Balance Sheet') {
                const rows: any[] = [];
                rows.push([t('report_balance_sheet')]);
                rows.push([filterInfo]);
                rows.push([]);
                
                const currencies = Array.from(new Set([
                    ...accounts.map(a => a.currency),
                    ...assets.filter(a => a.status === 'Active').map(a => a.currency),
                    ...liabilities.filter(l => l.status === 'Active').map(l => l.currency)
                ])) as string[];
                
                const headers = [t('category'), `${t('total')} (${settings.defaultCurrency})`, ...currencies.map(c => `${t('original_amount')} (${c})`)];
                rows.push(headers);
                
                rows.push([t('assets')]);
                
                let liquidDef = 0;
                const liquidOrig: Record<string, number> = {};
                accounts.forEach(a => {
                    liquidDef += convertToDefault(a.balance, a.currency, settings.defaultCurrency, settings.exchangeRates);
                    liquidOrig[a.currency] = (liquidOrig[a.currency] || 0) + a.balance;
                });
                const liquidRow = [t('cash_and_savings'), liquidDef];
                currencies.forEach(c => liquidRow.push(liquidOrig[c] || 0));
                rows.push(liquidRow);
                
                let fixedDef = 0;
                const fixedOrig: Record<string, number> = {};
                assets.filter(a => a.status === 'Active').forEach(a => {
                    fixedDef += convertToDefault(a.currentValue, a.currency, settings.defaultCurrency, settings.exchangeRates);
                    fixedOrig[a.currency] = (fixedOrig[a.currency] || 0) + a.currentValue;
                });
                const fixedRow = [t('possessions_and_assets'), fixedDef];
                currencies.forEach(c => fixedRow.push(fixedOrig[c] || 0));
                rows.push(fixedRow);
                
                rows.push([t('total_assets'), liquidDef + fixedDef]);
                rows.push([]);
                
                rows.push([t('liabilities')]);
                let liabDef = 0;
                const liabOrig: Record<string, number> = {};
                liabilities.filter(l => l.status === 'Active').forEach(l => {
                    liabDef += convertToDefault(l.remaining, l.currency, settings.defaultCurrency, settings.exchangeRates);
                    liabOrig[l.currency] = (liabOrig[l.currency] || 0) + l.remaining;
                });
                const liabRow = [t('outstanding_liabilities'), liabDef];
                currencies.forEach(c => liabRow.push(liabOrig[c] || 0));
                rows.push(liabRow);
                
                rows.push([t('total_liabilities'), liabDef]);
                rows.push([]);
                
                rows.push([t('net_worth'), (liquidDef + fixedDef) - liabDef]);
                
                const ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
                XLSX.writeFile(wb, `Balance_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
            }
            else if (activeReport === 'Cash Flow') {
                const rows: any[] = [];
                rows.push([t('report_cash_flow')]);
                rows.push([filterInfo]);
                rows.push([]);
                
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const year = new Date(startDate).getFullYear();
                
                const currencies = Array.from(new Set(transactions.filter(tx => !tx.isInternalTransfer && tx.date.startsWith(String(year))).map(tx => tx.currency))) as string[];
                
                const headers = [
                    t('month'), 
                    `${t('cash_inflows')} (${settings.defaultCurrency})`, 
                    ...currencies.map(c => `${t('cash_inflows')} (${c})`),
                    `${t('cash_outflows')} (${settings.defaultCurrency})`,
                    ...currencies.map(c => `${t('cash_outflows')} (${c})`),
                    `${t('net_cash_flow')} (${settings.defaultCurrency})`
                ];
                rows.push(headers);
                
                let totalInDef = 0, totalOutDef = 0, totalNetDef = 0;
                
                months.forEach((m, idx) => {
                    const monthPrefix = `${year}-${String(idx + 1).padStart(2, '0')}`;
                    const monthTxs = transactions.filter(tx => tx.date.startsWith(monthPrefix) && !tx.isInternalTransfer);
                    
                    let inDef = 0, outDef = 0;
                    const inOrig: Record<string, number> = {};
                    const outOrig: Record<string, number> = {};
                    
                    monthTxs.forEach(tx => {
                        const defAmt = convertToDefault(tx.amount, tx.currency, settings.defaultCurrency, settings.exchangeRates);
                        if (tx.type === TransactionType.INCOME) {
                            inDef += defAmt;
                            inOrig[tx.currency] = (inOrig[tx.currency] || 0) + tx.amount;
                        } else {
                            outDef += defAmt;
                            outOrig[tx.currency] = (outOrig[tx.currency] || 0) + tx.amount;
                        }
                    });
                    
                    totalInDef += inDef;
                    totalOutDef += outDef;
                    totalNetDef += (inDef - outDef);
                    
                    const row = [m, inDef];
                    currencies.forEach(c => row.push(inOrig[c] || 0));
                    row.push(outDef);
                    currencies.forEach(c => row.push(outOrig[c] || 0));
                    row.push(inDef - outDef);
                    
                    rows.push(row);
                });
                
                rows.push([]);
                rows.push([t('total'), totalInDef, ...currencies.map(() => ''), totalOutDef, ...currencies.map(() => ''), totalNetDef]);
                
                const ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
                XLSX.writeFile(wb, `Cash_Flow_${new Date().toISOString().split('T')[0]}.xlsx`);
            }
            else if (activeReport === 'Account Summary') {
                const rows: any[] = [];
                rows.push([t('report_account_summary')]);
                rows.push([filterInfo]);
                rows.push([]);
                
                const headers = [t('account_name'), t('account_type'), t('original_amount'), t('currency'), `${t('converted_amount')} (${settings.defaultCurrency})`];
                rows.push(headers);
                
                let grandTotal = 0;
                
                accountSummaryData.forEach(group => {
                    rows.push([`${t('currency')}: ${group.currency}`]);
                    let groupTotalDef = 0;
                    
                    group.accounts.forEach(acc => {
                        const defAmt = convertToDefault(acc.balance, acc.currency, settings.defaultCurrency, settings.exchangeRates);
                        groupTotalDef += defAmt;
                        rows.push([
                            acc.name,
                            t(acc.type.toLowerCase()) || acc.type,
                            acc.balance,
                            acc.currency,
                            defAmt
                        ]);
                    });
                    
                    grandTotal += groupTotalDef;
                    rows.push([t('total'), '', group.total, group.currency, groupTotalDef]);
                    rows.push([]);
                });
                
                rows.push([t('grand_total'), '', '', '', grandTotal]);
                rows.push([]);
                
                rows.push(['Total by Owner']);
                rows.push(['Owner', `Estimated Total (${settings.defaultCurrency})`]);
                ownerSummaryData.forEach(ow => {
                    rows.push([ow.owner, ow.total]);
                });
                
                const ws = XLSX.utils.aoa_to_sheet(rows);
                XLSX.utils.book_append_sheet(wb, ws, "Account Summary");
                XLSX.writeFile(wb, `Account_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
            }
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    return (
        <div className={cn(CLASSES.container, "!px-2 md:!px-4 lg:!px-6 !space-y-4 pb-24")}>
            {/* Action Row */}
            <div className="flex flex-row justify-end items-center gap-2 no-print mb-4">
                <button onClick={handleExportExcel} className={cn(CLASSES.buttonPrimary, "h-10 w-10 p-0 rounded-xl flex items-center justify-center shrink-0 shadow-sm")} title={t('export')}>
                    <Download size={18} />
                </button>

                <div className="relative" ref={dateFilterRef}>
                    <button 
                        onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                        className="flex items-center gap-2 px-3 h-10 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition-all shadow-sm focus:ring-4 focus:ring-emerald-500/10 min-w-[160px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{getFilterLabel()}</span>
                        </div>
                        <ChevronDown size={12} className={cn("text-gray-400 transition-all duration-300", isDateFilterOpen && "rotate-180")} />
                    </button>
                    
                    {isDateFilterOpen && (
                        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-[480px] sm:w-[480px] bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl shadow-2xl z-[60] p-4 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                            {/* 4x2 Grid for Presets */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {presets.map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => applyPreset(preset)}
                                        className={cn(
                                            "px-2 py-2.5 rounded-lg text-[10px] font-normal transition-all text-center border normal-case truncate",
                                            activePreset === preset
                                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20 font-bold"
                                                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-dark-border hover:bg-gray-100 dark:hover:bg-gray-700"
                                        )}
                                    >
                                        {t(preset.toLowerCase().replace(' ', '_')) || preset}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between px-1">
                                    <Typography variant="caption" className="tracking-widest font-bold text-[10px] opacity-50">{t('custom_range')}</Typography>
                                    {activePreset === 'Custom' && (
                                        <button onClick={() => applyPreset('This Year')} className="text-[10px] font-bold text-emerald-600 hover:underline">{t('reset_filter')}</button>
                                    )}
                                </div>
                                {/* 2x2 Grid Layout for Fields (2 columns) */}
                                <div className="grid grid-cols-2 gap-3">
                                    <CustomDatePicker label={t('from_date')} value={startDate} onChange={v => { setStartDate(v); setActivePreset('Custom'); }} inputClassName="text-[0.8rem] h-10 font-normal rounded-md" iconSize={14} />
                                    <CustomDatePicker label={t('to_date')} value={endDate} onChange={v => { setEndDate(v); setActivePreset('Custom'); }} inputClassName="text-[0.8rem] h-10 font-normal rounded-md" iconSize={14} />
                                </div>
                                <button onClick={() => setIsDateFilterOpen(false)} className={cn(CLASSES.buttonPrimary, "w-full h-11 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10")}>{t('apply_filter')}</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Sub-Navigation Tabs */}
            <div className="grid grid-cols-2 lg:flex w-full md:w-auto p-1.5 gap-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm mb-6 sticky top-[-16px] lg:top-[-32px] z-30">
                {[
                    { id: 'Income Statement', label: 'report_income_statement', icon: FileText },
                    { id: 'Balance Sheet', label: 'report_balance_sheet', icon: Scale },
                    { id: 'Cash Flow', label: 'report_cash_flow', icon: ArrowRightLeft },
                    { id: 'Account Summary', label: 'report_account_summary', icon: Wallet },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveReport(tab.id as ReportType)}
                            className={cn(
                                "flex-1 w-full flex items-center justify-center gap-2 px-2 sm:px-3 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all",
                                activeReport === tab.id
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                        >
                            <Icon size={16} />
                            <span className="truncate">{t(tab.label)}</span>
                        </button>
                    )
                })}
            </div>

            {/* The Actual Report Document - Rule: Rounded-xl for Card Container */}
            <div report-id="financial-report" ref={reportRef} className="bg-white dark:bg-[#161b22] rounded-[1.5rem] md:rounded-xl border border-gray-200 dark:border-dark-border shadow-xl md:shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 print:shadow-none print:border-none mb-10">
                {/* Report Branding & Context Header */}
                <div className="p-5 md:p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 shrink-0">
                                <Heart size={24} fill="currentColor" className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <Typography variant="h2" className="text-emerald-900 dark:text-white font-black tracking-tight leading-none mb-1">My Heart</Typography>
                                <Typography variant="caption" className="font-semibold opacity-65">{t('financial_statement')}</Typography>
                            </div>
                        </div>
                        <div className="w-full md:w-auto md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                            <Typography variant="h3" className="mb-1 tracking-tight text-lg font-bold">{getReportDisplayName(activeReport)}</Typography>
                            <div className="flex flex-wrap md:justify-end items-center gap-2 text-xs">
                                {/* Rule: Rounded-lg for Badges */}
                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                                    {settings.defaultCurrency}
                                </span>
                                <span className="text-gray-400 font-medium">
                                    {formatDate(startDate, settings.language)} — {formatDate(endDate, settings.language)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="p-5 md:p-8 min-h-[400px]">
                    
                    {activeReport === 'Income Statement' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <section className="space-y-3">
                                <Typography variant="caption" className="font-black text-emerald-600 dark:text-emerald-400 text-sm pl-1">{t('report_revenue_label')}</Typography>
                                {/* Rule: Rounded-lg for Table Container */}
                                <div className="overflow-x-auto scrollbar-thin rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                    <table className="w-full border-separate border-spacing-0">
                                        <thead>
                                            <tr>
                                                <th className={cn(premiumTh, "text-left")}>{t('revenue_category')}</th>
                                                <th className={cn(premiumTh, "text-right")}>{t('total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-transparent">
                                            {incomeStatementData.income.map((node, i) => (
                                                <IncomeStatementRow key={node.id} node={node} level={0} settings={settings} isEven={i % 2 === 0} />
                                            ))}
                                            <tr className="bg-emerald-50/40 dark:bg-emerald-900/20">
                                                <td className={cn(premiumTd, CLASSES.typography.success)}>{t('report_revenue_label')}</td>
                                                {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums", CLASSES.typography.success)}>
                                                    {formatCurrency(incomeStatementData.totalIncome, settings.defaultCurrency, settings.language)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <Typography variant="caption" className="font-black text-red-600 dark:text-red-400 text-sm pl-1">{t('report_expense_label')}</Typography>
                                {/* Rule: Rounded-lg for Table Container */}
                                <div className="overflow-x-auto scrollbar-thin rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                    <table className="w-full border-separate border-spacing-0">
                                        <thead>
                                            <tr>
                                                <th className={cn(premiumTh, "text-left")}>{t('expenses_category')}</th>
                                                <th className={cn(premiumTh, "text-right")}>{t('total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-transparent">
                                            {incomeStatementData.expenses.map((node, i) => (
                                                <IncomeStatementRow key={node.id} node={node} level={0} settings={settings} isEven={i % 2 === 0} />
                                            ))}
                                            <tr className="bg-red-50/40 dark:bg-red-900/20">
                                                <td className={cn(premiumTd, CLASSES.typography.destructive)}>{t('report_expense_label')}</td>
                                                {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums", CLASSES.typography.destructive)}>
                                                    {formatCurrency(incomeStatementData.totalExpense, settings.defaultCurrency, settings.language)}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                {/* Rule: Rounded-xl for Summary Card */}
                                <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-500/20 gap-4">
                                    <div className="text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <Typography variant="caption" className="text-emerald-100 dark:text-emerald-300 font-bold text-xs">{t('report_net_earnings')}</Typography>
                                            <TooltipButton tooltip="Total Revenue minus Total Expenses." variant="primary" />
                                        </div>
                                        {/* Rule: Summary Card Amount -> text-lg md:text-xl font-semibold */}
                                        <Typography variant="h1" className="text-lg md:text-xl font-semibold normal-case tracking-tighter tabular-nums leading-none">
                                            {formatCurrency(incomeStatementData.netIncome, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'Balance Sheet' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="space-y-3">
                                    <Typography variant="caption" className="font-black text-emerald-600 dark:text-emerald-400 text-sm pl-1">{t('total_assets')}</Typography>
                                    {/* Rule: Rounded-lg for Table Container */}
                                    <div className="overflow-hidden rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                        <table className="w-full border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className={cn(premiumTh, "text-left")}>{t('asset_category')}</th>
                                                    <th className={cn(premiumTh, "text-right")}>{t('valuation')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-transparent">
                                                {balanceSheetData.assets.map((a, i) => (
                                                    <tr key={a.name} className={cn("group hover:bg-emerald-50/20 transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                                                        <td className={premiumTd}>{a.name}</td>
                                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                        <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums")}>{formatCurrency(a.value, settings.defaultCurrency, settings.language)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-emerald-50/30 dark:bg-emerald-900/10">
                                                    <td className={cn(premiumTd, CLASSES.typography.success)}>{t('assets_total')}</td>
                                                    {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                    <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums", CLASSES.typography.success)}>
                                                        {formatCurrency(balanceSheetData.totalAssets, settings.defaultCurrency, settings.language)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <Typography variant="caption" className="font-black text-red-600 dark:text-red-400 text-sm pl-1">{t('total_liabilities')}</Typography>
                                    {/* Rule: Rounded-lg for Table Container */}
                                    <div className="overflow-hidden rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                        <table className="w-full border-separate border-spacing-0">
                                            <thead>
                                                <tr>
                                                    <th className={cn(premiumTh, "text-left")}>{t('liability_class')}</th>
                                                    <th className={cn(premiumTh, "text-right")}>{t('outstanding')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-transparent">
                                                {balanceSheetData.liabilities.map((l, i) => (
                                                    <tr key={l.name} className={cn("group hover:bg-red-50/20 transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                                                        <td className={premiumTd}>{l.name}</td>
                                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                        <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums")}>{formatCurrency(l.value, settings.defaultCurrency, settings.language)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-red-50/30 dark:bg-red-900/10">
                                                    <td className={cn(premiumTd, CLASSES.typography.destructive)}>{t('liabilities_total')}</td>
                                                    {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                    <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums", CLASSES.typography.destructive)}>
                                                        {formatCurrency(balanceSheetData.totalLiabilities, settings.defaultCurrency, settings.language)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            </div>

                            <div className="pt-8 border-t-4 border-blue-500/20">
                                {/* Rule: Rounded-xl for Summary Card */}
                                <div className="flex flex-col sm:flex-row justify-between items-center p-8 bg-blue-600 text-white rounded-xl shadow-xl shadow-blue-500/20 gap-6">
                                    <div className="text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                            <Typography variant="caption" className="text-gray-100 dark:text-gray-300 font-bold text-xs">{t('equity_net_worth')}</Typography>
                                            <TooltipButton tooltip="Total Assets minus Total Liabilities." variant="primary" />
                                        </div>
                                        {/* Rule: Summary Card Amount -> text-lg md:text-xl font-semibold */}
                                        <Typography variant="h1" className="text-lg md:text-xl font-semibold normal-case tracking-tighter tabular-nums leading-none">
                                            {formatCurrency(balanceSheetData.netWorth, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'Cash Flow' && (
                        <div className="animate-in fade-in duration-500">
                             {/* Rule: Rounded-lg for Table Container */}
                             <div className="overflow-x-auto scrollbar-thin rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                <table className="w-full border-separate border-spacing-0 table-fixed min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th className={cn(premiumTh, "w-40 pl-8")}>{t('calendar_month')}</th>
                                            <th className={cn(premiumTh, "text-right")}>{t('report_money_in')}</th>
                                            <th className={cn(premiumTh, "text-right")}>{t('report_money_out')}</th>
                                            <th className={cn(premiumTh, "text-right w-48 pr-8 bg-emerald-50/30 dark:bg-emerald-900/10")}>{t('report_net_movement')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-transparent">
                                        {cashFlowData.map((d, i) => (
                                            <tr key={d.month} className={cn("group transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/40 dark:bg-gray-800/10")}>
                                                <td className={cn(premiumTd, "pl-8 tabular-nums font-semibold")}>{d.month}</td>
                                                {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium text-emerald-600 tabular-nums")}>+{formatCurrency(d.inflow, settings.defaultCurrency, settings.language)}</td>
                                                <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium text-red-600 tabular-nums")}>-{formatCurrency(d.outflow, settings.defaultCurrency, settings.language)}</td>
                                                <td className={cn(
                                                    premiumTd,
                                                    "text-right text-sm md:text-base font-medium tabular-nums pr-8",
                                                    d.net >= 0 ? CLASSES.typography.success : CLASSES.typography.destructive
                                                )}>
                                                    {formatCurrency(d.net, settings.defaultCurrency, settings.language)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Net Cash Flow Summary Card */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-500/20 gap-4">
                                    <div className="text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <Typography variant="caption" className="text-emerald-100 dark:text-emerald-300 font-bold text-xs">{t('report_net_movement')}</Typography>
                                            <TooltipButton tooltip="Total Cash Inflows minus Total Cash Outflows for the selected period." variant="primary" />
                                        </div>
                                        <Typography variant="h1" className="text-lg md:text-xl font-semibold normal-case tracking-tighter tabular-nums leading-none">
                                            {formatCurrency(totalNetCashFlow, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'Account Summary' && (
                        <div className="space-y-10 animate-in fade-in duration-500">
                            {accountSummaryData.map(group => (
                                <section key={group.currency} className="space-y-3">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
                                        <Typography variant="caption" className="font-black text-gray-500 text-xs">{group.currency} {t('registry_review')}</Typography>
                                        {/* Rule: Rounded-lg for Badge Container */}
                                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                            {/* Rule: List Item Amount -> text-xs md:text-sm font-medium */}
                                            <Typography variant="caption" className={cn("text-xs md:text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400")}>
                                                {group.currency} {t('total_label')}: {formatCurrency(group.total, group.currency, settings.language)}
                                            </Typography>
                                        </div>
                                    </div>
                                    {/* Rule: Rounded-lg for Table Container */}
                                    <div className="overflow-x-auto scrollbar-thin rounded-lg border border-[#f3f4f6] dark:border-dark-border/50">
                                        <table className="w-full border-separate border-spacing-0 table-fixed min-w-[800px]">
                                            <thead>
                                                <tr>
                                                    <th className={cn(premiumTh, "w-1/3 pl-6")}>{t('account_name')}</th>
                                                    <th className={cn(premiumTh, "w-1/4")}>{t('category')}</th>
                                                    <th className={cn(premiumTh, "text-right")}>Balance ({group.currency})</th>
                                                    <th className={cn(premiumTh, "text-right pr-6")}>EST. {settings.defaultCurrency}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-transparent">
                                                {group.accounts.map((acc, i) => (
                                                    <tr key={acc.id} className={cn("group transition-colors", i % 2 === 0 ? "bg-white dark:bg-[#161b22]" : "bg-gray-50/40 dark:bg-gray-800/10")}>
                                                        <td className={cn(premiumTd, "pl-6 font-bold truncate")}>{acc.name}</td>
                                                        <td className={premiumTd}><Typography variant="caption" className="font-bold tracking-tight text-xs">{acc.type}</Typography></td>
                                                        {/* Rule: Table Cell -> text-sm md:text-base font-medium */}
                                                        <td className={cn(premiumTd, "text-right text-sm md:text-base font-medium tabular-nums")}>{formatCurrency(acc.balance, group.currency, settings.language)}</td>
                                                        <td className={cn(premiumTd, "text-right pr-6 font-medium text-sm md:text-base text-gray-400 tabular-nums italic")}>
                                                            {formatCurrency(convertToDefault(acc.balance, group.currency, settings.defaultCurrency, settings.exchangeRates), settings.defaultCurrency, settings.language)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            ))}

                            {/* Grand Total Footer for Account Summary */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-4">
                                <div className="flex flex-col sm:flex-row justify-between items-center p-6 bg-emerald-600 text-white rounded-xl shadow-xl shadow-emerald-500/20 gap-4">
                                    <div className="text-center sm:text-left">
                                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                            <Typography variant="caption" className="text-emerald-100 dark:text-emerald-300 font-bold text-xs">
                                                {t('total_balance_est')}
                                            </Typography>
                                            <TooltipButton tooltip="The total money of all accounts converted into base currency (excluding your net worth)" variant="primary" />
                                        </div>
                                        <Typography variant="h1" className="text-lg md:text-xl font-semibold normal-case tracking-tighter tabular-nums leading-none">
                                            {formatCurrency(grandTotalEstimated, settings.defaultCurrency, settings.language)}
                                        </Typography>
                                    </div>
                                </div>
                            </div>

                            {/* Total by Owner Breakdown */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-4 space-y-4">
                                <Typography variant="h3" className="font-bold text-gray-700 dark:text-gray-300">Total by Owner</Typography>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {ownerSummaryData.map(ow => (
                                        <div key={ow.owner} className="flex flex-col p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-[#f3f4f6] dark:border-dark-border/50">
                                            <Typography variant="caption" className="font-bold text-gray-500 mb-1">{ow.owner}</Typography>
                                            <Typography variant="body" className="font-semibold text-lg tabular-nums text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(ow.total, settings.defaultCurrency, settings.language)}
                                            </Typography>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Footer */}
                <div className="p-4 md:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Typography variant="caption" className="font-normal text-gray-400">
                        {t('generated')}: <span className="tabular-nums font-medium text-gray-600 dark:text-gray-300">{formatDateTime(new Date().toISOString(), settings.language)}</span>
                    </Typography>
                    <Typography variant="caption" className="font-normal text-gray-400">
                        {t('copyright')}
                    </Typography>
                </div>
            </div>
        </div>
    );
};
