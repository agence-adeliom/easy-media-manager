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
    <div className="emm:fixed emm:inset-0 emm:z-[70] emm:flex emm:items-center emm:justify-center emm:bg-emm-neutral-900/45 emm:p-4 emm:backdrop-blur-[2px]">
      <button aria-label="Close plugin modal" className="emm:absolute emm:inset-0 emm:cursor-default" onClick={close} type="button" />
      <section className="emm:relative emm:z-10 emm:w-full emm:max-w-lg emm:rounded-2xl emm:border emm:border-emm-neutral-200 emm:bg-emm-surface emm:p-6 emm:shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="emm:mb-4 emm:flex emm:items-start emm:justify-between emm:gap-4">
          <div>
            <p className="emm:mb-1 emm:text-xs emm:font-semibold emm:uppercase emm:tracking-[0.2em] emm:text-emm-accent-700">External plugin</p>
            <h2 className="emm:mb-0 emm:text-2xl emm:font-semibold emm:tracking-tight emm:text-emm-neutral-900">Plugin diagnostics</h2>
          </div>
          <button className="emm:rounded-full emm:border emm:border-emm-neutral-200 emm:px-3 emm:py-1 emm:text-sm emm:text-emm-neutral-600 emm:hover:bg-emm-neutral-50" onClick={close} type="button">
            Close
          </button>
        </div>
        <dl className="emm:grid emm:gap-3 emm:rounded-2xl emm:bg-emm-neutral-50 emm:p-4 emm:text-sm emm:text-emm-neutral-700">
          <div className="emm:flex emm:items-center emm:justify-between emm:gap-4">
            <dt className="emm:font-medium emm:text-emm-neutral-500">Mode</dt>
            <dd className="emm:font-mono emm:text-emm-neutral-900">{context.mode}</dd>
          </div>
          <div className="emm:flex emm:items-center emm:justify-between emm:gap-4">
            <dt className="emm:font-medium emm:text-emm-neutral-500">Current path</dt>
            <dd className="emm:truncate emm:font-mono emm:text-emm-neutral-900">{context.currentPath || "/"}</dd>
          </div>
          <div className="emm:flex emm:items-center emm:justify-between emm:gap-4">
            <dt className="emm:font-medium emm:text-emm-neutral-500">Current folder id</dt>
            <dd className="emm:font-mono emm:text-emm-neutral-900">{context.currentFolderId ?? "root"}</dd>
          </div>
          <div className="emm:flex emm:items-center emm:justify-between emm:gap-4">
            <dt className="emm:font-medium emm:text-emm-neutral-500">Selected file</dt>
            <dd className="emm:truncate emm:font-mono emm:text-emm-neutral-900">{context.selectedFile?.name ?? "none"}</dd>
          </div>
          <div className="emm:flex emm:items-center emm:justify-between emm:gap-4">
            <dt className="emm:font-medium emm:text-emm-neutral-500">Bulk selection</dt>
            <dd className="emm:font-mono emm:text-emm-neutral-900">{context.bulkList.length}</dd>
          </div>
        </dl>
        <div className="emm:mt-5 emm:flex emm:justify-end emm:gap-3">
          <button
            className="emm:rounded-full emm:border emm:border-emm-neutral-200 emm:px-4 emm:py-2 emm:text-sm emm:font-medium emm:text-emm-neutral-700 emm:hover:bg-emm-neutral-50"
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
