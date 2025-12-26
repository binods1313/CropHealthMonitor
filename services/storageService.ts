
import { SavedReport } from '../types';

const STORAGE_KEY = 'crophealth_saved_reports';

export const saveReportToStorage = (report: SavedReport): void => {
  try {
    const existing = getSavedReports();
    // Check if a report for this farm/date already exists (optional de-duplication)
    // For now, we just prepend the new one
    const updated = [report, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save report", e);
  }
};

export const getSavedReports = (): SavedReport[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    // JSON.parse("null") returns null, so we must check the result of parse, not just 'data' string.
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load saved reports", e);
    return [];
  }
};

export const deleteSavedReport = (id: string): SavedReport[] => {
  try {
    const existing = getSavedReports();
    const updated = existing.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to delete report", e);
    return [];
  }
};
