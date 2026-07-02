const toSlug = (value: string) => {
  const slugged = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const timePart = (Date.now() % Math.pow(36, 4)).toString(36).padStart(4, "0");
  const randomPart = Math.floor(Math.random() * 36 * 36)
    .toString(36)
    .padStart(2, "0");

  return `${slugged}-${timePart}${randomPart}`;
};

export default toSlug;
