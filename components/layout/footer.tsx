export function Footer() {
  return (
    <footer className="w-full border-t-[2px] border-ink bg-bg-warm py-3 px-6 flex items-center justify-center">
      <p className="font-body text-xs text-text-3 text-center">
        © 2026 Hoshin Kanri OS. Design by{' '}
        <a
          href="https://www.facebook.com/vuhai.fitness"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent-brand underline underline-offset-2 hover:text-accent-dark transition-colors duration-150"
        >
          Vũ Hải | Business Consultant
        </a>
      </p>
    </footer>
  )
}
