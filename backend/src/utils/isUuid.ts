//UUIDs are: 92184a3a-cf30-4672-9fbd-87d91c2c794b
//the first character in the third block "4672" that is 4, denotes the
//version of uuid. currently, we are using DEFAULT gen_random_uuid() of
//postgres. postgres uses version v4, so it generates a uuid with 4 on that place.
//but, we are not hardhitting to see if it has a 4 on there as we might
//move to use different version of uuid later. maybe v7 but that's for later
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (uuid: string) => {
  return UUID_REGEX.test(uuid);
};

export default isUuid;
