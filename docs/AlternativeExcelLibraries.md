# Alternative Excel Libraries Evaluation

## Overview
This document evaluates alternative Excel libraries to replace the vulnerable `xlsx` library with version 0.18.5, which has a high-severity Prototype Pollution / ReDoS vulnerability.

## Candidate Libraries

### 1. exceljs
- **Pros:**
  - Actively maintained
  - Good TypeScript support
  - Comprehensive Excel features (read/write, formatting, formulas)
  - Better security track record
  - Supports both .xlsx and .xls formats
  - Good performance with large files

- **Cons:**
  - Larger bundle size than xlsx
  - Potentially different API requiring code changes
  - May have different performance characteristics

- **Installation:**
  ```bash
  npm install exceljs
  ```

### 2. sheetjs-lite
- **Pros:**
  - Lightweight version of SheetJS
  - Potentially fewer vulnerabilities due to reduced functionality
  - Similar API to original xlsx library
  - Maintained by same team

- **Cons:**
  - Limited functionality compared to full xlsx
  - May not support all features currently used
  - May still contain similar vulnerabilities

- **Installation:**
  ```bash
  npm install sheetjs-lite
  ```

### 3. Other Options
- csv-writer / papaparse for CSV-only functionality
- write-excel-file (focused on write operations)
- xlsx-js (community fork)

## Recommendation

For immediate mitigation while maintaining functionality:

1. **Short-term:** Keep current xlsx library but use the safe wrapper implemented in `utils/safeExcelHandler.ts`
2. **Medium-term:** Migrate to `exceljs` for better long-term security and maintenance
3. **Long-term:** Wait for official fix from SheetJS team

## Migration Path

### From xlsx to exceljs
```typescript
// Current usage
import * as XLSX from 'xlsx';

// Would become
import ExcelJS from 'exceljs';

// Example mapping:
// XLSX.utils.book_new() -> new ExcelJS.Workbook()
// XLSX.utils.aoa_to_sheet() -> workbook.addWorksheet().addTable()
// XLSX.writeFile() -> workbook.xlsx.writeFile()
```

## Compatibility Assessment

The current implementation in:
- `utils/farmHealthReportExport.ts`
- `utils/disasterReportExport.ts`
- `components/ShareReport.tsx`

Would require moderate refactoring to switch to exceljs, but all functionality can be preserved.

## Security Comparison

| Library | Security Track Record | Last Update | Bundle Size | Maintenance |
|---------|----------------------|-------------|-------------|-------------|
| xlsx 0.18.5 | Known vulnerabilities | 2022 | Medium | Inactive |
| exceljs | Better track record | 2024 | Larger | Active |
| sheetjs-lite | Potentially better | 2024 | Smaller | Active |

## Conclusion

For immediate mitigation, the implemented safe wrapper approach is recommended. For long-term solution, migrating to `exceljs` would provide better security and ongoing maintenance.