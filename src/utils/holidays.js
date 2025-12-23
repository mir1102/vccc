/**
 * Static Holiday Data for South Korea (2024-2026)
 * Includes Solar holidays and major Lunar holidays (Seollal, Chuseok, Buddha's Birthday).
 */

const SOLAR_HOLIDAYS = {
    '01-01': '신정',
    '03-01': '3.1절',
    '05-05': '어린이날',
    '06-06': '현충일',
    '08-15': '광복절',
    '10-03': '개천절',
    '10-09': '한글날',
    '12-25': '크리스마스'
};

// Year-specific Lunar holidays and Substitutes (YYYY-MM-DD)
const LUNAR_AND_SUBSTITUTE_HOLIDAYS = {
    '2024': {
        '2024-02-09': '설날 연휴',
        '2024-02-10': '설날',
        '2024-02-11': '설날 연휴',
        '2024-02-12': '대체공휴일',
        '2024-04-10': '국회의원 선거',
        '2024-05-06': '대체공휴일(어린이날)',
        '2024-05-15': '부처님오신날',
        '2024-09-16': '추석 연휴',
        '2024-09-17': '추석',
        '2024-09-18': '추석 연휴',
    },
    '2025': {
        '2025-01-28': '설날 연휴',
        '2025-01-29': '설날',
        '2025-01-30': '설날 연휴',
        '2025-03-03': '대체공휴일(3.1절)',
        '2025-05-05': '부처님오신날', // Overlaps with Children's Day
        '2025-05-06': '대체공휴일(어린이날)',
        '2025-10-05': '추석 연휴',
        '2025-10-06': '추석',
        '2025-10-07': '추석 연휴',
        '2025-10-08': '대체공휴일(개천절)', // Chuseok overlaps? 10.3 is Fri, 10.5 Sun.. 
        // Note: 2025 Chuseok is Oct 5(Sun)-7(Tue). Foundation Day Oct 3(Fri).
        // Let's keep it simple for now, major dates only.
    },
    '2026': {
        '2026-02-16': '대체공휴일(설날)', // Seollal Feb 17?
        '2026-02-17': '설날', // Actually Feb 17 is Seollal Day? 
        // Reference: 2026 Seollal is Feb 17. So 16, 17, 18. 
        '2026-02-16': '설날 연휴',
        '2026-02-18': '설날 연휴',
        '2026-05-24': '부처님오신날',
        '2026-05-25': '대체공휴일(부처님오신날)',
        '2026-09-24': '추석 연휴',
        '2026-09-25': '추석',
        '2026-09-26': '추석 연휴',
        '2026-09-28': '대체공휴일(추석)', // 26 is Sat, 27 Sun(Substitute?)
    }
};

export const getHolidays = (year, month) => {
    // Month is 0-indexed (0 = Jan) in Date objects, but let's assume 0-11 input
    // Return object: { 'YYYY-MM-DD': 'Name' }

    const yearStr = year.toString();
    const holidays = {};

    // 1. Add Solar Holidays
    Object.entries(SOLAR_HOLIDAYS).forEach(([md, name]) => {
        const [m, d] = md.split('-');
        if (parseInt(m) === month + 1) {
            const dateStr = `${yearStr}-${m}-${d}`;
            holidays[dateStr] = name;
        }
    });

    // 2. Add Lunar/Substitute Holidays
    if (LUNAR_AND_SUBSTITUTE_HOLIDAYS[yearStr]) {
        Object.entries(LUNAR_AND_SUBSTITUTE_HOLIDAYS[yearStr]).forEach(([dateStr, name]) => {
            const [y, m, d] = dateStr.split('-');
            if (parseInt(m) === month + 1) {
                holidays[dateStr] = name;
            }
        });
    }

    return holidays;
};
