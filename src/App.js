import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, Trash2, DollarSign, TrendingUp, TrendingDown, BarChart3, PieChart, Loader2, CreditCard, ArrowRightLeft, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart, Line } from 'recharts';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVi_nTGLq5Wa3sPQgAhJv2DIXqiR81_VI",
  authDomain: "spending-tracker-1.firebaseapp.com",
  projectId: "spending-tracker-1",
  storageBucket: "spending-tracker-1.firebasestorage.app",
  messagingSenderId: "359009125105",
  appId: "1:359009125105:web:28f312f917a1fdd5ac5f50",
  measurementId: "G-V8R2JT191C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const SpendingTracker = () => {
  const [expenses, setExpenses] = useState([
    { id: 1, date: '2025-08-15', category: 'Food', description: 'Grocery shopping', amount: 85.50, type: 'expense' },
    { id: 2, date: '2025-08-18', category: 'Transportation', description: 'Gas', amount: 45.00, type: 'expense' },
    { id: 3, date: '2025-08-20', category: 'Entertainment', description: 'Movie tickets', amount: 28.00, type: 'expense' },
  ]);

  const [income, setIncome] = useState([
    { id: 1, date: '2025-08-01', source: 'Salary', description: 'Monthly salary', amount: 15000, account: 'Checking Account' },
    { id: 2, date: '2025-08-15', source: 'Freelance', description: 'Web design project', amount: 2500, account: 'Checking Account' },
  ]);

  const [accounts, setAccounts] = useState([
    { id: 1, name: 'Checking Account', type: 'checking', balance: 12500, color: '#3B82F6' },
    { id: 2, name: 'Savings Account', type: 'savings', balance: 25000, color: '#10B981' },
    { id: 3, name: 'Investment Account', type: 'investment', balance: 45000, color: '#8B5CF6' },
    { id: 4, name: 'Emergency Fund', type: 'savings', balance: 15000, color: '#F59E0B' },
  ]);

  const [transfers, setTransfers] = useState([
    { id: 1, date: '2025-08-10', fromAccount: 'Checking Account', toAccount: 'Savings Account', amount: 1000, description: 'Monthly savings' },
    { id: 2, date: '2025-08-12', fromAccount: 'Savings Account', toAccount: 'Investment Account', amount: 2000, description: 'Investment transfer' },
  ]);

  const [budget, setBudget] = useState({
    Food: 400,
    Transportation: 200,
    Entertainment: 150,
    Shopping: 300,
    Bills: 800,
    Healthcare: 200,
    Other: 200
  });

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
    source: 'Salary',
    description: '',
    amount: '',
    type: 'expense',
    account: 'Checking Account'
  });

  const [newTransfer, setNewTransfer] = useState({
    date: new Date().toISOString().split('T')[0],
    fromAccount: 'Checking Account',
    toAccount: 'Savings Account',
    amount: '',
    description: ''
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
  const incomeSources = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'];
  const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#F97316', '#84CC16'];

  // Real Firebase operations
  const saveToFirebase = async (data, collectionName) => {
    setLoading(true);
    setSaveStatus('Saving...');
    
    try {
      await addDoc(collection(db, collectionName), {
        ...data,
        timestamp: new Date().toISOString()
      });
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
      setSaveStatus('Error saving data');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const deleteFromFirebase = async (id, collectionName) => {
    setLoading(true);
    setSaveStatus('Deleting...');
    
    try {
      await deleteDoc(doc(db, collectionName, id));
      setSaveStatus('Deleted successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error deleting from Firebase:', error);
      setSaveStatus('Error deleting data');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadFromFirebase = async (collectionName, setter) => {
    try {
      const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setter(data);
    } catch (error) {
      console.error(`Error loading ${collectionName} from Firebase:`, error);
      setSaveStatus(`Error loading ${collectionName}`);
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const updateBudgetInFirebase = async (budgetData) => {
    try {
      // Save entire budget object
      await addDoc(collection(db, 'budgetSettings'), {
        budget: budgetData,
        timestamp: new Date().toISOString()
      });
      setSaveStatus('Budget updated successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error updating budget:', error);
      setSaveStatus('Error updating budget');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Calculate current month's data
  const currentMonthSpending = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyExpenses = expenses.filter(expense => 
      expense.date.startsWith(currentMonth)
    );

    return categories.reduce((acc, category) => {
      acc[category] = monthlyExpenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return acc;
    }, {});
  }, [expenses, categories]);

  const currentMonthIncome = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return income
      .filter(inc => inc.date.startsWith(currentMonth))
      .reduce((sum, inc) => sum + inc.amount, 0);
  }, [income]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalSpent = Object.values(currentMonthSpending).reduce((sum, amount) => sum + amount, 0);
  const netIncome = currentMonthIncome - totalSpent;

  // Chart data
  const budgetData = categories.map(category => ({
    category,
    budget: budget[category],
    spent: currentMonthSpending[category] || 0,
    remaining: Math.max(0, budget[category] - (currentMonthSpending[category] || 0))
  }));

  const pieData = categories.map((category, index) => ({
    name: category,
    value: currentMonthSpending[category] || 0,
    color: colors[index]
  })).filter(item => item.value > 0);

  const addTransaction = async () => {
    if (newTransaction.description && newTransaction.amount) {
      const transaction = {
        date: newTransaction.date,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        account: newTransaction.account
      };

      if (newTransaction.type === 'expense') {
        transaction.category = newTransaction.category;
        transaction.type = 'expense';
        
        // Add to local state immediately for better UX
        const tempTransaction = { ...transaction, id: Date.now() };
        setExpenses(prev => [tempTransaction, ...prev]);
        
        // Save to Firebase
        await saveToFirebase(transaction, 'expenses');
        
        // Reload from Firebase to get the actual ID
        await loadFromFirebase('expenses', setExpenses);
      } else {
        transaction.source = newTransaction.source;
        
        // Add to local state immediately for better UX
        const tempTransaction = { ...transaction, id: Date.now() };
        setIncome(prev => [tempTransaction, ...prev]);
        
        // Save to Firebase
        await saveToFirebase(transaction, 'income');
        
        // Reload from Firebase to get the actual ID
        await loadFromFirebase('income', setIncome);
      }
      
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        category: 'Food',
        source: 'Salary',
        description: '',
        amount: '',
        type: 'expense',
        account: 'Checking Account'
      });
    }
  };

  const addTransfer = async () => {
    if (newTransfer.amount && newTransfer.fromAccount !== newTransfer.toAccount) {
      const transfer = {
        date: newTransfer.date,
        fromAccount: newTransfer.fromAccount,
        toAccount: newTransfer.toAccount,
        amount: parseFloat(newTransfer.amount),
        description: newTransfer.description
      };

      // Add to local state immediately for better UX
      const tempTransfer = { ...transfer, id: Date.now() };
      setTransfers(prev => [tempTransfer, ...prev]);
      
      // Save to Firebase
      await saveToFirebase(transfer, 'transfers');
      
      // Reload from Firebase to get the actual ID
      await loadFromFirebase('transfers', setTransfers);
      
      setNewTransfer({
        date: new Date().toISOString().split('T')[0],
        fromAccount: 'Checking Account',
        toAccount: 'Savings Account',
        amount: '',
        description: ''
      });
    }
  };

  const deleteTransaction = async (id, type) => {
    // Remove from local state immediately for better UX
    if (type === 'expense') {
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      await deleteFromFirebase(id, 'expenses');
    } else {
      setIncome(prev => prev.filter(inc => inc.id !== id));
      await deleteFromFirebase(id, 'income');
    }
  };

  const deleteTransfer = async (id) => {
    // Remove from local state immediately for better UX
    setTransfers(prev => prev.filter(transfer => transfer.id !== id));
    await deleteFromFirebase(id, 'transfers');
  };

  const updateBudget = async (category, amount) => {
    const newBudget = {
      ...budget,
      [category]: parseFloat(amount) || 0
    };
    setBudget(newBudget);
    await updateBudgetInFirebase(newBudget);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Personal Finance Manager</h1>
          <p className="text-slate-600">Track expenses, income, accounts, and transfers all in one place</p>
          
          {/* Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            {saveStatus && (
              <div className={`px-3 py-1 rounded-full text-sm ${
                saveStatus.includes('Error') 
                  ? 'bg-red-100 text-red-700' 
                  : saveStatus.includes('successfully') || saveStatus.includes('loaded')
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {saveStatus}
              </div>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 border border-slate-200">
          <div className="flex flex-wrap border-b border-slate-200">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'transactions', label: 'Transactions', icon: PlusCircle },
              { id: 'accounts', label: 'Accounts', icon: CreditCard },
              { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
              { id: 'budget', label: 'Budget', icon: DollarSign },
              { id: 'analytics', label: 'Analytics', icon: PieChart }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${
                  activeTab === id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">Total Balance</h3>
                      <Wallet className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">R{totalBalance.toFixed(2)}</p>
                    <p className="text-sm text-slate-500 mt-2">Across all accounts</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">Monthly Income</h3>
                      <TrendingUp className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-blue-600">R{currentMonthIncome.toFixed(2)}</p>
                    <p className="text-sm text-slate-500 mt-2">This month</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">Monthly Expenses</h3>
                      <TrendingDown className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">R{totalSpent.toFixed(2)}</p>
                    <p className="text-sm text-slate-500 mt-2">This month</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-700">Net Income</h3>
                      <DollarSign className={`w-8 h-8 ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <p className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R{netIncome.toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">Income - Expenses</p>
                  </div>
                </div>

                {/* Quick Account Overview */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Balances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map(account => (
                      <div key={account.id} className="bg-white rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: account.color }}
                          />
                          <h4 className="font-medium text-slate-700">{account.name}</h4>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">R{account.balance.toFixed(2)}</p>
                        <p className="text-sm text-slate-500 capitalize">{account.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Add New Transaction */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Transaction</h3>
                  
                  {/* Transaction Type Toggle */}
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        newTransaction.type === 'expense'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        newTransaction.type === 'income'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Income
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    
                    {newTransaction.type === 'expense' ? (
                      <select
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={newTransaction.source}
                        onChange={(e) => setNewTransaction({...newTransaction, source: e.target.value})}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {incomeSources.map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    )}

                    <select
                      value={newTransaction.account}
                      onChange={(e) => setNewTransaction({...newTransaction, account: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.name}>{account.name}</option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      placeholder="Description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <button
                        onClick={addTransaction}
                        disabled={loading || !newTransaction.description || !newTransaction.amount}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Expenses */}
                  <div className="bg-white rounded-lg border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800">Recent Expenses</h3>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Date</th>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Category</th>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Description</th>
                            <th className="text-right py-2 px-4 text-sm font-semibold text-slate-700">Amount</th>
                            <th className="text-center py-2 px-4 text-sm font-semibold text-slate-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.slice(-10).reverse().map(expense => (
                            <tr key={expense.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-4 text-sm text-slate-600">{expense.date}</td>
                              <td className="py-2 px-4">
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  {expense.category}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-sm text-slate-600">{expense.description}</td>
                              <td className="py-2 px-4 text-right font-medium text-red-600">
                                -R{expense.amount.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                <button
                                  onClick={() => deleteTransaction(expense.id, 'expense')}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Income */}
                  <div className="bg-white rounded-lg border border-slate-200">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800">Recent Income</h3>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Date</th>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Source</th>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Description</th>
                            <th className="text-right py-2 px-4 text-sm font-semibold text-slate-700">Amount</th>
                            <th className="text-center py-2 px-4 text-sm font-semibold text-slate-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {income.slice(-10).reverse().map(inc => (
                            <tr key={inc.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-2 px-4 text-sm text-slate-600">{inc.date}</td>
                              <td className="py-2 px-4">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {inc.source}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-sm text-slate-600">{inc.description}</td>
                              <td className="py-2 px-4 text-right font-medium text-green-600">
                                +R{inc.amount.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-center">
                                <button
                                  onClick={() => deleteTransaction(inc.id, 'income')}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Account Balances</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                  {accounts.map(account => (
                    <div key={account.id} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: account.color }}
                          />
                          <div>
                            <h4 className="font-semibold text-slate-800">{account.name}</h4>
                            <p className="text-sm text-slate-500 capitalize">{account.type} Account</p>
                          </div>
                        </div>
                        <CreditCard className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="mb-4">
                        <p className="text-3xl font-bold text-slate-800">R{account.balance.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                          View Details
                        </button>
                        <button className="flex-1 px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Account Summary */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        R{accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">Checking Accounts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        R{accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">Savings Accounts</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        R{accounts.filter(a => a.type === 'investment').reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-600">Investment Accounts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transfers' && (
              <div className="space-y-6">
                {/* Add New Transfer */}
                <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Transfer</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={newTransfer.date}
                      onChange={(e) => setNewTransfer({...newTransfer, date: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />

                    <select
                      value={newTransfer.fromAccount}
                      onChange={(e) => setNewTransfer({...newTransfer, fromAccount: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.name}>{account.name}</option>
                      ))}
                    </select>

                    <select
                      value={newTransfer.toAccount}
                      onChange={(e) => setNewTransfer({...newTransfer, toAccount: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.name}>{account.name}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Description"
                      value={newTransfer.description}
                      onChange={(e) => setNewTransfer({...newTransfer, description: e.target.value})}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                    
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={newTransfer.amount}
                        onChange={(e) => setNewTransfer({...newTransfer, amount: e.target.value})}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      />
                      <button
                        onClick={addTransfer}
                        disabled={loading || !newTransfer.amount || newTransfer.fromAccount === newTransfer.toAccount}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Transfers */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded-lg border border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">From Account</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">To Account</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700">Description</th>
                        <th className="py-3 px-4 text-center text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.slice(-10).reverse().map(transfer => (
                        <tr key={transfer.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm text-slate-600">{transfer.date}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{transfer.fromAccount}</td>
                          <td className="py-3 px-4 text-sm text-slate-600">{transfer.toAccount}</td>
                          <td className="py-3 px-4 text-sm font-medium text-blue-600">
                            R{transfer.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">{transfer.description}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => deleteTransfer(transfer.id)}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className="space-y-6">
                {/* Budget Overview */}
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Budget Overview</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(category => (
                      <div key={category} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-sm text-slate-600 capitalize">{category} Budget</p>
                          <p className="text-xl font-bold text-slate-800">
                            R{(budget[category] || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="w-16 h-16">
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={pieData.filter(item => item.name === category)}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                outerRadius="60%"
                                fill={colors[categories.indexOf(category)]}
                                stroke="none"
                              >
                                {pieData.filter(item => item.name === category).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Settings */}
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Budget Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map(category => (
                      <div key={category} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-sm text-slate-600 capitalize">{category} Budget</p>
                          <p className="text-xl font-bold text-slate-800">
                            R{(budget[category] || 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={budget[category]}
                            onChange={(e) => updateBudget(category, e.target.value)}
                            className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                          />
                          <button
                            onClick={() => updateBudget(category, budget[category])}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Charts and Graphs */}
                <div className="bg-white rounded-lg p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Spending Analytics</h3>

                  {/* Monthly Spending Bar Chart */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Monthly Spending</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Object.entries(currentMonthSpending).map(([category, amount]) => ({ category, amount }))}>
                        <CartesianGrid strokeDasharray="3 3" className="text-slate-200" />
                        <XAxis dataKey="category" className="text-slate-600" />
                        <YAxis className="text-slate-600" />
                        <Tooltip />
                        <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Spending Pie Chart */}
                  <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Category Spending Distribution</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius="60%"
                          outerRadius="80%"
                          fill="#8884d8"
                          paddingAngle={5}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingTracker;
