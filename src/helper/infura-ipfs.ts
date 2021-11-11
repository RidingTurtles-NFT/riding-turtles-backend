import log from "loglevel";
import axios from 'axios';
import FormData from 'form-data';

const addUrl = `${process.env.INFURA_IPFS_PROTOCOL}://${process.env.INFURA_IPFS_HOST}:${process.env.INFURA_IPFS_PORT}/api/v0/add`;
const authHeader = {
  username: process.env.INFURA_IPFS_PROJECT_ID!,
  password: process.env.INFURA_IPFS_PROJECT_SECRET!,
}

export async function uploadImageToIpfs(picture: Buffer): Promise<string> {
  const form = new FormData();
  form.append('path', picture);

  const result = await axios.post<{ Hash: string }>(
    addUrl,
    form,
    { auth: authHeader, headers: form.getHeaders() }
  ).catch(err => {
    log.error('error while uploading image to IPFS', err);
    throw err;
  });

  const cid = result.data.Hash

  log.info('uploaded image to IPFS', cid);

  return cid;
}
