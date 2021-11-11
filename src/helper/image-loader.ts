import log from "loglevel";
import fs from 'fs/promises';
import path from 'path';
import { imagePaths } from "../config/image-paths";

export async function getTraitImages(traits: number[]): Promise<Buffer[]> {
  log.info('loading trait images', traits);

  const imageReadingPromises = [
    // background
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[1].path,
      imagePaths.traits[1].types[traits[1]].background,
    )),
    // shadow
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[1].path,
      imagePaths.traits[1].types[traits[1]].shadow,
    )),
    // aura
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[0].path,
      imagePaths.traits[0].types[traits[0]],
    )),
    // board
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[1].path,
      imagePaths.traits[1].types[traits[1]].board,
    )),
    // body tail
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[5].path,
      imagePaths.traits[5].types[traits[5]].tail,
    )),
    // shell back
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[2].path,
      imagePaths.traits[2].types[traits[2]][traits[0]].back,
    )),
    // body base
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[5].path,
      imagePaths.traits[5].types[traits[5]].base,
    )),
    // shell front
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[2].path,
      imagePaths.traits[2].types[traits[2]][traits[0]].front,
    )),
    // eyes
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[3].path,
      imagePaths.traits[3].types[traits[3]],
    )),
    // mouth
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[4].path,
      imagePaths.traits[4].types[traits[4]],
    )),
    // jewellery
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[7].path,
      imagePaths.traits[7].types[traits[7]],
    )),
    // hair-headgear
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[6].path,
      imagePaths.traits[6].types[traits[6]],
    )),
    // shoes
    fs.readFile(path.join(
      imagePaths.path,
      imagePaths.traits[8].path,
      imagePaths.traits[8].types[traits[8]],
    )),
  ];

  return Promise.all(imageReadingPromises);
}
