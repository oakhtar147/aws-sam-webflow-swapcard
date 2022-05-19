const sleep = async (ms) => await new Promise((r) => setTimeout(r, ms));

async function webflowRateLimiterWorkaround({
  webflow,
  collectionId,
  callback
}) {
  while (true) {
    const hitIt = async () => {
      const x = await webflow.items(
        { collectionId },
        {
          limit: 1,
          offset: 0
        }
      );

      return x["_meta"].rateLimit.remaining;
    };

    try {
      const response = await callback();
      // console.log(response);
      let webflowRateLimitRemaining = response["_meta"].rateLimit.remaining;
      // console.log({ webflowRateLimitRemaining });

      if (webflowRateLimitRemaining === 0) {
        console.log("-> Webflow rate limit hit. Waiting for it to be reset");
        let hasReset = false;
        while (!hasReset) {
          const result = await hitIt();
          if (result > webflowRateLimitRemaining) {
            hasReset = true;
            return await callback();
          }
        }
      } else {
        // console.log(response);
        return response;
      }
    } catch (e) {
      if (e.code !== 429) {
        console.log("error: ", e);
        break;
      }
      await sleep(2000);
      continue;
    }
  }
}

module.exports = {
  webflowRateLimiterWorkaround
};
