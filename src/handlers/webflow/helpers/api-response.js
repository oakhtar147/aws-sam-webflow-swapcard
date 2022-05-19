const fetch = require("isomorphic-fetch");

const ENDPOINT = `https://developer.swapcard.com/event-admin/graphql`;

async function getAPIResponse(query, variables) {
  const output = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: process.env.SWAPCARD_PERSONAL_ACCESS_TOKEN
    },
    body: JSON.stringify({ query, variables })
  }).then((res) => res.json());

  return output;
}

async function getAPISessions(query, planningQueryVariables) {
  let page = 1;
  const apiSessions = await getAPIResponse(query, planningQueryVariables(page));
  let newApiSessions;
  while (true) {
    page++;
    newApiSessions = await getAPIResponse(query, planningQueryVariables(page));
    if (newApiSessions.data.plannings.length === 0) {
      break;
    }
    apiSessions.data.plannings.push(...newApiSessions.data.plannings);
  }
  return apiSessions;
}

async function getAPIExhibitors(query, exhibitorsQueryVariables) {
  let page = 1;
  const apiExhibitors = await getAPIResponse(
    query,
    exhibitorsQueryVariables(page)
  );
  let newApiExhibitors;
  while (true) {
    page++;
    newApiExhibitors = await getAPIResponse(
      query,
      exhibitorsQueryVariables(page)
    );
    if (newApiExhibitors.data.exhibitors.length === 0) {
      break;
    }
    apiExhibitors.data.exhibitors.push(...newApiExhibitors.data.exhibitors);
  }
  return apiExhibitors;
}

module.exports = {
  getAPIResponse,
  getAPISessions,
  getAPIExhibitors
};
