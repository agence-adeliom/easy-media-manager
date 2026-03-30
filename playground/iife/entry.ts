// Playground IIFE entry — bundles the library and exposes shared deps as globals
// so that separately-built plugin IIFEs can use them without bundling React twice.
// Do NOT use this as the distribution build entry (use src/index.ts instead).
import React from 'react';
import * as ReactQuery from '@tanstack/react-query';
import * as Sonner from 'sonner';

import {
  defineEasyMediaPlugin,
  registerEasyMediaPlugin,
  getPluginModalId,
  PluginModalShell,
  EasyMediaApiError,
  getJson,
  postJson,
  postVoid,
} from '@adeliom/easy-media-manager/plugin-sdk';

export * from '../../src/index';

// Expose shared dependencies so plugin IIFEs can reference them as globals
// instead of bundling their own copies (which would break React hook rules).
const w = window as any;
w.React = React;
w.ReactQuery = ReactQuery;
w.Sonner = Sonner;
w.EasyMediaPluginSDK = {
  defineEasyMediaPlugin,
  registerEasyMediaPlugin,
  getPluginModalId,
  PluginModalShell,
  EasyMediaApiError,
  getJson,
  postJson,
  postVoid,
};
