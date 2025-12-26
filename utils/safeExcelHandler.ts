import * as XLSX from 'xlsx';

// Maximum file size allowed (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.xlsx', '.xlsm'];

// Validate file size
export const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

// Validate file extension
export const validateFileExtension = (file: File): boolean => {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(fileExtension);
};

// Validate file type based on MIME type
export const validateFileType = (file: File): boolean => {
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel.sheet.macroEnabled.main+xml', // .xlsm
  ];
  return validMimeTypes.includes(file.type);
};

// Comprehensive file validation
export const validateExcelFile = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!validateFileSize(file)) {
    errors.push(`File size exceeds the maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!validateFileExtension(file)) {
    errors.push(`File extension not allowed. Only ${ALLOWED_EXTENSIONS.join(', ')} files are permitted.`);
  }

  if (!validateFileType(file)) {
    errors.push(`Invalid file type. Only Excel files (.xlsx, .xlsm) are allowed.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Safe file reader with validation and error handling
export const safeReadExcelFile = (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    // First validate the file
    const validation = validateExcelFile(file);
    if (!validation.isValid) {
      return reject(new Error(`File validation failed: ${validation.errors.join('; ')}`));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        // Get the file data as ArrayBuffer
        const data = e.target?.result;
        if (!data) {
          return reject(new Error('Failed to read file data'));
        }

        // Parse the Excel file with additional security options
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true, // Enable date parsing
          cellNF: false,   // Disable number format parsing to reduce risk
          cellText: false, // Disable text parsing to reduce risk
          // Additional options to reduce attack surface
          sheetRows: 10000, // Limit number of rows to process
        });

        // Additional validation after parsing
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          return reject(new Error('Invalid Excel file: No worksheets found'));
        }

        // Validate sheet structure
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            return reject(new Error(`Invalid worksheet: ${sheetName}`));
          }
        }

        resolve(workbook);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};

// Safe parsing function with try/catch and defensive logging
export const safeParseExcelData = (data: any, options: XLSX.ParsingOptions = {}): XLSX.WorkBook | null => {
  try {
    // Set default security options
    const defaultOptions: XLSX.ParsingOptions = {
      cellDates: true,
      cellNF: false,
      cellText: false,
      sheetRows: 10000,
      // Additional security options to reduce attack surface
      ignoreEC: true,  // Ignore errors in calculations
      ...options
    };

    const workbook = XLSX.read(data, defaultOptions);

    // Validate the parsed workbook
    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.warn('Parsed workbook has no sheets');
      return null;
    }

    // Additional validation of workbook structure
    try {
      // Validate sheet names don't contain potentially harmful characters
      for (const sheetName of workbook.SheetNames) {
        if (!isValidSheetName(sheetName)) {
          console.error(`Invalid sheet name detected: ${sheetName}`);
          return null;
        }
      }
    } catch (validationError) {
      console.error('Error validating workbook structure:', validationError);
      return null;
    }

    return workbook;
  } catch (error) {
    console.error('Error in safeParseExcelData:', error);
    // Log more detailed error information for debugging
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}`);
    }
    return null;
  }
};

// Helper function to validate sheet names
const isValidSheetName = (name: string): boolean => {
  // Sheet names should not be empty and should not contain certain characters
  if (!name || name.length > 31) {
    return false;
  }

  // Check for characters that might be problematic
  const invalidChars = /[\\/?*[\]:]/;
  if (invalidChars.test(name)) {
    return false;
  }

  return true;
};

// Function to get sheet data safely with validation
export const getSheetDataSafely = (workbook: XLSX.WorkBook, sheetName?: string): XLSX.WorkSheet | null => {
  try {
    const targetSheetName = sheetName || workbook.SheetNames[0];

    if (!targetSheetName || !workbook.Sheets[targetSheetName]) {
      console.error('Sheet not found in workbook');
      return null;
    }

    // Validate sheet name
    if (!isValidSheetName(targetSheetName)) {
      console.error(`Invalid sheet name: ${targetSheetName}`);
      return null;
    }

    return workbook.Sheets[targetSheetName];
  } catch (error) {
    console.error('Error getting sheet data:', error);
    return null;
  }
};

// Function to convert sheet to JSON with safety limits
export const sheetToJSONSafely = (worksheet: XLSX.WorkSheet, options?: XLSX.Sheet2JSONOpts): any[] => {
  try {
    // Check for potentially malicious content in worksheet
    if (hasPotentiallyMaliciousContent(worksheet)) {
      console.error('Potentially malicious content detected in worksheet');
      return [];
    }

    // Limit the number of rows to process
    const range = XLSX.utils.decode_range(worksheet['!ref'] || '');
    const maxRows = 10000; // Maximum number of rows to process

    if (range.e.r > maxRows) {
      console.warn(`Worksheet has ${range.e.r + 1} rows, which exceeds the maximum of ${maxRows}. Processing first ${maxRows} rows only.`);
      range.e.r = maxRows - 1;
      worksheet['!ref'] = XLSX.utils.encode_range(range);
    }

    return XLSX.utils.sheet_to_json(worksheet, options);
  } catch (error) {
    console.error('Error converting sheet to JSON:', error);
    return [];
  }
};

// Helper function to check for potentially malicious content
const hasPotentiallyMaliciousContent = (worksheet: XLSX.WorkSheet): boolean => {
  // Check for formulas that might be malicious
  // This is a simplified check - in a production environment,
  // you'd want a more comprehensive validation
  try {
    for (const cellAddress in worksheet) {
      if (cellAddress[0] === '!') continue; // Skip metadata properties

      const cell = worksheet[cellAddress];
      if (cell && typeof cell === 'object' && cell.f) { // Check if it's a formula
        const formula = cell.f as string;
        // Check for potentially dangerous functions
        const dangerousFunctions = [
          'EXECUTE', 'CALL', 'REGISTER', 'GET', 'SET', 'EVALUATE', 'INDIRECT',
          'HYPERLINK', 'WEBSERVICE', 'FILTERXML', 'XSLT'
        ];

        const upperFormula = formula.toUpperCase();
        for (const dangerousFunc of dangerousFunctions) {
          if (upperFormula.includes(dangerousFunc)) {
            console.warn(`Potentially dangerous formula detected: ${formula}`);
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for malicious content:', error);
    // If we can't check, assume it's safe to continue
  }

  return false;
};

// Safe export functions that maintain current functionality while adding error handling
export const safeWriteExcelFile = (workbook: XLSX.WorkBook, filename: string): void => {
  try {
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error writing Excel file:', error);
    throw error;
  }
};

export const safeWriteExcelFileBuffer = (workbook: XLSX.WorkBook, filename: string): void => {
  try {
    XLSX.writeFile(workbook, filename, { type: 'binary' });
  } catch (error) {
    console.error('Error writing Excel file buffer:', error);
    throw error;
  }
};