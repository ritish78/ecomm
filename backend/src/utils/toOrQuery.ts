const toOrQuery = (keyword: string) => {
  return keyword.trim().split(/\s+/).filter(Boolean).join(" OR ");
};

export default toOrQuery;
