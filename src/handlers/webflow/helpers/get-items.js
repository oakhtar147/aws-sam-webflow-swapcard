async function getItems(webflow, collectionId) {
  const collection = await getNextItems(webflow, collectionId, 0);
  if (collection.items.length !== 0) {
    for (let offset = 100; collection.items.length % 100 === 0; offset += 100) {
      let nextCollection = await getNextItems(webflow, collectionId, offset);
      collection.items.push(...nextCollection.items);
    }
  }
  return collection;
}

//get items from individual page(max 100)
async function getNextItems(webflow, collectionId, offset) {
  const items = await webflow.items(
    { collectionId: collectionId },
    { offset: offset }
  );
  return items;
}

module.exports = {
  getItems
};
