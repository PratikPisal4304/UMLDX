// global.d.ts
export { };

declare global {
  interface Window {
    mermaid: {
      initialize: (config: Record<string, unknown>) => void;
      contentLoaded: () => void;
      render: (id: string, graphDefinition: string, callback?: (svgCode: string) => void) => void;
    };
  }
}
