
import { addDays, addWeeks, setHours, setMinutes, parse, format, isValid, setMonth, setDate, setYear, isAfter, getDay } from 'date-fns';

/**
 * Parses natural language date/time from text.
 * Returns { cleanText, parsedDate, hasTime }.
 */
export const parseDateFromText = (text, referenceDate = new Date()) => {
    let cleanText = text;
    let resultDate = new Date(referenceDate);
    let hasDate = false;
    let hasTime = false;

    // --- 1. Date Keywords ---
    const keywords = [
        { regex: /오늘/, handler: (d) => d },
        { regex: /내일/, handler: (d) => addDays(d, 1) },
        { regex: /모레/, handler: (d) => addDays(d, 2) },
    ];

    for (const { regex, handler } of keywords) {
        if (regex.test(cleanText)) {
            resultDate = handler(new Date()); // Always relative to NOW for simple keywords
            cleanText = cleanText.replace(regex, '').trim();
            hasDate = true;
            break;
        }
    }

    // --- 2. Weekday Logic (e.g. 월요일, 다음주 월요일) ---
    // Handle "다음주 월요일", "이번주 금요일", or just "월요일"
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayRegex = new RegExp(`(다음주|이번주)?\\s*([${dayNames.join('')}])요일`);
    const dayMatch = cleanText.match(dayRegex);

    if (dayMatch) {
        const prefix = dayMatch[1]; // '다음주' or undefined
        const dayChar = dayMatch[2];
        const targetDayIndex = dayNames.indexOf(dayChar); // 0-6

        const currentDayIndex = new Date().getDay();
        let diff = targetDayIndex - currentDayIndex;

        // "Monday" usually means *this coming* Monday (could be today).
        // If "Next Monday" (implicit context usually means next week if passed), but let's stick to prefix.
        if (diff <= 0) diff += 7; // Find the next occurrence

        // If prefix is '다음주' (Next week), add 7 days to the 'next occurrence' logic?
        // Or just add 7 days to today, then find day?
        // "다음주 월요일" -> Monday of next week.
        // Let's rely on simple relative logic: 
        // If '다음주', move base date + 7 days, then find day?
        // No, "다음주 월요일" = (Start of Next Week) + Monday offset.
        // Let's use simple heuristic: Calculate nearest future day, and if '다음주', add 7.

        resultDate = addDays(new Date(), diff);

        if (prefix === '다음주') {
            // If user mistakenly says "Next week Monday" when "Monday" is already next week (e.g. on Saturday), it might jump 2 weeks.
            // But strict interpretation: "Next week" modifer adds 1 week.
            resultDate = addDays(resultDate, 7);
        }
        // Note: If today is Mon and I say "Next week Mon", diff=7 (next Mon), +7 = 2 weeks later?
        // Let's refine: diff <= 0 ? diff+7 : diff. THIS IS NEAREST.
        // Then if '다음주', add 7.
        // If today is Sunday(0), target Mon(1). diff=1. Next Mon.
        // "Next week Mon" -> +7 = Next next Mon. Correct.

        cleanText = cleanText.replace(dayMatch[0], '').trim();
        hasDate = true;
    }

    // --- 3. Relative Future (e.g., 3일 뒤, 2주 뒤) ---
    const relativeDays = cleanText.match(/(\d+)\s*일\s*뒤/);
    if (relativeDays) {
        resultDate = addDays(new Date(), parseInt(relativeDays[1]));
        cleanText = cleanText.replace(relativeDays[0], '').trim();
        hasDate = true;
    }

    const relativeWeeks = cleanText.match(/(\d+)\s*주\s*뒤/);
    if (relativeWeeks) {
        resultDate = addWeeks(new Date(), parseInt(relativeWeeks[1]));
        cleanText = cleanText.replace(relativeWeeks[0], '').trim();
        hasDate = true;
    }

    // --- 4. Explicit Date (e.g. 12월 25일, 12.25, 12/25) ---
    // Handle "M월 d일" or "M.d" or "M/d" check
    // Supported: 12월 25일
    const monthDayMatch = cleanText.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
    if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1; // 0-indexed
        const day = parseInt(monthDayMatch[2]);

        const now = new Date();
        let targetYear = now.getFullYear();

        // If parsed date is seemingly in the past (>1 month ago), assume next year.
        const tempDate = new Date(targetYear, month, day);
        // Heuristic: If we are in Dec, and date is Jan/Feb, assume next year.
        // If we are in Jan, and date is Dec, could be past. But typically Todo is future.
        // Let's force future if > 30 days in past?
        if (tempDate < now && (now.getTime() - tempDate.getTime() > 86400000 * 30)) {
            targetYear += 1;
        }

        resultDate = setYear(resultDate, targetYear);
        resultDate = setMonth(resultDate, month);
        resultDate = setDate(resultDate, day);

        cleanText = cleanText.replace(monthDayMatch[0], '').trim();
        hasDate = true;
    }

    // --- 5. Time Patterns ---
    // Pattern: 오전/오후 H시 (M분 optional)
    const ampmMatch = cleanText.match(/(오전|오후)\s*(\d{1,2})\s*시\s*(\d{1,2})?분?/);
    if (ampmMatch) {
        const meridiem = ampmMatch[1];
        let hour = parseInt(ampmMatch[2]);
        const minute = ampmMatch[3] ? parseInt(ampmMatch[3]) : 0;

        if (meridiem === '오후' && hour < 12) hour += 12;
        if (meridiem === '오전' && hour === 12) hour = 0;

        resultDate = setHours(resultDate, hour);
        resultDate = setMinutes(resultDate, minute);
        cleanText = cleanText.replace(ampmMatch[0], '').trim();
        hasTime = true;
    }
    else {
        // Pattern: HH:mm
        const time24Match = cleanText.match(/(\d{1,2}):(\d{2})/);
        if (time24Match) {
            const hour = parseInt(time24Match[1]);
            const minute = parseInt(time24Match[2]);
            resultDate = setHours(resultDate, hour);
            resultDate = setMinutes(resultDate, minute);
            cleanText = cleanText.replace(time24Match[0], '').trim();
            hasTime = true;
        }
        else {
            // Pattern: H시 (allow particles like '에', '시에')
            // Regex: Look for digit + "시". Allow optional "에".
            // We use a broader match and then extract digits.
            const hourSimpleMatch = cleanText.match(/(\d{1,2})\s*시(?:에)?/);
            if (hourSimpleMatch) {
                let hour = parseInt(hourSimpleMatch[1]);
                // Heuristic: < 8 is PM (except 12)
                if (hour < 8 && hour !== 12) hour += 12;

                resultDate = setHours(resultDate, hour);
                resultDate = setMinutes(resultDate, 0);
                cleanText = cleanText.replace(hourSimpleMatch[0], '').trim();
                hasTime = true;
            }
        }
    }

    // --- Final Cleanup ---
    // Remove cleanText leading/trailing non-word chars if necessary (e.g. commas, particles left over?)
    // But mainly just double spaces
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    // If no date was parsed, revert to referenceDate (but careful about Time logic above using resultDate which was init to reference)
    // If hasDate is false but hasTime is true, we keep TODAY (or reference) + Time.
    // If both false, return null parsedDate so UI knows to use default?
    // Actually, requirement says "auto date". If no date found, use current view date.

    return {
        cleanText,
        parsedDate: (hasDate || hasTime) ? resultDate : null, // If only text, return null so caller uses default
        hasTime
    };
};
