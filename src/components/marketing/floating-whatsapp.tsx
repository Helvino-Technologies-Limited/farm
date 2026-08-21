function normalizeWhatsAppNumber(raw: string): string {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("0")) digits = "254" + digits.slice(1);
  return digits;
}

export function FloatingWhatsApp({ number }: { number?: string | null }) {
  if (!number) return null;
  const target = normalizeWhatsAppNumber(number);
  if (!target) return null;

  return (
    <a
      href={`https://wa.me/${target}?text=${encodeURIComponent("Hi Avepo Smart Farm, I'd like to know more about your products and services.")}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-avepo-green"
    >
      <span className="sr-only">Chat with us on WhatsApp</span>
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.31.64 4.47 1.75 6.32L4 29l7.86-1.71A11.94 11.94 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm6.98 17.02c-.294.83-1.462 1.522-2.4 1.72-.638.13-1.47.234-4.27-.918-3.582-1.48-5.884-5.09-6.064-5.328-.174-.238-1.454-1.936-1.454-3.692s.9-2.62 1.222-2.978c.32-.358.7-.448.933-.448.234 0 .467.002.672.012.216.01.505-.082.79.604.294.706.998 2.436 1.086 2.614.088.178.146.386.03.624-.118.238-.176.386-.35.594-.176.208-.37.464-.528.624-.176.176-.36.368-.154.72.204.352.908 1.5 1.95 2.428 1.34 1.196 2.47 1.566 2.822 1.742.35.176.556.148.762-.088.206-.238.878-1.026 1.114-1.378.234-.352.47-.294.79-.176.32.118 2.036.96 2.386 1.136.35.176.584.264.67.412.088.148.088.856-.206 1.686Z" />
      </svg>
    </a>
  );
}
