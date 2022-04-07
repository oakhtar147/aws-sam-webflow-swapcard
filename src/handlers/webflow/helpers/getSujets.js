const { COLLECTION_ID } = require("./collection-ids");

async function getSujets(webflow) {
  const sujets = await webflow.items(
    { collectionId: COLLECTION_ID.sujets },
    { limit: 100 }
  );

  const thematiques = sujets.items
    // .filter((s) => s.thematique)
    .map((t) => ({ name: t.name, id: t._id }));

  return thematiques;
}

module.exports = {
  getSujets
};
