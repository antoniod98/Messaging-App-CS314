import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatMessageTime,
  formatDayDivider,
  isSameDay,
  getUserInitials,
  formatFullTimestamp,
  formatRelativeTime,
} from '../utils/dateFormat';

describe('Date Formatting Utilities', () => {
  beforeEach(() => {
    // reset system time before each test
    vi.useRealTimers();
  });

  describe('formatMessageTime', () => {
    // unit test: format time for today
    it('should format time for today as "HH:MM AM/PM"', () => {
      const now = new Date();
      const result = formatMessageTime(now);

      expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
      expect(result).not.toContain('Today');
      expect(result).not.toContain('Yesterday');
    });

    // unit test: format time for yesterday
    it('should format time for yesterday as "Yesterday at HH:MM AM/PM"', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = formatMessageTime(yesterday);

      expect(result).toContain('Yesterday at');
      expect(result).toMatch(/Yesterday at \d{1,2}:\d{2} (AM|PM)$/);
    });

    // unit test: format time for this year (not today/yesterday)
    it('should format time for this year as "MMM DD at HH:MM AM/PM"', () => {
      const thisYear = new Date();
      thisYear.setDate(thisYear.getDate() - 7); // 7 days ago

      const result = formatMessageTime(thisYear);

      expect(result).not.toContain('Today');
      expect(result).not.toContain('Yesterday');
      expect(result).toContain('at');
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2} at \d{1,2}:\d{2} (AM|PM)$/);
    });

    // unit test: format time for previous year
    it('should format time for previous year as "MMM DD, YYYY at HH:MM AM/PM"', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      const result = formatMessageTime(lastYear);

      expect(result).toContain(',');
      expect(result).toContain('at');
      expect(result).toMatch(
        /^[A-Z][a-z]{2} \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)$/
      );
    });

    // unit test: handle midnight time
    it('should correctly format midnight time', () => {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);

      const result = formatMessageTime(midnight);

      expect(result).toContain('12:00 AM');
    });

    // unit test: handle noon time
    it('should correctly format noon time', () => {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);

      const result = formatMessageTime(noon);

      expect(result).toContain('12:00 PM');
    });
  });

  describe('formatDayDivider', () => {
    // unit test: return "Today" for current date
    it('should return "Today" for current date', () => {
      const now = new Date();
      expect(formatDayDivider(now)).toBe('Today');
    });

    // unit test: return "Yesterday" for previous day
    it('should return "Yesterday" for previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(formatDayDivider(yesterday)).toBe('Yesterday');
    });

    // unit test: return full date for older messages
    it('should return full date for older messages', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 7);

      const result = formatDayDivider(oldDate);

      expect(result).not.toBe('Today');
      expect(result).not.toBe('Yesterday');
      expect(result).toMatch(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/);
    });

    // unit test: handle different months
    it('should correctly format dates from different months', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = formatDayDivider(date);

      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('isSameDay', () => {
    // unit test: return true for same day
    it('should return true for timestamps on the same day', () => {
      const date1 = new Date('2024-03-15T09:00:00');
      const date2 = new Date('2024-03-15T18:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    // unit test: return false for different days
    it('should return false for timestamps on different days', () => {
      const date1 = new Date('2024-03-15T23:59:59');
      const date2 = new Date('2024-03-16T00:00:01');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    // unit test: handle same instant
    it('should return true for identical timestamps', () => {
      const date = new Date('2024-03-15T12:00:00');

      expect(isSameDay(date, date)).toBe(true);
    });

    // unit test: handle different months
    it('should return false for different months', () => {
      const date1 = new Date('2024-02-29T12:00:00');
      const date2 = new Date('2024-03-01T12:00:00');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    // unit test: handle different years
    it('should return false for different years', () => {
      const date1 = new Date('2023-12-31T23:59:59');
      const date2 = new Date('2024-01-01T00:00:01');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('getUserInitials', () => {
    // unit test: get initials from full name
    it('should return initials from first and last name', () => {
      expect(getUserInitials('John', 'Doe')).toBe('JD');
      expect(getUserInitials('Jane', 'Smith')).toBe('JS');
    });

    // unit test: handle lowercase names
    it('should capitalize initials from lowercase names', () => {
      expect(getUserInitials('john', 'doe')).toBe('JD');
      expect(getUserInitials('jane', 'smith')).toBe('JS');
    });

    // unit test: handle empty first name
    it('should handle empty first name', () => {
      expect(getUserInitials('', 'Doe')).toBe('D');
    });

    // unit test: handle empty last name
    it('should handle empty last name', () => {
      expect(getUserInitials('John', '')).toBe('J');
    });

    // unit test: handle both empty names
    it('should handle both empty names', () => {
      expect(getUserInitials('', '')).toBe('');
    });

    // unit test: handle null/undefined
    it('should handle null or undefined names', () => {
      expect(getUserInitials(null, 'Doe')).toBe('D');
      expect(getUserInitials('John', null)).toBe('J');
      expect(getUserInitials(undefined, undefined)).toBe('');
    });

    // unit test: handle single character names
    it('should handle single character names', () => {
      expect(getUserInitials('J', 'D')).toBe('JD');
    });
  });

  describe('formatFullTimestamp', () => {
    // unit test: format complete timestamp
    it('should return full timestamp with weekday and time', () => {
      const date = new Date('2024-03-15T14:30:45');
      const result = formatFullTimestamp(date);

      expect(result).toContain('Friday');
      expect(result).toContain('March');
      expect(result).toContain('15');
      expect(result).toContain('2024');
      expect(result).toContain('at');
      expect(result).toContain('2:30:45 PM');
    });

    // unit test: include seconds in timestamp
    it('should include seconds in the time portion', () => {
      const date = new Date('2024-03-15T09:05:03');
      const result = formatFullTimestamp(date);

      expect(result).toMatch(/9:05:03 AM/);
    });
  });

  describe('formatRelativeTime', () => {
    // unit test: "Just now" for recent messages
    it('should return "Just now" for messages less than 60 seconds old', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30000); // 30 seconds ago

      expect(formatRelativeTime(recent)).toBe('Just now');
    });

    // unit test: minutes ago
    it('should return "X minutes ago" for messages less than 60 minutes old', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);

      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5 minutes ago');
    });

    // unit test: singular "minute ago"
    it('should return "1 minute ago" for singular minute', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      const result = formatRelativeTime(oneMinuteAgo);
      expect(result).toBe('1 minute ago');
    });

    // unit test: hours ago
    it('should return "X hours ago" for messages less than 24 hours old', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 3600000);

      const result = formatRelativeTime(threeHoursAgo);
      expect(result).toBe('3 hours ago');
    });

    // unit test: singular "hour ago"
    it('should return "1 hour ago" for singular hour', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const result = formatRelativeTime(oneHourAgo);
      expect(result).toBe('1 hour ago');
    });

    // unit test: days ago
    it('should return "X days ago" for messages less than 7 days old', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);

      const result = formatRelativeTime(twoDaysAgo);
      expect(result).toBe('2 days ago');
    });

    // unit test: singular "day ago"
    it('should return "1 day ago" for singular day', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 86400000);

      const result = formatRelativeTime(oneDayAgo);
      expect(result).toBe('1 day ago');
    });

    // unit test: fallback to standard format for older messages
    it('should use standard formatting for messages older than 7 days', () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 86400000);

      const result = formatRelativeTime(tenDaysAgo);

      expect(result).not.toContain('days ago');
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });
});
