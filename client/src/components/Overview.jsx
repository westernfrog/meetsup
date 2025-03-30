export default function Overview({ children }) {
  return (
    <>
      <section className="xl:col-span-9 md:col-span-8 row-span-20 bg-primary rounded-lg ring-1 ring-gray-200">
        {children}
      </section>
    </>
  );
}
