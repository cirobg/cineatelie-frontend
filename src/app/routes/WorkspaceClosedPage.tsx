/** Reachable on `403 tenant_closed` (BR-TEN-09, frontend spec §5.10 and §8). The full closure
 * screen (countdown, export download, reopen) is launch dependency B5 -- this is only the
 * routing target for now. */
export function WorkspaceClosedPage() {
  return (
    <div>
      <h1>Workspace encerrado</h1>
      <p>Este workspace foi encerrado.</p>
    </div>
  );
}
