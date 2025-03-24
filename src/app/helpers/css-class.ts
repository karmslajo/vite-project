export function cssClass(classes: Record<string, boolean>) {
  const classesToUse = Object.keys(classes).filter(
    (className) => className && classes[className]
  );
  if (classesToUse.length) return classesToUse.join(" ");
}
