import React, { useState, useMemo, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Trash2, Filter, X, Download } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearLogs, LogLevel, loadLogsFromDB, clearAllLogsDBThunk } from '../store/slices/logSlice';

export function Logs() {
  const dispatch = useAppDispatch();
  const { entries, loading } = useAppSelector(state => state.log);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load logs from IndexedDB on mount
  useEffect(() => {
    dispatch(loadLogsFromDB());
  }, [dispatch]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('export-menu');
      const button = event.target as HTMLElement;
      if (menu && !menu.contains(button) && !button.closest('[data-export-button]')) {
        menu.classList.add('hidden');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesLevel = filterLevel === 'all' || entry.level === filterLevel;
      const matchesSearch = 
        entry.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.source || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.details || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [entries, filterLevel, searchQuery]);

  const levelCounts = useMemo(() => {
    const counts = { info: 0, success: 0, warning: 0, error: 0 };
    entries.forEach(entry => {
      counts[entry.level]++;
    });
    return counts;
  }, [entries]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };

  const handleExportLogs = (format: 'json' | 'csv') => {
    const logsToExport = filteredEntries.length > 0 ? filteredEntries : entries;
    
    if (logsToExport.length === 0) {
      alert('No logs to export');
      return;
    }

    if (format === 'json') {
      const jsonData = JSON.stringify(logsToExport, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storix-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // CSV header
      const headers = ['Timestamp', 'Date', 'Time', 'Level', 'Source', 'Message', 'Details'];
      const csvRows = [headers.join(',')];
      
      // CSV rows
      logsToExport.forEach(log => {
        const timestamp = typeof log.timestamp === 'string' ? parseInt(log.timestamp) : log.timestamp;
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString('en-US');
        const timeStr = formatTime(timestamp);
        const level = log.level.toUpperCase();
        const source = log.source || '';
        const message = `"${(log.message || '').replace(/"/g, '""')}"`;
        const details = `"${(log.details || '').replace(/"/g, '""')}"`;
        
        csvRows.push([
          timestamp.toString(),
          dateStr,
          timeStr,
          level,
          source,
          message,
          details
        ].join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storix-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      await dispatch(clearAllLogsDBThunk());
      dispatch(clearLogs());
    }
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return <CheckCircle2 size={16} className="text-accent-green" />;
      case 'error':
        return <AlertCircle size={16} className="text-accent-red" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <Info size={16} className="text-accent-blue" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'success':
        return 'bg-accent-green/10 border-accent-green/20 text-accent-green';
      case 'error':
        return 'bg-accent-red/10 border-accent-red/20 text-accent-red';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      default:
        return 'bg-accent-blue/10 border-accent-blue/20 text-accent-blue';
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary text-text-primary">
      {/* Header */}
      <div className="border-b border-border-primary bg-secondary p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">System Logs</h1>
            <p className="text-text-muted text-sm font-mono">
              Track updates, errors, and system events
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative group">
              <button
                data-export-button
                onClick={() => {
                  const menu = document.getElementById('export-menu');
                  if (menu) {
                    menu.classList.toggle('hidden');
                  }
                }}
                className="px-4 py-2 bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2"
                disabled={entries.length === 0}
              >
                <Download size={16} />
                Export Logs
              </button>
              <div
                id="export-menu"
                className="hidden absolute right-0 mt-2 bg-secondary border border-border-primary rounded-sm shadow-lg z-10 min-w-[150px]"
              >
                <button
                  onClick={() => {
                    handleExportLogs('json');
                    const menu = document.getElementById('export-menu');
                    if (menu) menu.classList.add('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-tertiary transition-colors flex items-center gap-2"
                >
                  <Download size={14} />
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    handleExportLogs('csv');
                    const menu = document.getElementById('export-menu');
                    if (menu) menu.classList.add('hidden');
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-tertiary transition-colors flex items-center gap-2 border-t border-border-primary"
                >
                  <Download size={14} />
                  Export as CSV
                </button>
              </div>
            </div>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 bg-accent-red hover:bg-red-600 text-white text-sm font-medium rounded-sm transition-colors flex items-center gap-2"
              disabled={entries.length === 0 || loading}
            >
              <Trash2 size={16} />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <div className="bg-primary border border-border-primary rounded-sm p-3">
            <div className="text-xs text-text-muted mb-1">Total</div>
            <div className="text-lg font-bold text-text-primary">{entries.length}</div>
          </div>
          <div className="bg-primary border border-border-primary rounded-sm p-3">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1">
              <Info size={12} className="text-accent-blue" /> Info
            </div>
            <div className="text-lg font-bold text-accent-blue">{levelCounts.info}</div>
          </div>
          <div className="bg-primary border border-border-primary rounded-sm p-3">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-accent-green" /> Success
            </div>
            <div className="text-lg font-bold text-accent-green">{levelCounts.success}</div>
          </div>
          <div className="bg-primary border border-border-primary rounded-sm p-3">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1">
              <AlertTriangle size={12} className="text-yellow-500" /> Warnings
            </div>
            <div className="text-lg font-bold text-yellow-500">{levelCounts.warning}</div>
          </div>
          <div className="bg-primary border border-border-primary rounded-sm p-3 sm:col-span-2 sm:col-start-3">
            <div className="text-xs text-text-muted mb-1 flex items-center gap-1">
              <AlertCircle size={12} className="text-accent-red" /> Errors
            </div>
            <div className="text-lg font-bold text-accent-red">{levelCounts.error}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-primary border border-border-primary text-text-primary text-sm py-2 pl-9 pr-9 focus:outline-none focus:border-accent-blue placeholder-text-muted rounded-sm"
            />
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'info', 'success', 'warning', 'error'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-2 text-xs font-medium border rounded-sm whitespace-nowrap transition-colors ${
                  filterLevel === level
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-primary border-border-primary text-text-muted hover:border-border-secondary'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                {level !== 'all' && ` (${levelCounts[level as LogLevel]})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
            <Info size={48} className="mb-4 animate-pulse" />
            <p>Loading logs from storage...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
            <Info size={48} className="mb-4" />
            <p>No log entries found</p>
            {searchQuery || filterLevel !== 'all' ? (
              <p className="text-xs mt-2">Try adjusting your filters</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEntries.map((entry, index) => {
              const prevEntry = index > 0 ? filteredEntries[index - 1] : null;
              // Ensure timestamp is a number
              const timestamp = typeof entry.timestamp === 'string' ? parseInt(entry.timestamp) : entry.timestamp;
              const prevTimestamp = prevEntry ? (typeof prevEntry.timestamp === 'string' ? parseInt(prevEntry.timestamp) : prevEntry.timestamp) : null;
              const showDateSeparator = 
                !prevEntry || 
                formatDate(prevTimestamp!) !== formatDate(timestamp);

              return (
                <React.Fragment key={entry.id}>
                  {showDateSeparator && (
                    <div className="text-xs text-text-muted font-mono py-2 border-t border-border-primary mt-4 first:mt-0 first:border-t-0">
                      {formatDate(timestamp)}
                    </div>
                  )}
                  <div
                    className={`
                      bg-secondary border rounded-sm p-3 hover:bg-tertiary transition-colors
                      ${getLevelColor(entry.level)}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getLevelIcon(entry.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-1">
                          <div className="font-medium text-sm">{entry.message}</div>
                          <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
                            {entry.source && (
                              <span className="px-2 py-0.5 bg-primary rounded border border-border-primary">
                                {entry.source}
                              </span>
                            )}
                            <span>{formatTime(timestamp)}</span>
                          </div>
                        </div>
                        {entry.details && (
                          <div className="text-xs text-text-muted mt-1 font-mono bg-primary/50 p-2 rounded border border-border-primary">
                            {entry.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

