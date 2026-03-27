import { Info } from "lucide-react";
import { createPortal } from "react-dom";

import {
  defineEasyMediaPlugin,
  getPluginModalId,
  registerEasyMediaPlugin,
  type EasyMediaPluginModalProps,
} from "@/plugin-sdk";

const DEV_PLUGIN_ID = "dev-external-plugin";
const DEV_MODAL_ID = "inspector";

function DevExternalPluginModal({ close, context }: EasyMediaPluginModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <button aria-label="Close plugin modal" className="absolute inset-0 cursor-default" onClick={close} type="button" />
      <section className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">External plugin</p>
            <h2 className="mb-0 text-2xl font-semibold tracking-tight text-slate-900">Plugin diagnostics</h2>
          </div>
          <button className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50" onClick={close} type="button">
            Close
          </button>
        </div>
        <dl className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-500">Mode</dt>
            <dd className="font-mono text-slate-900">{context.mode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-500">Current path</dt>
            <dd className="truncate font-mono text-slate-900">{context.currentPath || "/"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-500">Current folder id</dt>
            <dd className="font-mono text-slate-900">{context.currentFolderId ?? "root"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-500">Selected file</dt>
            <dd className="truncate font-mono text-slate-900">{context.selectedFile?.name ?? "none"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-slate-500">Bulk selection</dt>
            <dd className="font-mono text-slate-900">{context.bulkList.length}</dd>
          </div>
        </dl>
        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              context.runtime.refresh();
              close();
            }}
            type="button"
          >
            Refresh manager
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

const devExternalPlugin = defineEasyMediaPlugin({
  id: DEV_PLUGIN_ID,
  translations: {
    "plugins.dev_external.action": "Open plugin diagnostics",
  },
  toolbarActions: [
    {
      id: "open-diagnostics",
      pluginId: DEV_PLUGIN_ID,
      icon: Info,
      labelKey: "plugins.dev_external.action",
      section: "utility",
      isVisible() {
        return true;
      },
      onClick(context) {
        context.runtime.openModal(getPluginModalId(DEV_PLUGIN_ID, DEV_MODAL_ID));
      },
    },
  ],
  modals: [
    {
      id: DEV_MODAL_ID,
      pluginId: DEV_PLUGIN_ID,
      component: DevExternalPluginModal,
    },
  ],
});

registerEasyMediaPlugin(devExternalPlugin);

export default devExternalPlugin;
