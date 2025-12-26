import { validateFileSize, validateFileExtension, validateFileType, validateExcelFile, safeReadExcelFile, safeParseExcelData } from './utils/safeExcelHandler';

// Mock file object for testing
const createMockFile = (name: string, size: number, type: string, content: ArrayBuffer): File => {
  const file = new File([content], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file as File;
};

// Test cases for validation functions
console.log('Testing validation functions...');

// Test file size validation
const largeFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
console.log('Large file validation (should be false):', validateFileSize(largeFile));

const smallFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
Object.defineProperty(smallFile, 'size', { value: 1024 }); // 1KB
console.log('Small file validation (should be true):', validateFileSize(smallFile));

// Test file extension validation
const validFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
console.log('Valid extension validation (should be true):', validateFileExtension(validFile));

const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
console.log('Invalid extension validation (should be false):', validateFileExtension(invalidFile));

// Test file type validation
console.log('Valid file type validation (should be true):', validateFileType(validFile));
console.log('Invalid file type validation (should be false):', validateFileType(invalidFile));

// Test comprehensive validation
const mockFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
Object.defineProperty(mockFile, 'size', { value: 1024 }); // 1KB
console.log('Comprehensive validation for valid file:', validateExcelFile(mockFile));

// Test with an oversized file
const oversizedFile = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
Object.defineProperty(oversizedFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB
console.log('Comprehensive validation for oversized file:', validateExcelFile(oversizedFile));

console.log('Validation tests completed.');