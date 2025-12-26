import { fetchWithFallback } from './utils/apiFallback';

// Test the fallback mechanism
console.log('Testing fetchWithFallback functionality...');

// Test 1: Successful API call (simulated)
const successfulApiCall = async () => {
  console.log('Executing successful API call simulation...');
  return { data: 'Live API data', status: 'success' };
};

// Test 2: Failed API call (simulated)
const failedApiCall = async () => {
  console.log('Executing failed API call simulation...');
  throw new Error('API call failed');
};

// Mock data for fallback
const mockData = { data: 'Mock data', status: 'fallback' };

// Run tests
async function runTests() {
  console.log('\n--- Test 1: Successful API call ---');
  const result1 = await fetchWithFallback(successfulApiCall, mockData, 'Test API call 1');
  console.log('Result:', result1);

  console.log('\n--- Test 2: Failed API call (should use fallback) ---');
  const result2 = await fetchWithFallback(failedApiCall, mockData, 'Test API call 2');
  console.log('Result:', result2);

  console.log('\n--- All tests completed ---');
}

runTests().catch(console.error);