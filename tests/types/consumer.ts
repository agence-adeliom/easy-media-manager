// Consumer code typechecked against dist/esm through the package exports
// (`npm run test:types`). Each @ts-expect-error proves a type is not `any`.
import EasyMediaDefault, { EasyMedia, type EasyMediaRoutes, type MediaItem, type PickOptions } from "@agence-adeliom/easy-media-manager";
import { defineEasyMediaPlugin, getJson } from "@agence-adeliom/easy-media-manager/plugin-sdk";

const options: PickOptions = { restrictions: { types: "images" } };
const picked: Promise<MediaItem | null> = EasyMedia.pick(options);
const sameApi: typeof EasyMedia = EasyMediaDefault;

// @ts-expect-error unknown method
EasyMedia.doesNotExist();

// @ts-expect-error `files` must be a string
const routes: Partial<EasyMediaRoutes> = { files: 42 };

const plugin = defineEasyMediaPlugin;
const fetched: Promise<unknown> = getJson("/media");

export { fetched, picked, plugin, routes, sameApi };
