/* Ordering for the per-child topic menus.
 *
 * Topics carry the date the unit was studied (`date: 'YYYY-MM-DD'`). Sorting
 * and grouping happen on that string: ISO dates compare correctly straight
 * through the September → January school-year rollover, so the menu stays in
 * order on its own as topics are added, and several topics can share a month
 * without needing any extra nesting in the menu. */

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/* Newest first, so whatever she is studying right now sits at the top of the
 * menu. Reverse this comparator to read the school year in calendar order. */
export const byNewestFirst = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

/**
 * Group topics into month sections for the dropdown.
 *
 * @param {{id: string, label: string, emoji: string, date?: string}[]} topics
 * @returns {{key: string, label: string|null, items: object[]}[]}
 *   Sections newest month first. A list where no topic has a date renders as a
 *   single unlabeled section in its authored order, so a child's topics can be
 *   left undated until there are enough of them to be worth dating.
 */
export function groupTopicsByMonth(topics) {
  const dated = topics.filter((t) => t.date);
  if (dated.length === 0) {
    return [{ key: 'all', label: null, items: topics }];
  }

  const groups = [];
  for (const topic of [...dated].sort(byNewestFirst)) {
    const key = topic.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(topic);
    } else {
      groups.push({
        key,
        label: MONTH_LABEL.format(new Date(`${topic.date}T00:00:00Z`)),
        items: [topic],
      });
    }
  }

  // A topic added without a date shouldn't vanish from the menu.
  const undated = topics.filter((t) => !t.date);
  if (undated.length > 0) {
    groups.push({ key: 'undated', label: 'Other', items: undated });
  }
  return groups;
}
