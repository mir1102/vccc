
import { parseDateFromText } from './src/utils/dateParser.js';
import { format } from 'date-fns';

const runTest = (input) => {
    const result = parseDateFromText(input, new Date('2025-12-22T00:00:00'));
    console.log(`Input: "${input}"`);
    console.log(`Clean: "${result.cleanText}"`);
    console.log(`Date: ${result.parsedDate ? format(result.parsedDate, 'yyyy-MM-dd HH:mm') : 'null'}`);
    console.log(`HasTime: ${result.hasTime}`);
    console.log('---');
};

console.log('Testing Parser...');
runTest("12월27일 토요일 전체 특근");
runTest("12월 27일 토요일 전체 특근");
runTest("내일 오후 3시 회의");
runTest("다음주 월요일 10시에 본사 회의 참석");
runTest("15시에 유림테크에서 미팅");
