/** CMD shell host — React mounts CmdPanel into #cmdContent from the engine. */
export function CmdMain() {
  return (
    <main id="cmdView" className="hidden">
      <div id="cmdContent" />
    </main>
  );
}
