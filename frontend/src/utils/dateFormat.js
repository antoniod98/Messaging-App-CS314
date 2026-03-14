// format timestamp for message display
// converts to user's local timezone and provides readable format
export function formatMessageTime(timestamp) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const timeString = messageDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // if message is from today, show "HH:MM AM/PM"
  if (messageDateOnly.getTime() === today.getTime()) {
    return timeString;
  }

  // if message is from yesterday, show "Yesterday at HH:MM AM/PM"
  if (messageDateOnly.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeString}`;
  }

  // if message is from this year, show "MMM DD at HH:MM AM/PM"
  if (messageDate.getFullYear() === now.getFullYear()) {
    const monthDay = messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${monthDay} at ${timeString}`;
  }

  // if message is from a previous year, show "MMM DD, YYYY at HH:MM AM/PM"
  const fullDate = messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${fullDate} at ${timeString}`;
}

// format date for day dividers in chat
// returns "Today", "Yesterday", or "Month Day, Year"
export function formatDayDivider(timestamp) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  if (messageDateOnly.getTime() === today.getTime()) {
    return 'Today';
  }

  if (messageDateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  // show full date for older messages
  return messageDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// check if two timestamps are on the same day
export function isSameDay(timestamp1, timestamp2) {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// get user initials from first and last name for avatar display
export function getUserInitials(firstName, lastName) {
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  return firstInitial + lastInitial;
}

// format full timestamp for hover tooltip
// returns complete date and time in readable format
export function formatFullTimestamp(timestamp) {
  const messageDate = new Date(timestamp);

  const dateString = messageDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeString = messageDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return `${dateString} at ${timeString}`;
}

// format relative time (e.g., "2 minutes ago", "1 hour ago")
// used for very recent messages
export function formatRelativeTime(timestamp) {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now - messageDate;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // for older messages, use standard formatting
  return formatMessageTime(timestamp);
}
