import { useMutation } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  defineEasyMediaPlugin,
  getPluginModalId,
  PluginModalShell,
  type EasyMediaPlugin,
  type EasyMediaPluginModalProps,
} from '@agence-adeliom/easy-media-manager/plugin-sdk';

import { generateAltClient } from './api';

const GENERATE_ALT_PLUGIN_ID = 'generate-alt';
const GENERATE_ALT_MODAL_ID = 'main';


function GenerateAltPluginModal({ close, context }: EasyMediaPluginModalProps) {
  const { routes, selectedFile, bulkList, t } = context;

  const mutation = useMutation({
    mutationFn: async (scope: 'single' | 'emm:group' | 'all') => {
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

      if (scope === 'emm:group') {
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
      <div className="emm:space-y-4 emm:py-3">
        <div className="emm:flex emm:flex-wrap emm:gap-2">
          <button
            className="emm:rounded-lg emm:border emm:border-emm-neutral-200 emm:px-4 emm:py-2 emm:text-sm emm:font-medium emm:text-emm-neutral-700 emm:hover:bg-emm-neutral-50 emm:disabled:opacity-40"
            disabled={selectedFile === null || mutation.isPending}
            onClick={() => mutation.mutate('single')}
            type="button"
          >
            {t('plugins.generate_alt.selected_file')}
          </button>
          <button
            className="emm:rounded-lg emm:border emm:border-emm-neutral-200 emm:px-4 emm:py-2 emm:text-sm emm:font-medium emm:text-emm-neutral-700 emm:hover:bg-emm-neutral-50 emm:disabled:opacity-40"
            disabled={bulkList.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate('emm:group')}
            type="button"
          >
            {t('plugins.generate_alt.group')}
          </button>
          <button
            className="emm:rounded-lg emm:bg-emm-neutral-900 emm:px-4 emm:py-2 emm:text-sm emm:font-medium emm:text-emm-inverse emm:hover:bg-emm-neutral-700 emm:disabled:opacity-40"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('all')}
            type="button"
          >
            {t('plugins.generate_alt.all')}
          </button>
        </div>
        {mutation.data ? (
          <pre className="emm:overflow-x-auto emm:rounded-xl emm:bg-emm-neutral-100 emm:p-3 emm:text-xs">
            {JSON.stringify(mutation.data, null, 2)}
          </pre>
        ) : null}
        {mutation.error ? (
          <p className="emm:text-sm emm:text-emm-danger-600">{mutation.error.message}</p>
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
