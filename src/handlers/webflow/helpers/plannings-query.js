const getPlanningsQuery = `
  query getEventSessionData($eventId: String!, $page: Int!) {
    plannings(eventId: $eventId, page: $page, pageSize: 1000) {
        id
        title 
        type
        description
        bannerUrl
        endsAt
        beginsAt
        place
        categories
        speakers {
          id
          firstName
          lastName
          jobTitle
          biography
          organization
          photoUrl
          socialNetworks {
            type
            profile
          }
          
        }
        exhibitors {
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
  }`;

const getPlanningsVariables = (page) => {
  return {
    eventId: `RXZlbnRfODEyMjIx`,
    page: page
  };
};

module.exports = {
  getPlanningsQuery,
  getPlanningsVariables
};
