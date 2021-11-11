import log from "loglevel";
import { MetaData } from "../interfaces/meta-data";
import { metadataValues } from "../config/metadata-values";

export function createMetaData(tokenId: number, traits: number[], imageCid: string): MetaData {
  log.info(`create meta data for token id ${tokenId}`, traits, imageCid);

  const metaData = {
    token_id: tokenId,
    name: `RidingTurtle #${tokenId}`,
    description: `The unique and awesome looking RidingTurtle #${tokenId}`,
    image: `ipfs://${imageCid}`,
    external_url: 'https://ridingturtles.com',
    attributes: [],
  } as MetaData;

  // traits.length - 1 because of the 'special' trait (last trait)
  for (let traitsIndex = 0; traitsIndex < traits.length - 1; traitsIndex++) {
    const traitVariation = traits[traitsIndex];

    // for the shell take also the correct level version
    if (traitsIndex === 2) {
      metaData.attributes.push({
        trait_type: metadataValues[traitsIndex].type,
        value: metadataValues[traitsIndex].values[traitVariation][traits[0]],
        // @ts-ignore: does exist one some matadata configs / undefined when not is intended
        display_type: metadataValues[traitsIndex].displayType,
        // @ts-ignore: does exist one some matadata configs / undefined when not is intended
        max_value: metadataValues[traitsIndex].maxValue,
      });
    } else {
      metaData.attributes.push({
        trait_type: metadataValues[traitsIndex].type,
        value: metadataValues[traitsIndex].values[traitVariation],
        display_type: metadataValues[traitsIndex].displayType,
        max_value: metadataValues[traitsIndex].maxValue,
      });
    }
  }

  // the aura attribute is defined by the level (first trait)
  metaData.attributes.push({
    trait_type: metadataValues.aura.type,
    value: metadataValues.aura.values[traits[0]],
  })

  return metaData;
}
