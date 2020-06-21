export const formatDate = (date, locale, timeZone) =>
  date
    ? new Date(date).toLocaleString(locale || "en-US", {
        timeZone: timeZone || "UTC",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
