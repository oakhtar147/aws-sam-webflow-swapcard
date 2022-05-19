const {
  webflowRateLimiterWorkaround
} = require("./webflowAPI-ratelimit-workaround");

async function getItems(webflow, collectionId) {
  const collection = await getNextItems(webflow, collectionId, 0);
  let lastCollectionItemsLength = 0;
  if (collection.items.length !== 0) {
    for (
      let offset = 100;
      collection.items.length % 100 === 0 &&
      collection.items.length !== lastCollectionItemsLength;
      offset += 100
    ) {
      let nextCollection = await getNextItems(webflow, collectionId, offset);
      lastCollectionItemsLength = collection.items.length;
      collection.items.push(...nextCollection.items);
    }
  }
  return collection;
}

//get items from individual page(max 100)
async function getNextItems(webflow, collectionId, offset) {
  const items = await webflowRateLimiterWorkaround({
    webflow,
    collectionId,
    callback: async () => await webflow.items({ collectionId }, { offset })
  });
  return items;
}

module.exports = {
  getItems
};
