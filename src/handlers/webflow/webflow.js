require("dotenv").config();

const Webflow = require("webflow-api");
const { syncExhibitors } = require("./helpers/syncExhibitors");
const { syncSpeakers } = require("./helpers/syncSpeakers");
const { syncSessions } = require("./helpers/syncSessions");
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
const { getItems } = require("./helpers/get-items");
const {
  getAPIResponse,
  getAPISessions,
  getAPIExhibitors
} = require("./helpers/api-response");
const { COLLECTION_ID } = require("./helpers/collection-ids");

const handler = async (event, context) => {
  const currTime = new Date();
  console.log(`Current Time: ${currTime.toTimeString()}`);

  const swapCardSessions = await getAPISessions(
    getPlanningsQuery,
    getPlanningsVariables
  );
  const swapCardPeople = await getAPIResponse(
    getPeopleQuery,
    getPeopleVariables
  );
  const swapCardExhibitors = await getAPIExhibitors(
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

  // each of these are mutate by the POST API calls to webflow below
  // we need the newly created item in the collection
  // to be able to create a new session
  let exhibitors = [];
  let speakers = [];

  let sessions = [];

  try {
    sessions = await getItems(webflow, COLLECTION_ID.sessions);
    exhibitors = await getItems(webflow, COLLECTION_ID.exhibitors);
    speakers = await getItems(webflow, COLLECTION_ID.speakers);
  } catch (e) {
    console.log(e);
  }

  // const collection = await webflow.collection({ collectionId: COLLECTION_ID.sessions });
  // console.log(collection.fields.map(f => f.slug))

  // // create new speakers
  console.log("\nCREATING AND UPDATING SPEAKERS...\n");
  await syncSpeakers(webflow, speakers, swapCardPeople);

  // create new exhibitors
  console.log("\nCREATING AND UPDATING EXHIBITORS...\n");
  await syncExhibitors(webflow, exhibitors, swapCardExhibitors, speakers);

  // create new sessions
  console.log("\nCREATING AND UPDATING SESSIONS...\n");
  await syncSessions(
    webflow,
    sessions,
    eventSlug.data.event.slug,
    swapCardSessions,
    speakers,
    exhibitors
  );

  return { message: "Success" };
};

handler();
