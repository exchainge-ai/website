import { BrandWordmark } from "@/components/shared/BrandWordmark";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gray-950 text-white py-12">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,247,125,0.12),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <BrandWordmark className="text-2xl tracking-tight" />
            <p className="max-w-sm text-sm text-gray-400">
              The marketplace for verified physical AI datasets, pairing trusted hardware partners with builders shaping the future.
            </p>
          </div>

          {[
            {
              heading: "Platform",
              links: ["Browse Datasets", "List Your Data", "API Access"],
            },
            {
              heading: "Resources",
              links: ["Documentation", "Research Papers", "Support"],
            },
            {
              heading: "Company",
              links: ["About", "Careers", "Contact"],
            },
          ].map((column) => (
            <div key={column.heading}>
              <h4 className="text-lg font-semibold text-white">{column.heading}</h4>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} exchainge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
