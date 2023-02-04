import _fetch from "node-fetch";
// @ts-ignore
import { AbortController, abortableFetch } from "abortcontroller-polyfill/dist/cjs-ponyfill";

const { fetch, Request } = abortableFetch(_fetch);

global.fetch = fetch;
global.Request = Request;
// @ts-ignore
global.AbortController = AbortController;
