function nth(n) {
    if (n >= 10 && n <= 19) {
        return `${n}th`;
    }
    switch (n % 10) {
        case 1:
            return `${n}st`;
        case 2:
            return `${n}nd`;
        case 3:
            return `${n}rd`;
        default:
            return `${n}th`;
    }
}

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function date_to_string(date: Date) {
    return `${months[date.getUTCMonth()]} ${nth(date.getUTCDate())}, ${date.getUTCFullYear()}`;
}

export const AVG_WORDS_PER_MINUTE = 200;

export function estimate_minutes_to_read(words: number, wpm = AVG_WORDS_PER_MINUTE) {
    return Math.ceil(words / wpm);
}
