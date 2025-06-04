const tableData = [
  {
    feature: "Basic Journaling with a few prompts and limited storage",
    sprout: true,
    beanPlus: true,
  },
  {
    feature: "Mood tracker and a weekly summary",
    sprout: true,
    beanPlus: true,
  },
  {
    feature: "Get static visual summaries",
    sprout: true,
    beanPlus: true,
  },
  {
    feature: "Advance AI tools like emotion analysis",
    sprout: false,
    beanPlus: true,
  },
  {
    feature: "Enhance themes and personalization options",
    sprout: false,
    beanPlus: true,
  },
  {
    feature: "Unlimited voice recordings and advanced goal-tracking tools",
    sprout: false,
    beanPlus: true,
  },
  {
    feature: "Data export for reflection or printing",
    sprout: false,
    beanPlus: true,
  },
  {
    feature: "Download the animated summaries or movies",
    sprout: false,
    beanPlus: true,
  },
  {
    feature: "Themed packs for more customization",
    sprout: false,
    beanPlus: true,
  },
];

export default function PricingComparator() {
  return (
    <section className="pb-8 md:pb-16 mt-[4rem] mb-[2rem] scale-110">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Mobile view (card-based layout) */}
        <div className="flex flex-col gap-8 md:hidden">
          {/* Sprout Plan */}
          <div className="rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-3">Sprout</h3>
            </div>
            <div className="p-4">
              {tableData.map((row, index) => (
                <div
                  key={index}
                  className="flex justify-between py-2 border-b last:border-none"
                >
                  <span className="text-sm">
                    {row.feature}
                  </span>
                  <span>
                    {row.sprout === true ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      row.sprout || "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bean Plus Plan */}
          <div className="rounded-lg border shadow-sm bg-muted">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold mb-3">Bean Plus</h3>
            </div>
            <div className="p-4">
              {tableData.map((row, index) => (
                <div
                  key={index}
                  className="flex justify-between py-2 border-b last:border-none"
                >
                  <span className="text-sm">
                    {row.feature}
                  </span>
                  <span>
                    {row.beanPlus === true ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      row.beanPlus || "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop view (table layout) */}
        <div className="hidden md:block">
          <div className="w-full overflow-auto lg:overflow-visible">
            <table className="w-full border-separate border-spacing-x-3 dark:[--color-muted:var(--color-zinc-900)]">
              <thead className="bg-background sticky top-0">
                <tr className="*:py-4 *:text-left *:font-medium">
                  <th className="lg:w-2/5">Features</th>
                  <th className="space-y-3 px-4">
                    <span className="block">Sprout</span>
                  </th>
                  <th className="bg-muted rounded-t-(--radius) space-y-3 px-4">
                    <span className="block">Bean Plus</span>
                  </th>
                </tr>
              </thead>
              <tbody className="text-caption text-sm">
                {tableData.map((row, index) => (
                  <tr key={index} className="*:border-b *:py-3">
                    <td className="">{row.feature}</td>
                    <td className="px-4">
                      {row.sprout === true ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        row.sprout || "—"
                      )}
                    </td>
                    <td className="bg-muted border-none px-4">
                      <div className="-mb-3 border-b py-3">
                        {row.beanPlus === true ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="size-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          row.beanPlus || "—"
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
