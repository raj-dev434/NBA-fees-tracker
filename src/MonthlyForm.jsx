const getMonthlyData = () => {
  const filtered = entries.filter(entry =>
    entry.date.startsWith(selectedMonth)
  );

  const result = {};

  filtered.forEach(entry => {
    const { court, timing } = entry;

    if (!result[court]) {
      result[court] = {
        Morning: [],
        Evening: []
      };
    }

    result[court][timing].push(entry);
  });

  return result;
};