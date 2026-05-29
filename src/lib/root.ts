export const ROOT_ELEMENT_ID = "easy-media-react-root";

let rootElement: HTMLElement | null = null;

export function setRootElement(element: HTMLElement | null): void {
  rootElement = element;
}

export function getRootElement(): HTMLElement | null {
  return rootElement;
}

/**
 * Cible de portail pour les modales : on reste dans le scope `.easy-media`
 * afin que la CSS préfixée s'applique. Fallback sur l'id puis le body.
 */
export function getPortalTarget(): HTMLElement {
  return (
    rootElement ??
    document.getElementById(ROOT_ELEMENT_ID) ??
    document.body
  );
}
