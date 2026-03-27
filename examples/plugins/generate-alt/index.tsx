import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  defineEasyMediaPlugin,
  getPluginModalId,
  PluginModalShell,
  type EasyMediaPlugin,
  type EasyMediaPluginModalProps,
} from '@adeliom/easy-media-manager/plugin-sdk';

import { generateAltClient } from './api';

const GENERATE_ALT_PLUGIN_ID = 'generate-alt';
const GENERATE_ALT_MODAL_ID = 'main';


function GenerateAltPluginModal({ close, context }: EasyMediaPluginModalProps) {
  const { routes, selectedFile, bulkList, t } = context;

  const mutation = useMutation({
    mutationFn: async (scope: 'single' | 'group' | 'all') => {
      if (!routes) {
        throw new Error(t('routes_unavailable'));
      }

      if (scope === 'single') {
        if (!routes.generateAlt || selectedFile === null) {
          throw new Error(t('plugins.generate_alt.single_unavailable'));
        }

        return generateAltClient.generateAlt(routes.generateAlt, {
          file: { id: selectedFile.id },
          path: selectedFile.path,
        });
      }

      if (scope === 'group') {
        if (!routes.generateAltGroup) {
          throw new Error(t('plugins.generate_alt.group_unavailable'));
        }

        return generateAltClient.generateAltGroup(routes.generateAltGroup, {
          files: bulkList.map((item) => item.id),
        });
      }

      if (!routes.generateAllAlt) {
        throw new Error(t('plugins.generate_alt.all_unavailable'));
      }

      return generateAltClient.generateAllAlt(routes.generateAllAlt);
    },
    onSuccess: () => {
      toast.success(t('plugins.generate_alt.started'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <PluginModalShell title={t('plugins.generate_alt.title')} close={close}>
      <div className="space-y-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            disabled={selectedFile === null || mutation.isPending}
            onClick={() => mutation.mutate('single')}
            type="button"
          >
            {t('plugins.generate_alt.selected_file')}
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            disabled={bulkList.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate('group')}
            type="button"
          >
            {t('plugins.generate_alt.group')}
          </button>
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('all')}
            type="button"
          >
            {t('plugins.generate_alt.all')}
          </button>
        </div>
        {mutation.data ? (
          <pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs">
            {JSON.stringify(mutation.data, null, 2)}
          </pre>
        ) : null}
        {mutation.error ? (
          <p className="text-sm text-red-600">{mutation.error.message}</p>
        ) : null}
      </div>
    </PluginModalShell>
  );
}

export const generateAltPlugin: EasyMediaPlugin = defineEasyMediaPlugin({
  id: GENERATE_ALT_PLUGIN_ID,
  translations: {
    en: {
      'plugins.generate_alt.title':              'Generate alt',
      'plugins.generate_alt.action':             'Generate alt',
      'plugins.generate_alt.group':              'Generate alt for selection',
      'plugins.generate_alt.all':                'Generate alt for all files',
      'plugins.generate_alt.selected_file':      'Generate alt for selected file',
      'plugins.generate_alt.started':            'Alt generation started',
      'plugins.generate_alt.single_unavailable': 'Single-file alt generation is unavailable.',
      'plugins.generate_alt.group_unavailable':  'Bulk alt generation is unavailable.',
      'plugins.generate_alt.all_unavailable':    'Global alt generation is unavailable.',
    },
    fr: {
      'plugins.generate_alt.title':              "Générer l'alt",
      'plugins.generate_alt.action':             "Générer l'alt",
      'plugins.generate_alt.group':              "Générer l'alt pour la sélection",
      'plugins.generate_alt.all':                "Générer l'alt pour tous les fichiers",
      'plugins.generate_alt.selected_file':      "Générer l'alt pour le fichier sélectionné",
      'plugins.generate_alt.started':            'Génération des alts démarrée',
      'plugins.generate_alt.single_unavailable': "La génération d'alt pour un seul fichier n'est pas disponible.",
      'plugins.generate_alt.group_unavailable':  "La génération d'alt en masse n'est pas disponible.",
      'plugins.generate_alt.all_unavailable':    "La génération globale d'alt n'est pas disponible.",
    },
  },
  toolbarActions: [
    {
      id: 'open-modal',
      pluginId: GENERATE_ALT_PLUGIN_ID,
      icon: Sparkles,
      labelKey: 'plugins.generate_alt.action',
      section: 'selection',
      isVisible(context) {
        return Boolean(
          context.features.enableGeneratingAlts
            && context.selectedFile !== null
            && context.selectedFile.type !== 'folder',
        );
      },
      onClick(context) {
        context.runtime.openModal(getPluginModalId(GENERATE_ALT_PLUGIN_ID, GENERATE_ALT_MODAL_ID));
      },
    },
  ],
  modals: [
    {
      id: GENERATE_ALT_MODAL_ID,
      pluginId: GENERATE_ALT_PLUGIN_ID,
      component: GenerateAltPluginModal,
    },
  ],
});

export default generateAltPlugin;
