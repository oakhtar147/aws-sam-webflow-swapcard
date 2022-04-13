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

module.exports = {
  getAPIResponse
};
