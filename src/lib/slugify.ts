
type Slugify = (title:string) => string
const slugify: Slugify = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, ''); // remove leading/trailing hyphens
}

export default slugify