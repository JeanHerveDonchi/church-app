import type { MouseEvent } from 'react'

const preventNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
  event.preventDefault()
}

export function Footer() {
  return (
    <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-6 pt-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <nav aria-label="Footer" className="flex flex-wrap items-center gap-4">
        <a
          className="transition hover:text-stone-950 focus:outline-none focus:text-stone-950"
          href="#privacy"
          onClick={preventNavigation}
        >
          Politique de confidentialite
        </a>
        <a
          className="transition hover:text-stone-950 focus:outline-none focus:text-stone-950"
          href="#contact"
          onClick={preventNavigation}
        >
          Nous contacter
        </a>
      </nav>

      <p>© DonchiHerve</p>
    </footer>
  )
}
