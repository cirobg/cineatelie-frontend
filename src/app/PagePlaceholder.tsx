/** Stands in for every screen not yet built (M2+). Keeps the nav/route table real and
 * navigable now, without pretending a feature exists before it does. */
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div>
      <p style={{ color: "var(--brand-gray)" }}>Em construção.</p>
      <p style={{ fontSize: "var(--font-size-5)", color: "var(--brand-gray)" }}>
        {title} chega em uma etapa futura.
      </p>
    </div>
  );
}
