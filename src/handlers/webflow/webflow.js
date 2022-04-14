const Webflow = require("webflow-api");
const { createNewExhibitors } = require("./helpers/createNewExhibitors");
const { createNewSpeakers } = require("./helpers/createNewSpeakers");
const {
  getEventSlugQuery,
  getEventSlugVariables
} = require("./helpers/event-query");
const {
  getPlanningsQuery,
  getPlanningsVariables
} = require("./helpers/plannings-query");
const {
  getExhibitorsQuery,
  getExhibitorVariables
} = require("./helpers/exhibitors-query");
const {
  getPeopleQuery,
  getPeopleVariables
} = require("./helpers/people-query");
const { getAPIResponse } = require("./helpers/api-response");
const { COLLECTION_ID } = require("./helpers/collection-ids");
const { createNewSessions } = require("./helpers/createNewSessions");

exports.handler = async (event, context) => {
  const currTime = new Date();
  console.log(`Current Time: ${currTime.toTimeString()}`);

  const swapCardSessions = await getAPIResponse(
    getPlanningsQuery,
    getPlanningsVariables
  );
  const swapCardPeople = await getAPIResponse(
    getPeopleQuery,
    getPeopleVariables
  );
  const swapCardExhibitors = await getAPIResponse(
    getExhibitorsQuery,
    getExhibitorVariables
  );
  const eventSlug = await getAPIResponse(
    getEventSlugQuery,
    getEventSlugVariables
  );

  const webflow = new Webflow({
    token: process.env.WEBFLOW_ACCESS_TOKEN
  });

  // get all the items for a collection
  const getSessionItems = webflow.items(
    { collectionId: COLLECTION_ID.sessions },
    { limit: 100 }
  );

  const getExhibitorItems = webflow.items(
    { collectionId: COLLECTION_ID.exhibitors },
    { limit: 100 }
  );

  const getSpeakerItems = webflow.items(
    { collectionId: COLLECTION_ID.speakers },
    { limit: 100 }
  );

  // each of these are mutate by the POST API calls to webflow below
  // we need the newly created item in the collection
  // to be able to create a new session
  let exhibitors = [];
  let speakers = [];

  let sessions = [];

  try {
    [sessions, exhibitors, speakers] = await Promise.all([
      getSessionItems,
      getExhibitorItems,
      getSpeakerItems
    ]);
  } catch (e) {
    console.log(e);
  }

  // const collection = await webflow.collection({ collectionId: COLLECTION_ID.sessions });
  // console.log(collection.fields.map(f => f.slug))

  // create new speakers
  console.log("\nCREATING NEW SPEAKERS...");
  await createNewSpeakers(webflow, speakers, swapCardPeople);

  // create new exhibitors
  console.log("CREATING NEW EXHIBITORS...");
  await createNewExhibitors(webflow, exhibitors, swapCardExhibitors, speakers);

  // create new sessions
  console.log("CREATING NEW SESSIONS...\n");
  await createNewSessions(
    webflow,
    sessions,
    eventSlug.data.event.slug,
    swapCardSessions,
    speakers,
    exhibitors
  );

  return { message: "Success" };
};
