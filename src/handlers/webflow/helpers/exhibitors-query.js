const getExhibitorsQuery = `
  query getEventExhibitorsData($eventId: String!, $page: Int!) {
    exhibitors(eventId: $eventId, page: $page, pageSize: 1000) {
      id
      name
      type
      booth
      banner {
        imageUrl
      }
      logoUrl
      backgroundImageUrl
      description
      websiteUrl
      members(eventId: $eventId, page: 1, pageSize: 1000) {
        id
        firstName
        lastName
      }
      socialNetworks {
        profile
        type
      }
      address {
        city
        country
        place
        state
        street
        zipCode
      }
    }
  }
`;

const getExhibitorVariables = (page) => {
  return {
    eventId: `RXZlbnRfODEyMjIx`,
    page: page
  };
};

module.exports = {
  getExhibitorsQuery,
  getExhibitorVariables
};
